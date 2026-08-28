import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Phase 5 - Utilities API', () => {
    const userId = 'test-user-util';
    let businessId: string;
    let expenseId: string;

    beforeAll(async () => {
        await prisma.expense.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.settings.deleteMany({ where: { userId } });
        await prisma.privacyConsent.deleteMany({ where: { userId } });
        await prisma.notification.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'Util User', email: 'util@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'Util Business' });
        businessId = resBiz.body.data.id;
    });

    afterAll(async () => {
        await prisma.expense.deleteMany({});
        await prisma.business.deleteMany({});
        await prisma.settings.deleteMany({});
        await prisma.privacyConsent.deleteMany({});
        await prisma.notification.deleteMany({});
    });

    it('should upsert user settings', async () => {
        let res = await request(app)
            .patch(`/api/v1/settings?userId=${userId}`)
            .send({ currency: 'USD', theme: 'dark' });
        expect(res.status).toBe(200);

        res = await request(app).get(`/api/v1/settings?userId=${userId}`);
        expect(res.body.data.currency).toBe('USD');
        expect(res.body.data.theme).toBe('dark');
    });

    it('should hit public schemes safely', async () => {
        const res = await request(app).get('/api/v1/schemes');
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should manage recycle bin for expenses', async () => {
        // Create an expense
        let res = await request(app)
            .post(`/api/v1/expenses?userId=${userId}`)
            .send({ businessId, category: 'Food', amount: 100, date: new Date().toISOString() });
        expenseId = res.body.data.id;

        // Soft delete
        await request(app).delete(`/api/v1/expenses/${expenseId}?userId=${userId}`);

        res = await request(app).get(`/api/v1/recycle-bin/expenses?businessId=${businessId}&userId=${userId}`);
        expect(res.body.data.length).toBe(1);

        // Restore it
        res = await request(app).post(`/api/v1/recycle-bin/expenses/${expenseId}/restore?userId=${userId}`);
        expect(res.status).toBe(200);

        // Soft delete again and permanent delete
        await request(app).delete(`/api/v1/expenses/${expenseId}?userId=${userId}`);
        res = await request(app).delete(`/api/v1/recycle-bin/expenses/${expenseId}/permanent?userId=${userId}`);
        expect(res.status).toBe(200);

        // Verify permanent deletion
        res = await request(app).get(`/api/v1/recycle-bin/expenses?businessId=${businessId}&userId=${userId}`);
        expect(res.body.data.length).toBe(0);
    });
});
