import { apiClient } from "./client";

export interface BudgetItem {
    id: string;
    budgetId: string;
    category: string;
    allocatedAmount: number;
    spentAmount?: number; // Fetched via joins/aggregations in backend
}

export interface Budget {
    id: string;
    businessId: string;
    name: string;
    period: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    items: BudgetItem[];
}

export const budgetApi = {
    getBudgets: async (params?: { businessId?: string }): Promise<Budget[]> => {
        const response = await apiClient.get<any>("/budgets", { params });
        return response.data || response;
    },

    createBudget: async (data: Partial<Budget>): Promise<Budget> => {
        const response = await apiClient.post<any>("/budgets", data);
        return response.data || response;
    },

    getBudgetById: async (id: string): Promise<Budget> => {
        const response = await apiClient.get<any>(`/budgets/${id}`);
        return response.data || response;
    },
};
