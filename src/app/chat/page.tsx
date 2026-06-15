
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Send, 
  Paperclip, 
  Loader2, 
  X, 
  ChevronDown, 
  MessageSquare,
  Users,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { 
  doc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where,
  limit
} from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import Link from "next/link";

export default function ChatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  const isAdmin = profile?.role === "admin";
  const [activeClub, setActiveClub] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !activeClub) {
      setActiveClub(profile.club || "General");
    }
  }, [profile, activeClub]);

  const clubsRef = useMemo(() => collection(db, "clubs"), [db]);
  const { data: clubs } = useCollection<any>(clubsRef);

  const currentClubId = activeClub || profile?.club || "General";
  
  const clubUsersQuery = useMemo(() => {
    if (!currentClubId) return null;
    return query(collection(db, "users"), where("club", "==", currentClubId));
  }, [db, currentClubId]);
  
  const { data: roster } = useCollection<any>(clubUsersQuery);

  const messagesRef = useMemo(() => collection(db, "messages"), [db]);
  const messagesQuery = useMemo(() => {
    if (!currentClubId) return null;
    return query(
      messagesRef, 
      where("club", "==", currentClubId),
      limit(50)
    );
  }, [messagesRef, currentClubId]);
  
  const { data: rawMessages, loading: messagesLoading } = useCollection<any>(messagesQuery);

  const messages = useMemo(() => {
    return [...rawMessages].sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || a._localTime || 0;
      const bTime = b.timestamp?.toMillis?.() || b._localTime || 0;
      return aTime - bTime;
    });
  }, [rawMessages]);

  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || !user || !currentClubId) return;

    const currentInput = input;
    const currentImage = selectedImage;
    const localNow = Date.now();
    
    setInput("");
    setSelectedImage(null);

    const messageData = {
      text: currentInput,
      imageUrl: currentImage || "",
      senderId: user.uid,
      senderName: profile?.displayName || profile?.username || user.displayName || "Member",
      senderPhoto: profile?.photoURL || user.photoURL || "",
      club: currentClubId,
      timestamp: serverTimestamp(),
      _localTime: localNow,
      isAi: false
    };

    addDoc(messagesRef, messageData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: messagesRef.path,
          operation: 'create',
          requestResourceData: messageData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (profileLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-svh bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-4 font-medium uppercase tracking-widest">Syncing Hub...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-svh bg-white overflow-hidden">
      <header className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <div className="relative shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-primary text-sm md:text-base">
              {currentClubId?.[0]?.toUpperCase() || 'H'}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 md:gap-2">
              <h2 className="font-headline font-bold text-sm md:text-lg truncate">{currentClubId} Hub</h2>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 md:h-6 md:w-6 rounded-full hover:bg-muted">
                      <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 rounded-xl border-none shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground p-3">Switch Club Hub</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveClub("General")} className="rounded-lg m-1 cursor-pointer">
                      General Hub
                    </DropdownMenuItem>
                    {clubs?.map((club: any) => (
                      <DropdownMenuItem 
                        key={club.id} 
                        onClick={() => setActiveClub(club.name)}
                        className="rounded-lg m-1 cursor-pointer"
                      >
                        {club.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
              <span className="flex items-center gap-1 text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Live
              </span>
              <span className="hidden sm:inline opacity-30">|</span>
              <span className="flex items-center gap-1">
                <Users className="w-2.5 h-2.5" />
                {roster?.length || 0}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex -space-x-1.5 mr-2">
            {roster?.slice(0, 3).map((member: any) => (
              <TooltipProvider key={member.uid}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm">
                      <AvatarImage src={member.photoURL} />
                      <AvatarFallback className="text-[8px] font-bold bg-muted">{member.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] font-bold uppercase">{member.displayName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 bg-background/30" viewportRef={scrollRef}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          {messagesLoading && messages.length === 0 && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!messagesLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-3">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground">
                <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Hub Ready</p>
              <p className="text-[10px] text-muted-foreground/60 max-w-[150px]">Send a message to start the real-time sync.</p>
            </div>
          )}
          {messages.map((msg: any) => (
            <div 
              key={msg.id || msg._localTime} 
              className={cn(
                "flex gap-2 md:gap-3",
                msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className="h-7 w-7 md:h-8 md:h-8 ring-1 ring-border shadow-sm shrink-0">
                <AvatarImage src={msg.senderPhoto} />
                <AvatarFallback className="bg-muted text-[10px] font-bold">
                  {msg.senderName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "flex flex-col space-y-1 max-w-[85%] md:max-w-[70%]",
                msg.senderId === user?.uid ? "items-end" : "items-start"
              )}>
                {msg.senderId !== user?.uid && (
                  <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                    {msg.senderName}
                  </span>
                )}
                <div className={cn(
                  "p-3 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm transition-all",
                  msg.senderId === user?.uid ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white border text-foreground rounded-tl-none"
                )}>
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-border/50 bg-black/5">
                      <img src={msg.imageUrl} alt="Shared" className="max-w-full h-auto object-contain max-h-[200px] md:max-h-[300px]" />
                    </div>
                  )}
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5 px-1 opacity-60">
                  {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </ScrollArea>

      <footer className="p-3 md:p-6 border-t bg-white shrink-0">
        <div className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-md">
                <img src={selectedImage} alt="Preview" className="h-20 md:h-32 w-auto object-cover" />
              </div>
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full shadow-md"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </div>
          )}
          
          <div className="relative flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-primary/10 focus-within:bg-white focus-within:border-primary/20">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground shrink-0 rounded-xl h-9 w-9"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${currentClubId}...`}
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-xs md:text-sm max-h-24 min-h-[36px] outline-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button 
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || !user}
              className="bg-primary hover:bg-primary/90 text-white shrink-0 h-9 w-9 p-0 rounded-xl transition-all active:scale-95 disabled:opacity-30"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3 px-1 text-[10px] text-muted-foreground font-medium">
            <Info className="w-3 h-3" />
            Looking for the AI Concierge? Use the <Link href="/chat/ai" className="text-primary font-bold hover:underline">AI Assistant</Link> for private help.
          </div>
        </div>
      </footer>
    </div>
  );
}
