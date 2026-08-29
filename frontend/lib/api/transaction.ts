import { apiClient } from "./client";

export interface Transaction {
    id: string;
    businessId: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER" | "DEBT_PAYMENT" | "SAVING" | "OTHER";
    amount: number;
    date: string;
    category?: string | null;
    description?: string | null;
    referenceId?: string | null;
}

export const transactionApi = {
    getTransactions: async (params?: { businessId?: string }): Promise<Transaction[]> => {
        const response = await apiClient.get<any>("/transactions", { params });
        return response.data || response;
    },

    createTransaction: async (data: Partial<Transaction>): Promise<Transaction> => {
        const response = await apiClient.post<any>("/transactions", data);
        return response.data || response;
    },

    deleteTransaction: async (id: string): Promise<void> => {
        await apiClient.delete(`/transactions/${id}`);
    }
};
