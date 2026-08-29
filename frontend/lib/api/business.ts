import { apiClient } from "./client";

export interface Business {
    id: string;
    ownerId: string;
    businessName: string;
    businessType?: string | null;
    industry?: string | null;
    category?: string | null;
    description?: string | null;
    registrationNumber?: string | null;
    taxNumber?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
    numberOfEmployees?: number | null;
    annualRevenue?: number | null;
    monthlyRevenue?: number | null;
    monthlyExpenses?: number | null;
    businessGoals?: string | null;
}

export const businessApi = {
    getBusinesses: async (): Promise<Business[]> => {
        // Note: Depends on what the backend actually returns, we assume it's data
        const response = await apiClient.get<any>("/business");
        return response.data || response;
    },

    getBusinessById: async (id: string): Promise<Business> => {
        const response = await apiClient.get<any>(`/business/${id}`);
        return response.data || response;
    },

    createBusiness: async (data: Partial<Business>): Promise<Business> => {
        const response = await apiClient.post<any>("/business", data);
        return response.data || response;
    },

    updateBusiness: async (id: string, data: Partial<Business>): Promise<Business> => {
        const response = await apiClient.patch<any>(`/business/${id}`, data);
        return response.data || response;
    },
};
