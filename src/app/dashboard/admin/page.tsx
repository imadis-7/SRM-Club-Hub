
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
import { collection, addDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Users, ShieldCheck, Plus, Loader2, Info, Building2, ShieldAlert, Edit2, Camera, AtSign, Save, Trash2, Key, UserCog, Hash, Filter, Search, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, updatePassword, signInWithEmailAndPassword as secondarySignIn } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

const ROLES = ["President", "Vice President", "Secretary", "Member"];

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  const clubsRef = useMemo(() => collection(db, "clubs"), [db]);
  const usersRef = useMemo(() => collection(db, "users"), [db]);

  const { data: clubs, loading: clubsLoading } = useCollection<any>(clubsRef);
  const { data: members, loading: membersLoading } = useCollection<any>(usersRef);

  const [isRegistering, setIsRegistering] = useState(false);
  const [memberFilter, setMemberFilter] = useState("All");
  const [memberSearch, setMemberSearch] = useState("");

  const [newMember, setNewMember] = useState({
    fullName: "",
    clubId: "",
    password: "password123",
    role: "Member",
    studentId: ""
  });

  const [newClub, setNewClub] = useState({
    name: "",
    description: ""
  });

  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editingClub, setEditingClub] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingClub, setIsUpdatingClub] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingClub, setIsDeletingClub] = useState(false);

  // Authorization Guard: Strictly restrict to master admin email
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      const isMasterAdmin = user?.email === "admin@assembla.app";
      
      if (!user || !isMasterAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, profile, authLoading, profileLoading, router]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((m: any) => {
      // Don't show the master admin in the management list to prevent self-deletion
      if (m.email === "admin@assembla.app") return false;
      
      const matchesClub = memberFilter === "All" || m.club === memberFilter;
      const matchesSearch = !memberSearch || 
        m.displayName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.username?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.studentId?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email?.toLowerCase().includes(memberSearch.toLowerCase());
      
      return matchesClub && matchesSearch;
    });
  }, [members, memberFilter, memberSearch]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const generateUsername = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '') + Math.floor(1000 + Math.random() * 9000);
  };

  const handleRegisterMember = async () => {
    if (!newMember.fullName || !newMember.clubId) return;
    setIsRegistering(true);
    
    const username = generateUsername(newMember.fullName);
    const password = newMember.password || "password123";
    const email = `${username}@assembla.app`;

    let secondaryApp;
    try {
      const appName = `registration-app-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const studentUid = userCred.user.uid;

      const userDocRef = doc(db, "users", studentUid);
      const userData = {
        uid: studentUid,
        email: email,
        username: username,
        displayName: newMember.fullName,
        role: newMember.role,
        club: newMember.clubId,
        studentId: newMember.studentId,
        password: password,
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, userData);

      await signOut(secondaryAuth);

      toast({
        title: "Member Created",
        description: `Login ID: ${username} | Password: ${password}`,
      });

      setNewMember({ fullName: "", clubId: "", password: "password123", role: "Member", studentId: "" });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: err.message,
      });
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
      setIsRegistering(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    setIsUpdating(true);
    
    const studentDocRef = doc(db, "users", editingStudent.id);
    const updateData = {
      displayName: editingStudent.displayName || "",
      username: editingStudent.username || "",
      photoURL: editingStudent.photoURL || "",
      club: editingStudent.club || "General",
      role: editingStudent.role || "Member",
      studentId: editingStudent.studentId || "",
      password: editingStudent.password || "password123",
      updatedAt: serverTimestamp()
    };

    try {
      await updateDoc(studentDocRef, updateData);

      if (editingStudent.password && editingStudent.password !== editingStudent.originalPassword) {
        let secondaryApp;
        try {
          const appName = `update-app-${Date.now()}`;
          secondaryApp = initializeApp(firebaseConfig, appName);
          const secondaryAuth = getAuth(secondaryApp);
          
          await secondarySignIn(secondaryAuth, editingStudent.email, editingStudent.originalPassword || "password123");
          if (secondaryAuth.currentUser) {
            await updatePassword(secondaryAuth.currentUser, editingStudent.password);
          }
          await signOut(secondaryAuth);
          toast({ title: "Updated", description: "Profile and password synchronized." });
        } catch (err: any) {
          toast({ 
            variant: "destructive", 
            title: "Auth Sync Error", 
            description: "Profile updated, but password failed to sync. Ensure old password was correct." 
          });
        } finally {
          if (secondaryApp) {
            await deleteApp(secondaryApp).catch(console.error);
          }
        }
      } else {
        toast({ title: "Success", description: "Profile updated successfully." });
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }

    setEditingStudent(null);
    setIsUpdating(false);
  };

  const handleUpdateClub = async () => {
    if (!editingClub) return;
    setIsUpdatingClub(true);
    const clubDocRef = doc(db, "clubs", editingClub.id);
    const updateData = {
      name: editingClub.name || "",
      description: editingClub.description || "",
      updatedAt: serverTimestamp()
    };

    try {
      await updateDoc(clubDocRef, updateData);
      toast({ title: "Hub Updated", description: `"${editingClub.name}" details updated successfully.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }

    setEditingClub(null);
    setIsUpdatingClub(false);
  };

  const handleDeleteStudent = async () => {
    if (!editingStudent) return;
    setIsDeleting(true);
    const studentDocRef = doc(db, "users", editingStudent.id);
    
    try {
      await deleteDoc(studentDocRef);
      toast({ title: "Removed", description: `Member ${editingStudent.displayName} removed.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }

    setEditingStudent(null);
    setIsDeleting(false);
  };

  const handleAddClub = async () => {
    if (!newClub.name) return;
    const clubData = {
      name: newClub.name,
      description: newClub.description || "",
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(clubsRef, clubData);
      toast({ title: "Success", description: `Club "${newClub.name}" created.` });
      setNewClub({ name: "", description: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    setIsDeletingClub(true);
    const clubDocRef = doc(db, "clubs", clubId);
    
    try {
      await deleteDoc(clubDocRef);
      toast({ title: "Deleted", description: "Club removed from system." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setIsDeletingClub(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-widest mb-1">
            <ShieldAlert className="w-4 h-4" /> System Administrator
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">Control Center</h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium">Provision and manage hub identities.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-xl shadow-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="w-5 h-5 text-primary" /> Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-headline font-bold">{members?.length || 0}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase font-bold tracking-wider">Synced directory</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-xl shadow-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Building2 className="w-5 h-5 text-primary" /> Active Hubs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-headline font-bold">{clubs?.length || 0}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase font-bold tracking-wider">Available clubs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6 w-full md:w-auto">
          <TabsTrigger value="members" className="flex-1 md:flex-none rounded-lg font-bold px-6">Member Directory</TabsTrigger>
          <TabsTrigger value="clubs" className="flex-1 md:flex-none rounded-lg font-bold px-6">Club Hubs</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2rem] border-none shadow-xl h-fit">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Register Student</CardTitle>
                <CardDescription>Manually provision leadership or member access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <Input 
                    value={newMember.fullName} 
                    onChange={e => setNewMember({...newMember, fullName: e.target.value})}
                    placeholder="e.g. John Doe" 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Student ID</Label>
                  <Input 
                    value={newMember.studentId} 
                    onChange={e => setNewMember({...newMember, studentId: e.target.value})}
                    placeholder="e.g. SRM-2024-001" 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hub Role</Label>
                    <Select value={newMember.role} onValueChange={v => setNewMember({...newMember, role: v})}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Password</Label>
                    <Input 
                      value={newMember.password} 
                      onChange={e => setNewMember({...newMember, password: e.target.value})}
                      placeholder="password123" 
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Club Association</Label>
                  <Select value={newMember.clubId} onValueChange={v => setNewMember({...newMember, clubId: v})}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Select club..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs?.map((c: any) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleRegisterMember} 
                  disabled={isRegistering || !newMember.fullName || !newMember.clubId}
                  className="w-full h-12 rounded-xl font-bold mt-2 shadow-lg shadow-primary/20"
                >
                  {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Account
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-headline">Directory</CardTitle>
                      <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                        {filteredMembers.length} Matches
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input 
                          placeholder="Search name, ID, or user..." 
                          className="pl-9 rounded-xl h-9 text-xs"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                        />
                      </div>
                      <Select value={memberFilter} onValueChange={setMemberFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] rounded-xl h-9 text-xs">
                          <Filter className="w-3 h-3 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Filter Hub" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="All">All Hubs</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                          {clubs?.map((c: any) => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                    {membersLoading ? (
                      <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground text-sm italic">No records found.</div>
                    ) : filteredMembers.map((m: any) => (
                      <div 
                        key={m.id} 
                        className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors cursor-pointer group"
                        onClick={() => setEditingStudent({ ...m, originalPassword: m.password || "password123" })}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0">
                            {m.photoURL ? (
                              <img src={m.photoURL} alt={m.displayName} className="w-full h-full object-cover" />
                            ) : (
                              m.displayName?.[0] || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm flex items-center gap-2 truncate">
                              {m.displayName}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                            </div>
                            <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                              <span className="flex items-center gap-1 font-bold text-primary italic uppercase tracking-tighter">
                                <UserCog className="w-2.5 h-2.5" /> {m.role}
                              </span>
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-primary font-bold">ID: @{m.username}</span>
                                <span className="hidden sm:inline opacity-30">|</span>
                                <span className="text-[9px] font-medium hidden sm:inline">{m.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-bold shrink-0 ml-2">
                          {m.club || "General"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2rem] border-none shadow-xl h-fit">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">New Hub</CardTitle>
                <CardDescription>Define a new organizational club.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hub Name</Label>
                  <Input 
                    value={newClub.name} 
                    onChange={e => setNewClub({...newClub, name: e.target.value})}
                    placeholder="e.g. Robotics Club" 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mission Statement</Label>
                  <Input 
                    value={newClub.description} 
                    onChange={e => setNewClub({...newClub, description: e.target.value})}
                    placeholder="Short summary of goals" 
                    className="rounded-xl h-11"
                  />
                </div>
                <Button 
                  onClick={handleAddClub} 
                  disabled={!newClub.name}
                  className="w-full h-12 rounded-xl font-bold mt-2 shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Initialize Hub
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-headline font-bold text-xl">Active Hubs</h3>
              <div className="grid grid-cols-1 gap-4">
                {clubsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : clubs?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm italic border-2 border-dashed rounded-3xl">No hubs defined.</div>
                ) : clubs?.map((c: any) => (
                  <Card key={c.id} className="border-none shadow-md p-4 bg-white hover:shadow-lg transition-all group/club">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-primary font-bold">
                          {c.name?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{c.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-primary opacity-0 group-hover/club:opacity-100 transition-opacity"
                          onClick={() => setEditingClub(c)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover/club:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-headline text-2xl font-bold">Delete Hub?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the <strong>{c.name}</strong> hub.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteClub(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-12 font-bold">
                                {isDeletingClub ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Delete Hub
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
           </div>
        </TabsContent>
      </Tabs>

      {/* Edit Student Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold">Manage Profile</DialogTitle>
            <DialogDescription>
              Full control for <span className="text-primary font-bold">@{editingStudent?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Display Name</Label>
              <Input 
                value={editingStudent?.displayName || ""} 
                onChange={e => setEditingStudent({...editingStudent, displayName: e.target.value})}
                className="rounded-xl h-12"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Student ID</Label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={editingStudent?.studentId || ""} 
                  onChange={e => setEditingStudent({...editingStudent, studentId: e.target.value})}
                  className="pl-10 rounded-xl h-12"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hub Role</Label>
                <Select value={editingStudent?.role || "Member"} onValueChange={v => setEditingStudent({...editingStudent, role: v})}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password Update</Label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={editingStudent?.password || ""} 
                    onChange={e => setEditingStudent({...editingStudent, password: e.target.value})}
                    className="pl-10 rounded-xl h-12"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Login Identity (Read Only)</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={editingStudent?.email || ""} 
                  readOnly
                  className="pl-10 rounded-xl h-12 bg-muted/50 border-none italic text-muted-foreground"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Club Hub</Label>
              <Select 
                value={editingStudent?.club || "General"} 
                onValueChange={v => setEditingStudent({...editingStudent, club: v})}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select club..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  {clubs?.map((c: any) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="rounded-xl h-12 text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 font-bold sm:mr-auto">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-headline text-2xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove <strong>{editingStudent?.displayName}</strong> from the hub directory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-12 font-bold">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditingStudent(null)} className="rounded-xl h-12">Cancel</Button>
              <Button onClick={handleUpdateStudent} disabled={isUpdating} className="rounded-xl h-12 font-bold px-8 shadow-lg shadow-primary/20">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Sync Profile
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Club Dialog */}
      <Dialog open={!!editingClub} onOpenChange={(open) => !open && setEditingClub(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold">Edit Hub</DialogTitle>
            <DialogDescription>
              Update organization details for <span className="text-primary font-bold">{editingClub?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hub Name</Label>
              <Input 
                value={editingClub?.name || ""} 
                onChange={e => setEditingClub({...editingClub, name: e.target.value})}
                className="rounded-xl h-12"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mission Statement</Label>
              <Input 
                value={editingClub?.description || ""} 
                onChange={e => setEditingClub({...editingClub, description: e.target.value})}
                className="rounded-xl h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingClub(null)} className="rounded-xl h-12">Cancel</Button>
            <Button onClick={handleUpdateClub} disabled={isUpdatingClub} className="rounded-xl h-12 font-bold px-8 shadow-lg shadow-primary/20">
              {isUpdatingClub ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Hub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
