
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, Users, Filter, Plus, Loader2, Trash2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, where, doc, deleteDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function MeetingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc<any>(userRef);

  const isAdmin = profile?.role === "admin";
  const isPresident = profile?.role === "President";
  const isVicePresident = profile?.role === "Vice President";
  const isSecretary = profile?.role === "Secretary";
  
  const canSchedule = isAdmin || isPresident;
  const canDelete = isAdmin || isPresident || isVicePresident || isSecretary;
  const userClub = profile?.club || "General";

  const meetingsRef = useMemo(() => collection(db, "meetings"), [db]);
  const meetingsQuery = useMemo(() => {
    if (isAdmin) {
      return query(meetingsRef, orderBy("date", "asc"));
    }
    return query(meetingsRef, where("club", "==", userClub), orderBy("date", "asc"));
  }, [isAdmin, userClub, meetingsRef]);

  const { data: meetings, loading } = useCollection<any>(meetingsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    club: "",
    date: "",
    time: "",
    type: "Remote",
    link: "",
    location: "",
    agenda: ""
  });

  useEffect(() => {
    if (profile && !newMeeting.club) {
      setNewMeeting(prev => ({ ...prev, club: profile.club || "General" }));
    }
  }, [profile]);

  const handleSchedule = () => {
    setIsScheduling(true);
    const data = {
      ...newMeeting,
      attendees: 1,
      agenda: newMeeting.agenda.split('\n').filter(a => a.trim() !== ""),
      createdAt: serverTimestamp(),
    };

    addDoc(meetingsRef, data)
      .then(() => {
        setIsDialogOpen(false);
        setNewMeeting({
          title: "",
          club: userClub,
          date: "",
          time: "",
          type: "Remote",
          link: "",
          location: "",
          agenda: ""
        });
        toast({ title: "Meeting Scheduled", description: "Added to the hub calendar." });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: meetingsRef.path,
          operation: 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsScheduling(false));
  };

  const handleDeleteMeeting = (meetingId: string) => {
    setIsDeleting(meetingId);
    const meetingDocRef = doc(db, "meetings", meetingId);
    
    deleteDoc(meetingDocRef)
      .then(() => {
        toast({ title: "Meeting Deleted", description: "Removed from hub archive." });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: meetingDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsDeleting(null));
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">Hub Calendar</h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium">
            {isAdmin ? "System-wide activities." : `${userClub} scheduled sessions.`}
          </p>
        </div>
        <div className="flex gap-2">
          {canSchedule && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none rounded-xl shadow-lg shadow-primary/20 h-11">
                  <Plus className="w-4 h-4 mr-2" /> Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] rounded-[2rem] border-none shadow-2xl p-6 md:p-8">
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl font-bold">New Session</DialogTitle>
                  <DialogDescription>Create a meeting for your club hub.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh] md:max-h-none">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                    <Input value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} placeholder="e.g. Weekly Sync" className="rounded-xl h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                      <Input type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="rounded-xl h-11" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</Label>
                      <Input type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="rounded-xl h-11" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
                    <Select value={newMeeting.type} onValueChange={v => setNewMeeting({...newMeeting, type: v})}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Remote">Google Meet</SelectItem>
                        <SelectItem value="In-Person">In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newMeeting.type === "Remote" ? (
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meet Link</Label>
                      <Input value={newMeeting.link} onChange={e => setNewMeeting({...newMeeting, link: e.target.value})} placeholder="https://meet.google.com/..." className="rounded-xl h-11" />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</Label>
                      <Input value={newMeeting.location} onChange={e => setNewMeeting({...newMeeting, location: e.target.value})} placeholder="Room or Building" className="rounded-xl h-11" />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agenda</Label>
                    <Textarea value={newMeeting.agenda} onChange={e => setNewMeeting({...newMeeting, agenda: e.target.value})} placeholder="One item per line..." className="rounded-xl min-h-[80px]" />
                  </div>
                </div>
                <DialogFooter className="flex-col gap-2">
                  <Button onClick={handleSchedule} disabled={isScheduling || !newMeeting.title || !newMeeting.date} className="w-full rounded-xl h-12 font-bold">
                    {isScheduling ? "Creating..." : "Schedule Meeting"}
                  </Button>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="w-full h-11 text-muted-foreground">Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" className="flex-1 md:flex-none rounded-xl h-11"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 md:py-24 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Empty Calendar</p>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-[200px] mx-auto">No sessions scheduled for the {userClub} hub.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {meetings.map((meeting: any) => (
            <Card key={meeting.id} className="group overflow-hidden border-none shadow-xl shadow-indigo-500/5 hover:ring-2 hover:ring-primary/20 transition-all bg-white">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-40 lg:w-48 bg-muted/30 flex flex-col items-center justify-center p-6 md:border-r border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
                    {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-3xl md:text-4xl font-headline font-bold text-primary">{meeting.time}</span>
                </div>
                <CardContent className="flex-1 p-5 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-md px-2 py-0.5 font-bold uppercase text-[9px] tracking-widest">{meeting.club}</Badge>
                      <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                        <Users className="w-3 h-3 mr-1" /> {meeting.attendees || 0} RSVPs
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-headline mb-2">{meeting.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <Clock className="w-4 h-4 text-primary" /> {meeting.time}
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-foreground overflow-hidden">
                          {meeting.type === "Remote" ? (
                            <>
                              <Video className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-primary truncate font-bold">{meeting.link?.replace('https://', '') || 'No link'}</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4 text-primary shrink-0" />
                              <span className="truncate">{meeting.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {meeting.agenda && meeting.agenda.length > 0 && (
                      <div className="pt-2 hidden sm:block">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Agenda Highlights</h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                          {meeting.agenda.map((item: string, i: number) => (
                            <li key={i} className="text-[11px] flex items-start gap-2 text-foreground/80 font-medium">
                              <div className="mt-1.5 w-1 h-1 rounded-full bg-primary/40 shrink-0"></div>
                              <span className="truncate">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-2 md:gap-3 md:border-l border-border/50 md:pl-8">
                    {meeting.type === "Remote" && meeting.link ? (
                      <Button className="w-full rounded-xl h-11 md:h-12 text-sm font-bold shadow-md shadow-primary/10" asChild>
                        <a href={meeting.link} target="_blank" rel="noopener noreferrer">Join Session</a>
                      </Button>
                    ) : (
                      <Button className="w-full rounded-xl h-11 md:h-12 text-sm font-bold shadow-md shadow-primary/10" disabled={meeting.type === "Remote"}>
                        {meeting.type === "Remote" ? "Missing Link" : "View Venue"}
                      </Button>
                    )}
                    <Button variant="outline" className="w-full rounded-xl h-11 md:h-12 text-sm font-bold border-border/50" asChild>
                      <Link href="/dashboard/recaps">Review Recaps</Link>
                    </Button>
                    
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" className="w-full rounded-xl h-10 text-[10px] font-bold text-destructive/60 hover:text-destructive hover:bg-destructive/5 uppercase tracking-widest">
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline text-2xl font-bold">Delete Session?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove the meeting from the hub schedule.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-12 font-bold"
                            >
                              {isDeleting === meeting.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
