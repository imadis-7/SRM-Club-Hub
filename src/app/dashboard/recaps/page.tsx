
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Archive, 
  Sparkles, 
  Search, 
  Calendar, 
  Download, 
  Share2, 
  ChevronRight, 
  FileText,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { meetingAutoRecap, type MeetingAutoRecapOutput } from "@/ai/flows/meeting-auto-recap-flow";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RecapsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [currentRecap, setCurrentRecap] = useState<MeetingAutoRecapOutput | null>(null);
  const [showRecapDialog, setShowRecapDialog] = useState(false);

  const pastRecaps = [
    {
      id: "1",
      title: "Design Workshop #4",
      date: "Oct 12, 2023",
      club: "Design Hub",
      summary: "Finalized the brand color palette and established new typography standards for the mobile app project.",
      participants: 8
    },
    {
      id: "2",
      title: "Engineering Sprint Review",
      date: "Oct 10, 2023",
      club: "Coding Club",
      summary: "Reviewed the PID controller implementation for the chassis drive. Identified need for better sensor isolation.",
      participants: 14
    },
    {
      id: "3",
      title: "Marketing Kickoff",
      date: "Oct 08, 2023",
      club: "SRM Hub Team",
      summary: "Planned the launch strategy for v2.0. Budget approved for social media outreach program.",
      participants: 5
    }
  ];

  const handleGenerate = async () => {
    if (!meetingNotes.trim()) return;
    setIsGenerating(true);
    try {
      const result = await meetingAutoRecap({ meetingContent: meetingNotes });
      setCurrentRecap(result);
      setShowRecapDialog(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Smart Recap Archive</h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium">Search and generate AI-powered summaries.</p>
        </div>
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search past meetings..." className="pl-10 rounded-xl bg-white shadow-sm border-border/50 h-11" />
        </div>
      </header>

      <section className="bg-gradient-to-r from-primary/10 to-indigo-500/10 p-6 md:p-8 rounded-3xl border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> New AI Feature
            </div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold">Instant Auto-Recap</h2>
            <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
              Paste your meeting transcripts below. SRM AI will synthesize key discussion points instantly.
            </p>
            <div className="space-y-4">
              <Textarea 
                placeholder="Paste transcript or meeting logs here..." 
                className="min-h-[120px] md:min-h-[150px] bg-white rounded-2xl p-4 shadow-sm border-none focus-visible:ring-2 focus-visible:ring-primary/20"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
              />
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !meetingNotes.trim()}
                className="w-full md:w-auto px-8 h-12 rounded-xl shadow-lg shadow-primary/20 font-bold"
              >
                {isGenerating ? "Synthesizing..." : "Generate AI Recap"}
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <Card className="border-none shadow-2xl shadow-primary/5 bg-white/80 backdrop-blur-sm rotate-2 hover:rotate-0 transition-transform duration-500">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <div className="flex justify-between items-center">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Preview</Badge>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted/60 rounded animate-pulse"></div>
                  <div className="h-3 w-full bg-muted/60 rounded animate-pulse"></div>
                  <div className="h-3 w-2/3 bg-muted/60 rounded animate-pulse"></div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="h-2 w-24 bg-primary/20 rounded"></div>
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 w-1/3 bg-muted rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl md:text-2xl font-headline font-bold">Recently Archived</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {pastRecaps.map((recap) => (
            <Card key={recap.id} className="group hover:shadow-xl transition-all border-none bg-white shadow-lg shadow-indigo-500/5">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="rounded-md border-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider">{recap.club}</Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {recap.date}</span>
                </div>
                <CardTitle className="font-headline text-lg md:text-xl group-hover:text-primary transition-colors">{recap.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-3 leading-relaxed">{recap.summary}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="w-6 h-6 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[8px] font-bold">P{n}</div>
                    ))}
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[8px] font-bold">+{recap.participants - 3}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 font-bold rounded-lg text-[10px] md:text-xs">
                    Read More <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={showRecapDialog} onOpenChange={setShowRecapDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="p-6 md:p-8 bg-gradient-to-r from-primary to-indigo-600 text-white shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI-Generated Meeting Recap</span>
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-headline font-bold">Summary & Insights</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6 md:p-8">
            {currentRecap && (
              <div className="space-y-8 pb-4">
                <section className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Overview</h4>
                  <p className="text-sm md:text-base text-foreground leading-relaxed font-medium bg-muted/30 p-4 rounded-xl border border-border/50">
                    {currentRecap.summary}
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Discussion Points</h4>
                  <ul className="space-y-2">
                    {currentRecap.discussionPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white border shadow-sm text-xs md:text-sm">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Action Items</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {currentRecap.actionItems.map((item, i) => (
                      <div key={i} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-2 shadow-sm">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-xs md:text-sm font-bold text-emerald-900">{item.description}</p>
                          {item.dueDate && <Badge className="bg-emerald-200 text-emerald-800 border-none text-[8px] md:text-[9px]">{item.dueDate}</Badge>}
                        </div>
                        {item.assignee && (
                          <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-tight">
                            <Archive className="w-3 h-3" /> Assignee: {item.assignee}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="p-4 md:p-6 border-t bg-muted/20 shrink-0 flex-col sm:flex-row gap-2">
            <Button variant="outline" className="rounded-xl border-border/50 font-bold w-full sm:w-auto" onClick={() => setShowRecapDialog(false)}>Close</Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="icon" className="rounded-xl shrink-0"><Download className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" className="rounded-xl shrink-0"><Share2 className="w-4 h-4" /></Button>
              <Button className="rounded-xl px-6 font-bold shadow-md flex-1">Add to Archive</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
