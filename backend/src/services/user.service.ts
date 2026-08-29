import prisma from '../config/prisma';

export const getUserProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

export const updateUserProfile = async (userId: string, data: any) => {
    const { name, phone } = data;

    if (phone) {
        const existingPhone = await prisma.user.findFirst({
            where: { phone, id: { not: userId } }
        });

        if (existingPhone) {
            throw new Error('Phone number is already in use by another account');
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            name: name !== undefined ? name : undefined,
            phone: phone !== undefined ? phone : undefined
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return updatedUser;
};
