// -- Role -----------------------------------------------------------------------
export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    SUB_ADMIN = "SUB_ADMIN",
}

/**
 * Reads the role string the backend sends. Anything that is not a known staff role is a plain
 * customer, so a role added on the backend later fails closed here.
 */
export function parseUserRole(raw: string | undefined): UserRole {
    if (raw === "ADMIN") return UserRole.ADMIN;
    if (raw === "SUB_ADMIN") return UserRole.SUB_ADMIN;
    return UserRole.USER;
}

/** A Master admin or a sub-admin: may open the admin panel (a sub-admin only the order pages). */
export function isStaff(role: UserRole | undefined): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUB_ADMIN;
}

// -- User -----------------------------------------------------------------------
export interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: UserRole;
}

// -- Session --------------------------------------------------------------------
export interface Session {
    user: User;
    expiresAt: string;
}

// -- Auth Context ---------------------------------------------------------------
export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (provider: "Google" | "Facebook", callbackURL?: string) => Promise<void>;
    loginWithEmail: (email: string, password: string, callbackURL?: string) => Promise<void>;
    logout: (redirectTo?: string | unknown) => Promise<void>;
    refreshSession: () => Promise<void>;
}
