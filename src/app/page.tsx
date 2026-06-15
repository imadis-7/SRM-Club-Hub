
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Zap, Users, Globe, UserCircle, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { SRMLogo } from "@/components/SRMLogo";

export default function LandingPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-background space-y-6 animate-in fade-in duration-500">
        <SRMLogo withCredits className="text-primary" />
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background relative overflow-hidden selection:bg-primary/20">
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] -z-10 animate-pulse delay-700"></div>
      
      <nav className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex items-center justify-between relative z-10">
        <Link href="/">
          <SRMLogo withCredits textClassName="text-lg md:text-xl" creditsClassName="text-[6px] md:text-[8px]" />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full font-bold px-4 md:px-6 border-2 text-xs md:text-sm h-10 md:h-12" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 md:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
        <div className="space-y-8 md:space-y-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 mx-auto lg:mx-0">
            < Zap className="w-3 h-3" /> Future of Hub Collaboration
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold leading-[0.95] tracking-tighter">
            Where <span className="text-primary italic">Community</span> Meets <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Intelligence.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed font-medium mx-auto lg:mx-0">
            SRM Club Hub is the central nervous system for SRM Welkin organizations. AI recaps and real-time coordination for everything you build.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              size="lg" 
              asChild
              className="h-14 md:h-16 px-8 rounded-2xl font-bold text-base md:text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Link href="/login">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              asChild
              className="h-14 md:h-16 px-8 rounded-2xl font-bold text-base md:text-lg border-2 hover:bg-muted/50 transition-all"
            >
              <Link href="/login">
                <UserCircle className="w-5 h-5 mr-2" />
                Login
              </Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 pt-4 justify-center lg:justify-start">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-9 h-9 md:w-10 md:h-10 rounded-full border-4 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">U{i}</div>
              ))}
            </div>
            <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
              <span className="text-primary">500+</span> Hub Members
            </div>
          </div>
        </div>

        <div className="relative mt-8 lg:mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-4 sm:pt-12">
              <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl md:shadow-2xl bg-white p-6 md:p-8 space-y-4 hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Globe className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="font-headline font-bold text-lg md:text-xl">Global Sync</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Keep your club members connected across campuses and timezones instantly.</p>
              </Card>
              <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl md:shadow-2xl bg-primary text-white p-6 md:p-8 space-y-4 hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="font-headline font-bold text-lg md:text-xl">AI Insights</h3>
                <p className="text-xs md:text-sm text-primary-foreground/80 leading-relaxed">Never miss a detail with automated meeting recaps and assigned action items.</p>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl md:shadow-2xl bg-secondary text-white p-6 md:p-8 space-y-4 hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="font-headline font-bold text-lg md:text-xl">Member Hub</h3>
                <p className="text-xs md:text-sm text-secondary-foreground/80 leading-relaxed">Manage leadership roles, tags, and member profiles with surgical precision.</p>
              </Card>
              <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl md:shadow-2xl bg-white p-6 md:p-8 space-y-4 hover:-translate-y-1 transition-transform">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="font-headline font-bold text-lg md:text-xl">Secure Access</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Privacy-focused environment for your club's most sensitive project data.</p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-muted/20 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <SRMLogo withCredits textClassName="text-base" creditsClassName="text-[8px]" />
          <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest">© 2024 SRM Welkin Labs.</p>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest hover:text-primary cursor-pointer transition-colors">Twitter</span>
            <span className="text-[10px] font-bold uppercase tracking-widest hover:text-primary cursor-pointer transition-colors">GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
