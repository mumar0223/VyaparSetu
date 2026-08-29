import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

describe('User Profile API', () => {
    const userId = 'test-user-profile';

    beforeAll(async () => {
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.user.create({
            data: { id: userId, name: 'Profile User', email: 'profile@example.com', passwordHash: 'x' }
        });
    });

    it('should fetch user profile', async () => {
        const res = await request(app)
            .get(`/api/v1/profile?userId=${userId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe('profile@example.com');
    });

    it('should update user profile', async () => {
        const res = await request(app)
            .patch(`/api/v1/profile?userId=${userId}`)
            .send({ name: 'Updated Profile User' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Updated Profile User');
    });
});
