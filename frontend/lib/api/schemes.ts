import { apiClient } from "./client";

export interface Scheme {
    id: string;
    name: string;
    description: string;
    benefits: string;
    eligibility: string;
    stateOrRegion: string;
    requiredDocuments: string[];
    applicationUrl?: string | null;
    category: string;
}

export const schemesApi = {
    getSchemes: async (params?: { category?: string; search?: string; state?: string }): Promise<Scheme[]> => {
        const response = await apiClient.get<any>("/schemes", { params });
        return response.data || response;
    },

    getSchemeById: async (id: string): Promise<Scheme> => {
        const response = await apiClient.get<any>(`/schemes/${id}`);
        return response.data || response;
    }
};
