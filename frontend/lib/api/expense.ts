import { apiClient } from "./client";

export interface Expense {
    id: string;
    businessId: string;
    category: string;
    amount: number;
    date: string;
    vendor?: string | null;
    description?: string | null;
    paymentMethod?: string | null;
    recurring: boolean;
    notes?: string | null;
}

export const expenseApi = {
    getExpenses: async (params?: { businessId?: string; startDate?: string; endDate?: string }): Promise<Expense[]> => {
        const response = await apiClient.get<any>("/expenses", { params });
        return response.data || response;
    },

    createExpense: async (data: Partial<Expense>): Promise<Expense> => {
        const response = await apiClient.post<any>("/expenses", data);
        return response.data || response;
    },

    deleteExpense: async (id: string): Promise<void> => {
        await apiClient.delete(`/expenses/${id}`);
    }
};
