import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Expense API', () => {
    const userId = 'test-user-expense';
    let businessId: string;
    let expenseId: string;

    beforeAll(async () => {
        await prisma.expense.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'Exp User', email: 'exp@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'Exp Business' });

        businessId = resBiz.body.data.id;
    });

    afterAll(async () => {
        await prisma.expense.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should create an expense', async () => {
        const res = await request(app)
            .post(`/api/v1/expenses?userId=${userId}`)
            .send({
                businessId,
                category: 'Rent',
                amount: 500,
                date: new Date().toISOString()
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expenseId = res.body.data.id;
    });

    it('should fetch expenses summary', async () => {
        const res = await request(app)
            .get(`/api/v1/expenses/summary?businessId=${businessId}&userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.total).toBe(500);
        expect(res.body.data.categoryTotals['Rent']).toBe(500);
    });

    it('should soft delete expense', async () => {
        const res = await request(app)
            .delete(`/api/v1/expenses/${expenseId}?userId=${userId}`);

        expect(res.status).toBe(200);

        // Fetching again should not return it
        const res2 = await request(app)
            .get(`/api/v1/expenses?businessId=${businessId}&userId=${userId}`);
        expect(res2.body.data.length).toBe(0);
    });
});
