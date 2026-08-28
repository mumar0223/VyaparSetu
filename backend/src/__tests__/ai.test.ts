import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Phase 6 - AI & Milestones API', () => {
    const userId = 'test-user-ai';
    let businessId: string;
    let milestoneId: string;

    beforeAll(async () => {
        await prisma.transaction.deleteMany({});
        await prisma.businessMilestone.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'AI User', email: 'ai@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'AI Business' });
        businessId = resBiz.body.data.id;

        await request(app).post(`/api/v1/transactions?userId=${userId}`).send({
            businessId, type: 'INCOME', amount: 9000, date: new Date().toISOString()
        });
    });

    afterAll(async () => {
        await prisma.transaction.deleteMany({});
        await prisma.businessMilestone.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should generate mock AI insights based on business data', async () => {
        const res = await request(app)
            .get(`/api/v1/ai/advisor-insights?businessId=${businessId}&userId=${userId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.insights.length).toBeGreaterThan(0);
        expect(res.body.data.context.income).toBe(9000);
    });

    it('should chat with mock AI', async () => {
        const res = await request(app)
            .post(`/api/v1/ai/chat?userId=${userId}`)
            .send({ businessId, query: 'How to manage my debt?' });
        expect(res.status).toBe(200);
        expect(res.body.data.response).toContain('debt');
    });

    it('should track and mark milestones', async () => {
        let res = await request(app)
            .post(`/api/v1/milestones?userId=${userId}`)
            .send({ businessId, title: 'First 10 Customers', date: new Date().toISOString() });
        expect(res.status).toBe(201);
        expect(res.body.data.isAchieved).toBe(false);
        milestoneId = res.body.data.id;

        res = await request(app)
            .patch(`/api/v1/milestones/${milestoneId}/achieve?userId=${userId}`)
            .send({ isAchieved: true });
        expect(res.status).toBe(200);
        expect(res.body.data.isAchieved).toBe(true);

        res = await request(app)
            .get(`/api/v1/milestones?businessId=${businessId}&userId=${userId}`);
        expect(res.body.data.length).toBe(1);
    });
});
