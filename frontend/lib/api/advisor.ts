import { apiClient } from "./client";

export interface Recommendation {
    id: string;
    businessId: string;
    title: string;
    whatHappened: string;
    whyItMatters: string;
    whatToDo: string;
    priority: "High" | "Medium" | "Low";
    isRead: boolean;
    createdAt: string;
}

export const advisorApi = {
    getRecommendations: async (params?: { businessId?: string }): Promise<Recommendation[]> => {
        const response = await apiClient.get<any>("/ai/recommendations", { params });
        return response.data || response;
    },

    markAsRead: async (id: string): Promise<void> => {
        await apiClient.patch(`/ai/recommendations/${id}`, { isRead: true });
    }
};
