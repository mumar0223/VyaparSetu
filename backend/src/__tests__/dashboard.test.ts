import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Dashboard API', () => {
    const userId = 'test-user-dash';
    let businessId: string;

    beforeAll(async () => {
        await prisma.expense.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'Dash User', email: 'dash@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'Dash Business' });
        businessId = resBiz.body.data.id;

        // Seed some data
        await request(app).post(`/api/v1/transactions?userId=${userId}`).send({
            businessId, type: 'INCOME', amount: 5000, date: new Date().toISOString()
        });
        await request(app).post(`/api/v1/expenses?userId=${userId}`).send({
            businessId, category: 'Utilities', amount: 300, date: new Date().toISOString()
        });
    });

    afterAll(async () => {
        await prisma.expense.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should fetch dashboard info correctly resolving transactions and expenses', async () => {
        const res = await request(app)
            .get(`/api/v1/dashboard?businessId=${businessId}&userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalIncome).toBe(5000);
        expect(res.body.data.totalExpenses).toBe(300);
        expect(res.body.data.netProfit).toBe(4700);
    });
});
