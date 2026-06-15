
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageSquare, 
  Calendar, 
  Archive, 
  LayoutDashboard, 
  LogOut,
  Sparkles,
  UserCircle,
  Briefcase,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarGroup, 
  SidebarGroupLabel 
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useAuth, logout, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import { SRMLogo } from "./SRMLogo";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "My Profile", icon: UserCircle, href: "/dashboard/profile" },
  { name: "Project Hub", icon: Briefcase, href: "/dashboard/projects" },
  { name: "Hub Chat", icon: MessageSquare, href: "/dashboard/chat" },
  { name: "AI Assistant", icon: Sparkles, href: "/dashboard/chat/ai" },
  { name: "Meetings", icon: Calendar, href: "/dashboard/meetings" },
  { name: "Recap Archive", icon: Archive, href: "/dashboard/recaps" },
];

export function AssemblaSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc<any>(userRef);

  const isMasterAdmin = user?.email === "admin@assembla.app";

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-6">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <SRMLogo withCredits textClassName="text-lg" creditsClassName="text-[7px]" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 font-headline uppercase tracking-widest text-[10px] text-muted-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn(
                    "px-4 py-6 transition-all duration-200",
                    pathname === item.href ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/10"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span className="ml-3 font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {isMasterAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 py-2 font-headline uppercase tracking-widest text-[10px] text-destructive font-bold">Admin Tools</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === "/dashboard/admin"}
                  className={cn(
                    "px-4 py-6 transition-all duration-200",
                    pathname === "/dashboard/admin" ? "bg-destructive/10 text-destructive font-bold" : "hover:bg-destructive/5 text-destructive/70"
                  )}
                >
                  <Link href="/dashboard/admin">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="ml-3 font-bold">Control Center</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 py-2 font-headline uppercase tracking-widest text-[10px] text-muted-foreground/70">Your Hub</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="px-4 py-6">
                <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold text-xs">
                  {profile?.club?.[0] || 'C'}
                </div>
                <span className="ml-3">{profile?.club || 'General'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-accent/50 border border-border/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold truncate">{profile?.displayName || user.displayName || "User"}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{profile?.role || "Member"}</span>
              </div>
              <button onClick={() => logout(auth)} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
