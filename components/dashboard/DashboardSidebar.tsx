"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  MapPin,
  Heart,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { label: "Orders", icon: ShoppingCart, href: "/dashboard/orders" },
  { label: "Addresses", icon: MapPin, href: "/dashboard/addresses" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-[#914A8C]/20 bg-[#F8E7D2]">
      <SidebarHeader className="p-4 border-b border-[#914A8C]/20 flex flex-row items-center gap-2 overflow-hidden">
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-[#914A8C] text-[#FFD54A]">
          <span className="font-bold">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
        </div>
        <div className="flex-1 truncate font-bold text-[#914A8C] tracking-wide uppercase">
          My Dashboard
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard/overview');
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      className={`
                        transition-colors hover:bg-[#914A8C]/10 hover:text-[#914A8C]
                        ${isActive ? "bg-[#914A8C] text-white hover:bg-[#914A8C] hover:text-white" : "text-[#914A8C]/70"}
                      `}
                    >
                      <item.icon className="shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[#914A8C]/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Log Out"
              className="text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="shrink-0" />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
