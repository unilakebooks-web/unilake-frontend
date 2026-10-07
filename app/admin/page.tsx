"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { UserRole } from "@/app/types/auth";
import { toast } from "sonner";

// ── LoadingScreen ──────────────────────────────────────────────────────────────
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#3F3C95] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <svg
                    className="animate-spin h-10 w-10 text-[#FFAF00]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-label="Loading"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-[#FFAF00] font-bold text-lg">Verifying admin access…</p>
            </div>
        </div>
    );
}

// ── Admin Traffic Router ────────────────────────────────────────────────────────
export default function AdminPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (isAuthenticated && user?.role === UserRole.ADMIN) {
            router.replace("/admin/overview");
        } else if (isAuthenticated && user?.role !== UserRole.ADMIN) {
            toast.error("You are not an admin");
            router.replace("/");
        } else {
            router.replace("/login");
        }
    }, [loading, isAuthenticated, user, router]);

    return <LoadingScreen />;
}
