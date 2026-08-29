import { apiClient } from "./client";

export interface Debt {
    id: string;
    businessId: string;
    type: string;
    lender: string;
    amountOutStanding: number;
    totalAmount: number;
    interestRate?: number | null;
    nextPaymentDate?: string | null;
    emiAmount?: number | null;
    status: string;
}

export const debtApi = {
    getDebts: async (params?: { businessId?: string }): Promise<Debt[]> => {
        const response = await apiClient.get<any>("/debts", { params });
        return response.data || response;
    },

    createDebt: async (data: Partial<Debt>): Promise<Debt> => {
        const response = await apiClient.post<any>("/debts", data);
        return response.data || response;
    },

    recordRepayment: async (debtId: string, amount: number): Promise<any> => {
        const response = await apiClient.post<any>(`/debts/${debtId}/repayments`, { amount });
        return response.data || response;
    }
};
