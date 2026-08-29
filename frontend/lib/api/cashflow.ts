import { apiClient } from "./client";

export interface CashFlowSummary {
    period: string;
    moneyIn: number;
    moneyOut: number;
    difference: number;
    expectedMoneyIn?: number;
    expectedMoneyOut?: number;
}

export const cashflowApi = {
    getSummary: async (params?: { businessId?: string; period?: string }): Promise<CashFlowSummary> => {
        const response = await apiClient.get<any>("/cashflow/summary", { params });
        return response.data || response;
    }
};
