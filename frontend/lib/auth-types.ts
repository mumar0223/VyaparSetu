export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  mustChangePassword: boolean;
  isActive: boolean;
  lastLoginAt?: Date | null;
  avatar?: string | null;
}

export const ROLE_PRESETS: Record<
  string,
  { label: string; description: string; permissions: string[] }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Full global oversight across all users, permissions, and audit logs.",
    permissions: ["*"],
  },
  USER: {
    label: "Standard User",
    description: "Standard application access.",
    permissions: [],
  },
  CUSTOM: {
    label: "Custom Role",
    description: "Tailored granular permissions.",
    permissions: [],
  },
};
