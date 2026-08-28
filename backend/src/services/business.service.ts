import prisma from '../config/prisma';

export const createBusiness = async (ownerId: string, data: any) => {
    const business = await prisma.business.create({
        data: {
            ...data,
            ownerId
        }
    });
    return business;
};

export const getBusinesses = async (ownerId: string) => {
    const businesses = await prisma.business.findMany({
        where: { ownerId }
    });
    return businesses;
};

export const getBusinessById = async (ownerId: string, businessId: string) => {
    const business = await prisma.business.findFirst({
        where: {
            id: businessId,
            ownerId
        }
    });

    if (!business) {
        throw new Error('Business not found or not authorized');
    }

    return business;
};

export const updateBusiness = async (ownerId: string, businessId: string, data: any) => {
    // First ensure ownership
    await getBusinessById(ownerId, businessId);

    const business = await prisma.business.update({
        where: { id: businessId },
        data
    });

    return business;
};

export const deleteBusiness = async (ownerId: string, businessId: string) => {
    // First ensure ownership
    await getBusinessById(ownerId, businessId);

    await prisma.business.delete({
        where: { id: businessId }
    });

    return { success: true };
};
