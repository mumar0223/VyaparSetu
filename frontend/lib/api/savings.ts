import { apiClient } from "./client";

export interface SavingGoal {
    id: string;
    businessId: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate?: string | null;
    status: string;
}

export const savingsApi = {
    getGoals: async (params?: { businessId?: string }): Promise<SavingGoal[]> => {
        const response = await apiClient.get<any>("/savings", { params });
        return response.data || response;
    },

    createGoal: async (data: Partial<SavingGoal>): Promise<SavingGoal> => {
        const response = await apiClient.post<any>("/savings", data);
        return response.data || response;
    },

    addContribution: async (goalId: string, amount: number, notes?: string): Promise<any> => {
        const response = await apiClient.post<any>(`/savings/${goalId}/contributions`, { amount, notes });
        return response.data || response;
    }
};
