import { apiClient } from "./client";

export interface BorrowingAssessmentRequest {
    requestedAmount: number;
    purpose: string;
    monthlyRevenue: number;
    currentMonthlyDebtPayments: number;
}

export interface BorrowingAssessmentResponse {
    requestedAmount: number;
    estimatedMonthlyPayment: number;
    currentMonthlyDebtPayments: number;
    newTotal: number;
    assessmentMessage: string;
    explanation: string;
}

export interface CreditHealth {
    score: number;
    status: string; // e.g. "Good", "Excellent"
    positives: string[];
    negatives: string[];
    recommendations: string[];
}

export const creditApi = {
    assessBorrowing: async (data: BorrowingAssessmentRequest): Promise<BorrowingAssessmentResponse> => {
        const response = await apiClient.post<any>("/credit/assess", data);
        return response.data || response;
    },

    getHealthScore: async (params?: { businessId?: string }): Promise<CreditHealth> => {
        const response = await apiClient.get<any>("/credit/health", { params });
        return response.data || response;
    }
};
