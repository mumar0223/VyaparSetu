import prisma from '../config/prisma';

beforeAll(async () => {
    // Can connect if needed
});

afterAll(async () => {
    // Teardown
    await prisma.business.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});
