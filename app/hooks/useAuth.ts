import { useAuthContext } from "@/app/contexts/AuthContext";
import type { User } from "@/app/types/auth";

export interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (provider: "Google" | "Facebook", callbackURL?: string) => Promise<void>;
    loginWithEmail: (email: string, password: string, callbackURL?: string) => Promise<void>;
    logout: (redirectTo?: string | unknown) => Promise<void>;
}

/**
 * Public hook for consuming auth state in any client component.
 * Must be rendered inside <AuthProvider>.
 */
export function useAuth(): UseAuthReturn {
    const { user, loading, isAuthenticated, login, loginWithEmail, logout } = useAuthContext();
    return { user, loading, isAuthenticated, login, loginWithEmail, logout };
}
