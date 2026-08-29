import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Budget API', () => {
    const userId = 'test-user-budget';
    let businessId: string;
    let budgetId: string;

    beforeAll(async () => {
        await prisma.budget.deleteMany({});
        await prisma.expense.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'Bug User', email: 'bug@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'Bug Business' });
        businessId = resBiz.body.data.id;
    });

    afterAll(async () => {
        await prisma.budget.deleteMany({});
        await prisma.expense.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should create a budget', async () => {
        const monthStart = new Date();
        const monthEnd = new Date();
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const res = await request(app)
            .post(`/api/v1/budgets?userId=${userId}`)
            .send({
                businessId,
                name: 'Monthly Budget',
                period: 'MONTHLY',
                startDate: monthStart.toISOString(),
                endDate: monthEnd.toISOString(),
                totalAmount: 1000,
                items: [{ category: 'Marketing', allocatedAmount: 500 }]
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.items.length).toBe(1);
        budgetId = res.body.data.id;
    });

    it('should fetch budget performance factoring in expenses', async () => {
        // Create an expense
        await request(app).post(`/api/v1/expenses?userId=${userId}`).send({
            businessId, category: 'Marketing', amount: 200, date: new Date().toISOString()
        });

        const res = await request(app)
            .get(`/api/v1/budgets/${budgetId}/performance?userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.actualSpending).toBe(200);
        expect(res.body.data.utilizationPercentage).toBe(20);
    });
});
