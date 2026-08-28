import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Savings API', () => {
    const userId = 'test-user-sav';
    let businessId: string;
    let goalId: string;

    beforeAll(async () => {
        await prisma.savingGoal.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'Sav User', email: 'sav@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'Sav Business' });
        businessId = resBiz.body.data.id;
    });

    afterAll(async () => {
        await prisma.savingGoal.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should create a saving goal', async () => {
        const res = await request(app)
            .post(`/api/v1/savings/goals?userId=${userId}`)
            .send({ businessId, name: 'Emergency Fund', targetAmount: 50000 });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.savedAmount).toBe(0);
        goalId = res.body.data.id;
    });

    it('should add a contribution and update percentages', async () => {
        const res = await request(app)
            .post(`/api/v1/savings/goals/${goalId}/contributions?userId=${userId}`)
            .send({ amount: 5000, notes: 'First deposit' });

        expect(res.status).toBe(201);
        expect(res.body.data.savedAmount).toBe(5000);
        expect(res.body.data.completionPercentage).toBe(10);
    });
});
