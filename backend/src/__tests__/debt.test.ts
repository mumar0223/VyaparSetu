import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Debt API', () => {
    const userId = 'test-user-debt';
    let businessId: string;
    let debtId: string;

    beforeAll(async () => {
        await prisma.debt.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'Debt User', email: 'debt@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'Debt Business' });
        businessId = resBiz.body.data.id;
    });

    afterAll(async () => {
        await prisma.debt.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should create a new debt entry', async () => {
        const res = await request(app)
            .post(`/api/v1/debts?userId=${userId}`)
            .send({
                businessId,
                type: 'TERM_LOAN',
                lender: 'HDFC Bank',
                amountOutStanding: 50000,
                totalAmount: 60000,
                interestRate: 10.5,
                emiAmount: 1200
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.lender).toBe('HDFC Bank');
        debtId = res.body.data.id;
    });

    it('should fetch business debts', async () => {
        const res = await request(app)
            .get(`/api/v1/debts?businessId=${businessId}&userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
    });

    it('should update debt status', async () => {
        const res = await request(app)
            .patch(`/api/v1/debts/${debtId}?userId=${userId}`)
            .send({ status: 'PAID' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('PAID');
    });
});
