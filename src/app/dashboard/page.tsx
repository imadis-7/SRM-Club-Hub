
"use client";

import { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Archive, 
  Loader2, 
  Video, 
  MapPin, 
  ShieldCheck, 
  UserCircle,
  Briefcase,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, limit, where } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  const isMasterAdmin = user?.email === "admin@assembla.app";
  const userClub = profile?.club || "General";

  const usersQuery = useMemo(() => {
    if (profileLoading || !userClub) return null;
    const ref = collection(db, "users");
    if (isMasterAdmin) return query(ref);
    return query(ref, where("club", "==", userClub));
  }, [db, isMasterAdmin, userClub, profileLoading]);
  
  const { data: rawClubMembers, loading: membersLoading } = useCollection<any>(usersQuery);

  const clubMembers = useMemo(() => {
    return rawClubMembers?.filter((m: any) => m.email !== "admin@assembla.app" && m.role !== "admin") || [];
  }, [rawClubMembers]);

  const messagesQuery = useMemo(() => {
    if (profileLoading || !userClub) return null;
    const ref = collection(db, "messages");
    if (isMasterAdmin) return query(ref, limit(50));
    return query(ref, where("club", "==", userClub), limit(50));
  }, [db, isMasterAdmin, userClub, profileLoading]);
  
  const { data: clubMessages } = useCollection<any>(messagesQuery);

  const recapsQuery = useMemo(() => {
    if (profileLoading || !userClub) return null;
    const ref = collection(db, "recaps");
    if (isMasterAdmin) return query(ref);
    return query(ref, where("club", "==", userClub));
  }, [db, isMasterAdmin, userClub, profileLoading]);
  
  const { data: clubRecaps } = useCollection<any>(recapsQuery);

  const upcomingMeetingsQuery = useMemo(() => {
    if (profileLoading || !userClub) return null;
    const ref = collection(db, "meetings");
    if (isMasterAdmin) return query(ref, limit(5));
    return query(ref, where("club", "==", userClub), limit(5));
  }, [db, isMasterAdmin, userClub, profileLoading]);
  
  const { data: allMeetings, loading: meetingsLoading } = useCollection<any>(upcomingMeetingsQuery);

  const projectsQuery = useMemo(() => {
    if (profileLoading || !userClub) return null;
    const ref = collection(db, "projects");
    return query(ref, where("club", "==", userClub), limit(3));
  }, [db, userClub, profileLoading]);

  const { data: rawRecentProjects } = useCollection<any>(projectsQuery);

  // Client-side sort to ensure visibility without manual indexing
  const recentProjects = useMemo(() => {
    return [...rawRecentProjects].sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || 0;
      const bTime = b.updatedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }, [rawRecentProjects]);

  const nextMeeting = useMemo(() => {
    if (!allMeetings) return null;
    return [...allMeetings]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .find(m => new Date(m.date) >= new Date(new Date().setHours(0,0,0,0)));
  }, [allMeetings]);

  const greetingName = profile?.displayName || profile?.username || user?.displayName || "Member";

  const stats = [
    { 
      label: "Hub Messages", 
      value: clubMessages?.length?.toString() || "0", 
      icon: MessageSquare, 
      color: "text-blue-500" 
    },
    { 
      label: "Hub Recaps", 
      value: clubRecaps?.length?.toString() || "0", 
      icon: Archive, 
      color: "text-indigo-500" 
    },
    { 
      label: "Hub Members", 
      value: clubMembers?.length?.toString() || "0", 
      icon: Users, 
      color: "text-emerald-500" 
    },
  ];

  const getJoinUrl = (url: string) => {
    if (!url) return "#";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  if (profileLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">Welcome, {greetingName}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Real-time activity in the {userClub} hub.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full shadow-lg shadow-primary/20" asChild>
            <Link href="/dashboard/projects">
              <Sparkles className="w-4 h-4 mr-2" /> Project Hub
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl shadow-indigo-500/5 bg-gradient-to-br from-white to-primary/5 flex flex-col justify-center relative py-6 md:py-8">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Calendar className="w-32 h-32" />
          </div>
          <CardHeader className="relative z-10 pb-4">
            <div className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase mb-3 w-fit">Upcoming Hub Session</div>
            {meetingsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Checking schedule...</span>
              </div>
            ) : nextMeeting ? (
              <>
                <CardTitle className="text-2xl md:text-3xl font-headline">{nextMeeting.title}</CardTitle>
                <CardDescription className="text-sm md:text-base font-medium text-secondary">
                  {new Date(nextMeeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {nextMeeting.time}
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl md:text-3xl font-headline">No Meetings Scheduled</CardTitle>
                <CardDescription className="text-sm md:text-base font-medium text-muted-foreground">
                  The {userClub} hub is quiet for now.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            {nextMeeting ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground max-w-lg line-clamp-2">
                    {nextMeeting.agenda?.join(", ") || "No agenda items listed yet."}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] md:text-sm font-medium text-primary">
                    <span className="flex items-center gap-1">
                      {nextMeeting.type === "Remote" ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      {nextMeeting.type}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <Users className="w-4 h-4" />
                      {nextMeeting.club}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                  {nextMeeting.type === "Remote" ? (
                    <Button size="sm" className="rounded-full bg-secondary hover:bg-secondary/90 shadow-md text-primary-foreground" asChild>
                      <a href={getJoinUrl(nextMeeting.link)} target="_blank" rel="noopener noreferrer">
                        Join Session
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" className="rounded-full bg-secondary hover:bg-secondary/90 shadow-md text-primary-foreground" asChild>
                      <Link href="/dashboard/meetings">
                        View Details
                      </Link>
                    </Button>
                  )}
                  <Link href="/dashboard/meetings" className="text-xs md:text-sm font-medium flex items-center gap-1 hover:underline text-primary">
                    View Full Schedule <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </>
            ) : (
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/dashboard/meetings">Schedule a Meeting</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-xl shadow-indigo-500/5 border-none bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-lg">Hub Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/10 transition-all hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm", stat.color)}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-xs">{stat.label}</span>
                  </div>
                  <span className="text-sm md:text-base font-bold">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-xl shadow-indigo-500/5 border-none bg-white overflow-hidden">
            <CardHeader className="pb-2 bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-[10px] uppercase tracking-widest text-muted-foreground">Recent Projects</CardTitle>
              <Link href="/dashboard/projects" className="text-[9px] font-bold text-primary hover:underline">View All</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-[200px] overflow-y-auto">
                {recentProjects.length === 0 ? (
                  <div className="p-4 text-center text-[10px] italic text-muted-foreground">No active projects.</div>
                ) : recentProjects.map((p: any) => (
                  <div key={p.id} className="p-3 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs font-bold truncate">{p.name}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-bold">{p.status}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-bold text-primary">{p.progress}%</span>
                      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <h2 className="col-span-full text-xl md:text-2xl font-headline font-bold mt-4">Suggested Actions</h2>
        
        {[
          { title: "Project Hub", desc: "List and track your team's tasks.", icon: Briefcase, href: "/dashboard/projects" },
          { title: "Review Recaps", desc: "Catch up on past discussions.", icon: Archive, href: "/dashboard/recaps" },
          { title: "Ask Hub AI", desc: "The smart assistant can answer everything.", icon: Sparkles, href: "/dashboard/chat/ai" },
          { title: "Hub Chat", desc: "Real-time team coordination.", icon: MessageSquare, href: "/dashboard/chat" },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <Card className="h-full group hover:border-primary/50 transition-all cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1">
              <CardContent className="p-4 md:p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <action.icon className="w-5 h-5" />
                </div>
                <h3 className="font-headline font-bold text-base md:text-lg">{action.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{action.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
