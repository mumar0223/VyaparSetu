import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('Business API', () => {
    const userId1 = 'test-user-1';
    const userId2 = 'test-user-2';
    let businessId: string;

    beforeAll(async () => {
        await prisma.business.deleteMany({});
        await prisma.user.deleteMany({ where: { id: { in: [userId1, userId2] } } });

        // Seed minimal users
        await prisma.user.createMany({
            data: [
                { id: userId1, name: 'User 1', email: 'user1@example.com', passwordHash: 'x' },
                { id: userId2, name: 'User 2', email: 'user2@example.com', passwordHash: 'x' },
            ]
        });
    });

    afterAll(async () => {
        await prisma.business.deleteMany({});
    });

    it('should create a business', async () => {
        const res = await request(app)
            .post(`/api/v1/businesses?userId=${userId1}`)
            .send({ businessName: 'Test Business 1', industry: 'Retail' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.businessName).toBe('Test Business 1');
        businessId = res.body.data.id;
    });

    it('should fetch user businesses', async () => {
        const res = await request(app)
            .get(`/api/v1/businesses?userId=${userId1}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].businessName).toBe('Test Business 1');
    });

    it('should not allow user2 to access user1 business', async () => {
        const res = await request(app)
            .get(`/api/v1/businesses/${businessId}?userId=${userId2}`);

        expect(res.status).toBe(404);
    });

    it('should update business if owner', async () => {
        const res = await request(app)
            .patch(`/api/v1/businesses/${businessId}?userId=${userId1}`)
            .send({ category: 'Clothing' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.category).toBe('Clothing');
    });

    it('should delete business if owner', async () => {
        const res = await request(app)
            .delete(`/api/v1/businesses/${businessId}?userId=${userId1}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
