import { apiClient } from "./client";

export interface UserSettings {
    id: string;
    userId: string;
    currency: string;
    language: string;
    theme: string;
    emailAlerts: boolean;
}

export interface PrivacySettings {
    id: string;
    dataSharing: boolean;
    marketingEmails: boolean;
}

export const settingsApi = {
    getSettings: async (): Promise<UserSettings> => {
        const response = await apiClient.get<any>("/settings");
        return response.data || response;
    },

    updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
        const response = await apiClient.patch<any>("/settings", data);
        return response.data || response;
    },

    getPrivacy: async (): Promise<PrivacySettings> => {
        const response = await apiClient.get<any>("/privacy");
        return response.data || response;
    },

    updatePrivacy: async (data: Partial<PrivacySettings>): Promise<PrivacySettings> => {
        const response = await apiClient.patch<any>("/privacy", data);
        return response.data || response;
    }
};
