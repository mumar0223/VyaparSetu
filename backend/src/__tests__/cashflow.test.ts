import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Cash Flow API', () => {
    const userId = 'test-user-cf';
    let businessId: string;

    beforeAll(async () => {
        await prisma.expense.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'CF User', email: 'cf@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'CF Business' });
        businessId = resBiz.body.data.id;

        // Seed some data
        await request(app).post(`/api/v1/transactions?userId=${userId}`).send({
            businessId, type: 'INCOME', amount: 3000, date: new Date().toISOString()
        });
        await request(app).post(`/api/v1/transactions?userId=${userId}`).send({
            businessId, type: 'EXPENSE', amount: 500, date: new Date().toISOString()
        });
        await request(app).post(`/api/v1/expenses?userId=${userId}`).send({
            businessId, category: 'Misc', amount: 200, date: new Date().toISOString()
        });
    });

    afterAll(async () => {
        await prisma.expense.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should calculate cash flow', async () => {
        const res = await request(app)
            .get(`/api/v1/cash-flow?businessId=${businessId}&userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalInflow).toBe(3000);
        expect(res.body.data.totalOutflow).toBe(700);
        expect(res.body.data.netCashFlow).toBe(2300);
    });
});
