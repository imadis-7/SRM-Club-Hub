
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AssemblaSidebar } from "@/components/AssemblaSidebar";
import { Loader2 } from "lucide-react";
import { SRMLogo } from "@/components/SRMLogo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
        <SRMLogo withCredits className="text-primary" />
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AssemblaSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile-only header with full navigation branding */}
          <header className="flex h-16 items-center gap-4 border-b bg-white px-4 md:hidden sticky top-0 z-20 shrink-0">
            <SidebarTrigger />
            <div className="flex-1 overflow-hidden">
              <SRMLogo 
                withCredits 
                textClassName="text-sm" 
                creditsClassName="text-[6px] leading-tight"
                className="scale-90 origin-left"
              />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
