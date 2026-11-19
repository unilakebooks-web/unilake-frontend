"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { UserRole, isStaff } from "@/app/types/auth";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "@/components/home/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
        },
    },
});

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#F8E7D2] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <svg
                    className="animate-spin h-10 w-10 text-[#914A8C]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-label="Loading"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-[#914A8C] font-bold text-lg">Loading Admin Session…</p>
            </div>
        </div>
    );
}

export default function AdminPanelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // A sub-admin may use the order pages only. This is decided from the current path on every render, so a
    // client-side navigation to another admin page never shows it (the sticky flag above is set once). The
    // backend refuses every other route for a sub-admin anyway.
    // ⚠️ Same rule as SUB_ADMIN_NAV_HREFS in components/admin/AdminSidebar.tsx, the /admin redirect in
    // app/admin/page.tsx and the backend list (Unilake-backend src/config/subAdminRoutes.ts): change them together.
    // proxy.ts also checks for ADMIN, but its admin list is empty today; it would lock sub-admins out if filled.
    const onOrderPages = pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");
    const allowed =
        user?.role === UserRole.ADMIN || (user?.role === UserRole.SUB_ADMIN && onOrderPages);

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            toast.error("You must be logged in to view the admin panel");
            router.replace("/login");
        } else if (!isStaff(user?.role)) {
            toast.error("You are not an admin");
            router.replace("/");
        } else if (!allowed) {
            toast.info("Your account can only use the Orders section");
            router.replace("/admin/orders");
        } else {
            setIsAuthorized(true);
        }
    }, [loading, isAuthenticated, user, router, pathname, allowed]);

    if (loading || !isAuthorized || !allowed) {
        return <LoadingScreen />;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Header hideBulbForced={true} flatBackground={true} />
            <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#F8E7D2] font-poppins selection:bg-[#914A8C] selection:text-white pt-[86px]">
                <AdminSidebar />
                <div className="flex-1 flex flex-col h-[calc(100vh-86px)] overflow-hidden">
                    <div className="p-4 md:px-8 pt-4 pb-0 shrink-0">
                        <SidebarTrigger className="text-[#914A8C] hover:bg-[#914A8C]/10" />
                    </div>
                    <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 md:pt-4">
                        <div className="mx-auto max-w-6xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
        </QueryClientProvider>
    );
}
