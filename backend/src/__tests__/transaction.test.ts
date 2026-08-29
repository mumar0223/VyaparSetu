import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Transaction API', () => {
    const userId = 'test-user-tx';
    let businessId: string;
    let transactionId: string;

    beforeAll(async () => {
        await prisma.transaction.deleteMany({});
        await prisma.business.deleteMany({ where: { ownerId: userId } });
        await prisma.user.deleteMany({ where: { id: userId } });

        await prisma.user.create({
            data: { id: userId, name: 'Tx User', email: 'tx@example.com', passwordHash: 'x' }
        });

        const resBiz = await request(app)
            .post(`/api/v1/businesses?userId=${userId}`)
            .send({ businessName: 'Tx Business' });

        businessId = resBiz.body.data.id;
    });

    afterAll(async () => {
        await prisma.transaction.deleteMany({});
        await prisma.business.deleteMany({});
    });

    it('should create a transaction', async () => {
        const res = await request(app)
            .post(`/api/v1/transactions?userId=${userId}`)
            .send({
                businessId,
                type: 'INCOME',
                amount: 1500.0,
                date: new Date().toISOString(),
                category: 'Sales'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        transactionId = res.body.data.id;
    });

    it('should get transactions with filter', async () => {
        const res = await request(app)
            .get(`/api/v1/transactions?businessId=${businessId}&type=INCOME&userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].amount).toBe(1500);
    });

    it('should patch a transaction', async () => {
        const res = await request(app)
            .patch(`/api/v1/transactions/${transactionId}?userId=${userId}`)
            .send({ amount: 2000.0 });

        expect(res.status).toBe(200);
        expect(res.body.data.amount).toBe(2000);
    });
});
