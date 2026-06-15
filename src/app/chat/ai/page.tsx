
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Send, 
  Sparkles, 
  Loader2, 
  User,
  Info,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { clubAIChatbotInfo } from "@/ai/flows/club-ai-chatbot-info";
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

export default function AIChatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const userRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  // User's Hub context
  const userClubId = profile?.club || "General";
  
  const meetingsQuery = useMemo(() => {
    if (!userClubId) return null;
    return query(collection(db, "meetings"), where("club", "==", userClubId), limit(5));
  }, [db, userClubId]);
  
  const rosterQuery = useMemo(() => {
    if (!userClubId) return null;
    return query(collection(db, "users"), where("club", "==", userClubId));
  }, [db, userClubId]);

  const { data: meetings } = useCollection<any>(meetingsQuery);
  const { data: roster } = useCollection<any>(rosterQuery);

  // Generate context string for Gemini
  const clubContext = useMemo(() => {
    const meetingInfo = meetings?.map(m => `- ${m.title} on ${m.date} at ${m.time} (${m.type})`).join("\n") || "No upcoming meetings.";
    const memberInfo = roster?.map(m => `- ${m.displayName} (${m.role})`).join("\n") || "No members listed.";
    return `Current Hub: ${userClubId}\n\nMembers:\n${memberInfo}\n\nUpcoming Meetings:\n${meetingInfo}`;
  }, [userClubId, meetings, roster]);

  // Use a private "ai-chat" channel per user
  const aiChannelId = useMemo(() => user ? `private-ai-${user.uid}` : null, [user?.uid]);

  const messagesRef = useMemo(() => collection(db, "messages"), [db]);
  const messagesQuery = useMemo(() => {
    if (!aiChannelId) return null;
    return query(
      messagesRef, 
      where("club", "==", aiChannelId),
      limit(50)
    );
  }, [messagesRef, aiChannelId]);
  
  const { data: rawMessages, loading: messagesLoading } = useCollection<any>(messagesQuery);

  const messages = useMemo(() => {
    return [...rawMessages].sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || a._localTime || 0;
      const bTime = b.timestamp?.toMillis?.() || b._localTime || 0;
      return aTime - bTime;
    });
  }, [rawMessages]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !user || !aiChannelId) return;

    const currentInput = input;
    const localNow = Date.now();
    
    setInput("");

    const messageData = {
      text: currentInput,
      senderId: user.uid,
      senderName: profile?.displayName || "You",
      senderPhoto: profile?.photoURL || user.photoURL || "",
      club: aiChannelId,
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

    setIsTyping(true);
    try {
      const response = await clubAIChatbotInfo({ 
        question: currentInput,
        clubContext: clubContext
      });
      
      const aiMessageData = {
        text: response.answer,
        senderId: "srm-ai",
        senderName: "SRM AI Concierge",
        senderPhoto: "",
        club: aiChannelId,
        timestamp: serverTimestamp(),
        _localTime: Date.now(),
        isAi: true
      };

      addDoc(messagesRef, aiMessageData)
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: messagesRef.path,
            operation: 'create',
            requestResourceData: aiMessageData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  if (profileLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-svh bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-4 font-medium uppercase tracking-widest">Waking up Gemini...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-svh bg-white overflow-hidden">
      <header className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <div className="relative shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0">
            <h2 className="font-headline font-bold text-sm md:text-lg truncate">SRM AI Assistant</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
              <span className="flex items-center gap-1 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Powered by Gemini
              </span>
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 bg-slate-50/50" viewportRef={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
          {messages.length === 0 && !messagesLoading && (
            <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary mb-2">
                <Bot className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-headline font-bold">How can I help you today?</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  I'm your dedicated AI Assistant. I have context on your current club, upcoming meetings, and more.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-4">
                {[
                  "Who are the club members?",
                  "When is our next meeting?",
                  "Tell me about the design workshop",
                  "How do I join another club?"
                ].map((hint, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="h-auto py-3 px-4 justify-start text-xs font-medium rounded-xl border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    onClick={() => setInput(hint)}
                  >
                    {hint}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg: any) => (
            <div 
              key={msg.id || msg._localTime} 
              className={cn(
                "flex gap-3 md:gap-4 group animate-in fade-in duration-300",
                msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0",
                msg.isAi ? "bg-primary text-white" : "bg-white border text-muted-foreground"
              )}>
                {msg.isAi ? <Sparkles className="w-4 h-4 md:w-5 md:h-5" /> : <User className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              <div className={cn(
                "flex flex-col space-y-1.5 max-w-[85%] md:max-w-[75%]",
                msg.senderId === user?.uid ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm transition-all",
                  msg.senderId === user?.uid ? "bg-primary text-primary-foreground rounded-tr-none" : 
                  "bg-white border text-foreground rounded-tl-none border-slate-200"
                )}>
                  {msg.isAi && <Badge className="mb-3 bg-primary/10 text-primary border-none text-[9px] h-4 px-2 uppercase font-bold tracking-wider">AI Response</Badge>}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing...'}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-slate-500 italic">Thinking with Gemini...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      <footer className="p-4 md:p-8 border-t bg-white shrink-0">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
            <Info className="w-3 h-3" />
            Your AI assistant is context-aware for the {userClubId} Hub.
          </div>
          <div className="relative flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white focus-within:border-primary/30">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about the hub..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-sm md:text-base max-h-32 min-h-[44px] outline-none"
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
              disabled={!input.trim() || isTyping}
              className="bg-primary hover:bg-primary/90 text-white shrink-0 h-11 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-primary/20"
            >
              <Send className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
