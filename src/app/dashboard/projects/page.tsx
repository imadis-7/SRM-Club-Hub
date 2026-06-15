
"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  Loader2, 
  Briefcase, 
  Clock, 
  BarChart3, 
  MoreVertical,
  Trash2,
  Edit2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  where
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["Planning", "In Progress", "Review", "Completed"];

export default function ProjectsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  const userClub = profile?.club || "General";
  const isMasterAdmin = user?.email === "admin@assembla.app";
  
  const canManage = useMemo(() => {
    if (isMasterAdmin) return true;
    return profile?.role === "President" || profile?.role === "Vice President";
  }, [profile?.role, isMasterAdmin]);

  const projectsRef = useMemo(() => collection(db, "projects"), [db]);
  const projectsQuery = useMemo(() => {
    // Wait for profile to load to get the correct club
    if (profileLoading || !userClub) return null;
    return query(projectsRef, where("club", "==", userClub));
  }, [projectsRef, userClub, profileLoading]);

  const { data: rawProjects, loading: projectsLoading } = useCollection<any>(projectsQuery);

  // Client-side sorting as a fallback to avoid index issues
  const projects = useMemo(() => {
    return [...rawProjects].sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }, [rawProjects]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Planning",
    deadline: "",
    progress: 0
  });

  const handleCreateOrUpdate = async () => {
    if (!user || !formData.name || !canManage) return;
    setIsSubmitting(true);

    const projectData = {
      ...formData,
      club: userClub,
      ownerId: user.uid,
      ownerName: profile?.displayName || user.displayName || "Member",
      updatedAt: serverTimestamp(),
    };

    if (editingProject) {
      const docRef = doc(db, "projects", editingProject.id);
      updateDoc(docRef, projectData)
        .then(() => {
          toast({ title: "Project Updated", description: "Project details have been saved." });
          resetForm();
        })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: projectData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsSubmitting(false));
    } else {
      const dataToCreate = {
        ...projectData,
        createdAt: serverTimestamp(),
      };
      addDoc(projectsRef, dataToCreate)
        .then(() => {
          toast({ title: "Project Created", description: "New project added to the hub." });
          resetForm();
        })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: projectsRef.path,
            operation: 'create',
            requestResourceData: dataToCreate,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsSubmitting(false));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "Planning",
      deadline: "",
      progress: 0
    });
    setEditingProject(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (project: any) => {
    if (!canManage) return;
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      deadline: project.deadline || "",
      progress: project.progress || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (projectId: string) => {
    if (!canManage) return;
    const docRef = doc(db, "projects", projectId);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Project Removed", description: "The project has been deleted." });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planning": return "bg-blue-100 text-blue-600";
      case "In Progress": return "bg-amber-100 text-amber-600";
      case "Review": return "bg-purple-100 text-purple-600";
      case "Completed": return "bg-emerald-100 text-emerald-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Combine loading states to avoid flickering empty state
  const isGlobalLoading = profileLoading || projectsLoading;

  if (isGlobalLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-1">
            <Briefcase className="w-3.5 h-3.5" /> {userClub} Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Project Hub</h1>
          <p className="text-sm md:text-base text-muted-foreground">Monitoring tasks and collaborative goals for your club.</p>
        </div>
        
        {canManage ? (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Start Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold">
                  {editingProject ? "Update Project" : "New Initiative"}
                </DialogTitle>
                <DialogDescription>
                  Define your project goals and timeline within the hub.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. SRM Tech Hackathon" 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="What are we building?" 
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deadline</Label>
                    <Input 
                      type="date"
                      value={formData.deadline} 
                      onChange={e => setFormData({...formData, deadline: e.target.value})}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Progress</Label>
                    <span className="text-xs font-bold text-primary">{formData.progress}%</span>
                  </div>
                  <Slider 
                    value={[formData.progress]} 
                    onValueChange={([v]) => setFormData({...formData, progress: v})}
                    max={100} 
                    step={1}
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="ghost" onClick={resetForm} className="rounded-xl h-12">Cancel</Button>
                <Button onClick={handleCreateOrUpdate} disabled={isSubmitting || !formData.name} className="rounded-xl h-12 px-8 font-bold">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingProject ? "Update Project" : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="px-4 py-2 rounded-xl bg-muted/50 border border-border/50 flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <Lock className="w-3 h-3" /> View Only Access
          </div>
        )}
      </header>

      {projects.length === 0 ? (
        <Card className="border-2 border-dashed border-border/50 bg-muted/5 rounded-[2.5rem] py-20 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/30">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-headline font-bold">No Hub Projects</h3>
            <p className="text-sm text-muted-foreground max-w-sm">The {userClub} project pipeline is currently empty.</p>
          </div>
          {canManage && (
            <Button variant="outline" className="rounded-xl" onClick={() => setIsDialogOpen(true)}>
              Initialize First Project
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="group border-none shadow-xl shadow-indigo-500/5 hover:shadow-2xl hover:shadow-primary/5 transition-all bg-white rounded-[2rem] overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={cn("rounded-lg border-none font-bold text-[9px] uppercase tracking-widest px-2.5 py-1", getStatusColor(project.status))}>
                    {project.status}
                  </Badge>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                        <DropdownMenuItem onClick={() => handleEdit(project)} className="rounded-lg m-1 cursor-pointer">
                          <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(project.id)} className="rounded-lg m-1 cursor-pointer text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <CardTitle className="text-xl font-headline font-bold group-hover:text-primary transition-colors line-clamp-1">{project.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 min-h-[32px]">{project.description || "No description provided."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col justify-end">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Progress</span>
                    <span className="text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {project.ownerName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Lead</p>
                      <p className="text-[11px] font-bold truncate">{project.ownerName}</p>
                    </div>
                  </div>
                  {project.deadline && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" /> Deadline
                      </p>
                      <p className="text-[11px] font-bold text-destructive/80">
                        {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
