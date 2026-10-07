// ── Role ───────────────────────────────────────────────────────────────────────
export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
}

// ── User ───────────────────────────────────────────────────────────────────────
export interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: UserRole;
}

// ── Session ────────────────────────────────────────────────────────────────────
export interface Session {
    user: User;
    expiresAt: string;
}

// ── Auth Context ───────────────────────────────────────────────────────────────
export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (provider: "Google" | "Facebook", callbackURL?: string) => Promise<void>;
    loginWithEmail: (email: string, password: string, callbackURL?: string) => Promise<void>;
    logout: (redirectTo?: string | unknown) => Promise<void>;
    refreshSession: () => Promise<void>;
}
