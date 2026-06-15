
"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  User as UserIcon, 
  Save, 
  Loader2, 
  Hash, 
  GraduationCap, 
  Users, 
  AtSign,
  ShieldCheck,
  Lock,
  Mail,
  CalendarCheck
} from "lucide-react";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  // Strictly restrict system edits to the master admin email
  const isMasterAdmin = user?.email === "admin@assembla.app";

  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    studentId: "",
    classSection: "",
    club: "",
    photoURL: ""
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        username: profile.username || "",
        studentId: profile.studentId || "",
        classSection: profile.classSection || "",
        club: profile.club || "",
        photoURL: profile.photoURL || ""
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || "",
        photoURL: user.photoURL || ""
      }));
    }
  }, [profile, user]);

  const handleSave = () => {
    if (!user || !isMasterAdmin) return;
    
    setIsSaving(true);
    const userDocRef = doc(db, "users", user.uid);
    const updateData = {
      ...formData,
      uid: user.uid,
      email: user.email,
      updatedAt: new Date().toISOString(),
    };

    setDoc(userDocRef, updateData, { merge: true })
      .then(() => {
        toast({
          title: "Profile synchronized",
          description: "Administrative record has been updated successfully.",
        });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl md:text-5xl font-headline font-bold">Hub Identity</h1>
        <p className="text-sm md:text-lg text-muted-foreground font-medium">Your verified organizational credentials.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identity Overview Card */}
        <Card className="lg:col-span-1 border-none shadow-2xl shadow-indigo-500/5 bg-white overflow-hidden rounded-[2.5rem] h-fit sticky top-8">
          <div className="h-24 bg-gradient-to-br from-primary via-indigo-600 to-indigo-800" />
          <div className="px-6 pb-8">
            <div className="flex justify-center -mt-12 mb-4">
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                <AvatarImage src={formData.photoURL} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                  {formData.displayName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-headline font-bold truncate">{formData.displayName || "Member"}</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">@{formData.username}</p>
              <div className="pt-4 flex flex-col gap-2">
                <Badge variant="secondary" className="w-full justify-center py-1.5 bg-indigo-50 text-primary border-none font-bold uppercase text-[9px] tracking-[0.1em]">
                  {profile?.role || "Member"}
                </Badge>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border/50 space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-muted-foreground/60 uppercase text-[8px] tracking-widest">Official Email</p>
                  <p className="font-medium truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-muted-foreground/60 uppercase text-[8px] tracking-widest">Joined On</p>
                  <p className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Active Session'}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Info Card */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-indigo-500/5 bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-headline">Verification Details</CardTitle>
                <CardDescription>Managed and verified by Hub Administration.</CardDescription>
              </div>
              {!isMasterAdmin && (
                <Badge variant="outline" className="h-8 border-indigo-100 text-indigo-500 px-3 flex gap-2 font-bold uppercase text-[9px]">
                  <Lock className="w-3 h-3" /> Secure Record
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Display Name</Label>
                <div className="relative group">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={formData.displayName} 
                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                    readOnly={!isMasterAdmin}
                    className={cn(
                      "pl-10 h-12 rounded-xl transition-all",
                      !isMasterAdmin ? "bg-muted/30 border-none cursor-default font-semibold" : "border-border/60 focus:ring-primary/20"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Unique Student ID</Label>
                <div className="relative group">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={formData.studentId} 
                    onChange={e => setFormData({...formData, studentId: e.target.value})}
                    readOnly={!isMasterAdmin}
                    placeholder="SRM-XXXX-XXX"
                    className={cn(
                      "pl-10 h-12 rounded-xl transition-all",
                      !isMasterAdmin ? "bg-muted/30 border-none cursor-default font-semibold" : "border-border/60 focus:ring-primary/20"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Current Hub</Label>
                <div className="relative group">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={formData.club} 
                    onChange={e => setFormData({...formData, club: e.target.value})}
                    readOnly={!isMasterAdmin}
                    className={cn(
                      "pl-10 h-12 rounded-xl transition-all",
                      !isMasterAdmin ? "bg-muted/30 border-none cursor-default font-semibold" : "border-border/60 focus:ring-primary/20"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Class Section</Label>
                <div className="relative group">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={formData.classSection} 
                    onChange={e => setFormData({...formData, classSection: e.target.value})}
                    readOnly={!isMasterAdmin}
                    placeholder="e.g. CSE-A"
                    className={cn(
                      "pl-10 h-12 rounded-xl transition-all",
                      !isMasterAdmin ? "bg-muted/30 border-none cursor-default font-semibold" : "border-border/60 focus:ring-primary/20"
                    )}
                  />
                </div>
              </div>

              {isMasterAdmin && (
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">Profile Avatar URL</Label>
                  <div className="relative group">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input 
                      value={formData.photoURL} 
                      onChange={e => setFormData({...formData, photoURL: e.target.value})}
                      placeholder="https://..."
                      className="pl-10 h-12 rounded-xl border-border/60 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {isMasterAdmin ? (
              <div className="pt-6 border-t flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="rounded-2xl px-10 shadow-xl shadow-primary/20 font-bold h-14 text-base"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                  Save Identity Changes
                </Button>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-500 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-indigo-900">Identity Record is Finalized</p>
                  <p className="text-xs text-indigo-600/70 leading-relaxed">
                    Your hub credentials, including your role and student ID, are managed by the organizational administration. 
                    Please contact a Hub President to request updates to your verified information.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
