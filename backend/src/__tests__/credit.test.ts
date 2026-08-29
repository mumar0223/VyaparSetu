import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Credit & Borrowing API', () => {
    const userId = 'test-user-credit';
    let businessId: string;

    beforeAll(async () => {
        await prisma.debt.deleteMany({});
        await prisma.expense.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'Credit User', email: 'credit@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'Credit Business' });
        businessId = resBiz.body.data.id;

        // Seed some financials
        await request(app).post(`/api/v1/transactions?userId=${userId}`)
            .send({ businessId, type: 'INCOME', amount: 10000, date: new Date().toISOString() });
        await request(app).post(`/api/v1/expenses?userId=${userId}`)
            .send({ businessId, category: 'Rent', amount: 2000, date: new Date().toISOString() });
        await request(app).post(`/api/v1/debts?userId=${userId}`)
            .send({ businessId, type: 'TERM_LOAN', lender: 'Bank', amountOutStanding: 1000, totalAmount: 1000, emiAmount: 50 });
    });

    afterAll(async () => {
        await prisma.debt.deleteMany({});
        await prisma.expense.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should calculate business credit score natively', async () => {
        const res = await request(app)
            .get(`/api/v1/finance/business-credit/score?businessId=${businessId}&userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalIncome).toBe(10000);
        expect(res.body.data.totalExpenses).toBe(2000);
        expect(res.body.data.netProfit).toBe(8000);
        expect(res.body.data.creditScore).toBeGreaterThanOrEqual(650);
    });

    it('should calculate borrowing capacity', async () => {
        const res = await request(app)
            .get(`/api/v1/finance/borrowing/capacity?businessId=${businessId}&userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.availableBorrowingCapacityEmi).toBeCloseTo(216.67, 1);
    });
});
