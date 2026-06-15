
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  useUser, 
  useAuth, 
  useFirestore,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
} from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Loader2, AtSign, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SRMLogo } from "@/components/SRMLogo";

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Reset error when user starts typing
  useEffect(() => {
    if (authError) setAuthError(null);
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!username || !password) return;
    
    const input = username.trim().toLowerCase();
    setIsAuthLoading(true);

    try {
      // 1. Determine the login email
      const loginEmail = input.includes("@") ? input : `${input}@assembla.app`;

      // 2. Special case for bootstrap admin
      if (input === "admin" && password === "admin") {
        const adminEmail = "admin@assembla.app";
        const bootstrapPass = "admin_secure_123_hub";
        
        try {
          await signInWithEmailAndPassword(auth, adminEmail, password);
        } catch (err: any) {
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
             try {
               await signInWithEmailAndPassword(auth, adminEmail, bootstrapPass);
             } catch (bootstrapErr: any) {
                if (bootstrapErr.code === 'auth/user-not-found') {
                  const userCred = await createUserWithEmailAndPassword(auth, adminEmail, bootstrapPass);
                  const adminDocRef = doc(db, "users", userCred.user.uid);
                  await setDoc(adminDocRef, {
                    uid: userCred.user.uid,
                    username: "admin",
                    email: adminEmail,
                    role: "admin",
                    displayName: "Master Admin",
                    createdAt: new Date().toISOString()
                  });
                } else {
                  throw bootstrapErr;
                }
             }
          } else {
            throw err;
          }
        }
        router.push("/dashboard");
        return;
      }

      // 3. Standard Member Login
      await signInWithEmailAndPassword(auth, loginEmail, password);
      
      toast({ title: "Access Granted", description: `Authorized access to the hub.` });
      setFailedAttempts(0);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error.code);
      setFailedAttempts(prev => prev + 1);
      
      let message = "Access denied. Check your credentials.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        message = "Invalid username or password.";
      } else if (error.code === 'auth/wrong-password') {
        message = "Incorrect password.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. This account has been temporarily disabled for your security. Please wait a few minutes and try again.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "Login service is currently disabled. Please contact an administrator.";
      }
      
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-background space-y-6 animate-in fade-in duration-500">
        <SRMLogo withCredits className="text-primary" />
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-4 md:p-6 relative overflow-hidden">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center">
        <div className="hidden lg:flex flex-col space-y-8">
          <SRMLogo withCredits textClassName="text-5xl" creditsClassName="text-xs" />
          <div className="space-y-4">
            <h1 className="text-6xl font-headline font-bold leading-tight">
              Hub <span className="text-primary italic">Portal.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-md leading-relaxed font-medium">
              Real-time collaboration for the community. Use your official username to enter.
            </p>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <Card className="w-full max-w-md border-none shadow-2xl shadow-indigo-500/10 bg-white/95 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center space-y-2 pt-10 md:pt-12 px-6">
              <div className="flex justify-center mb-4 lg:hidden">
                <SRMLogo withCredits className="text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-headline font-bold">
                SRM Hub Login
              </CardTitle>
              <CardDescription className="text-sm md:text-base font-bold uppercase tracking-widest text-muted-foreground/60">
                Verified Environment
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-10 md:pb-12 px-8 md:px-10 space-y-6">
              
              {authError && (
                <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/10 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-xs font-bold uppercase tracking-tight">{authError}</AlertDescription>
                </Alert>
              )}

              {failedAttempts >= 5 && !authError && (
                <Alert className="rounded-xl border-amber-200 bg-amber-50 text-amber-800">
                  <Info className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-[10px] font-bold uppercase tracking-tight">
                    Warning: Multiple failed attempts. Verify your ID with a Hub President to avoid temporary lockout.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Username or Email</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      id="username" 
                      placeholder="e.g. jdoe1234" 
                      className="pl-10 rounded-xl h-12 border-muted/30 bg-muted/20 focus-visible:bg-white transition-all"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 rounded-xl h-12 border-muted/30 bg-muted/20 focus-visible:bg-white transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Enter Hub
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center pt-6 border-t border-muted/50">
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                  Authorized Hub Access Only
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
