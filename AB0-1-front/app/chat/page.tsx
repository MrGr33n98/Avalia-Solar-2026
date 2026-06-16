"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { createConsumer } from "@rails/actioncable";
import { getApiBaseUrl } from "@/lib/api-config";
import { getStoredToken } from "@/lib/auth/token";
import { conversationsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Conversation {
  id: number;
  user_id: number;
  company_id: number;
  user_name: string;
  company_name: string;
  company_logo?: string;
  last_message?: string;
}

interface Message {
  id: number;
  body: string;
  sender_type: string;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  
  const cableRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadConversations();
  }, [isAuthenticated, router]);

  const loadConversations = async () => {
    try {
      const data = await conversationsApi.getAll();
      setConversations(data || []);
      
      const companyId = searchParams.get("company_id");
      if (companyId) {
        let conv = data.find((c: Conversation) => c.company_id === Number(companyId));
        if (!conv) {
          // If no conversation exists for this company, create one
          conv = await conversationsApi.create(Number(companyId));
          setConversations((prev) => [conv, ...prev]);
        }
        selectConversation(conv);
      } else if (data.length > 0) {
        selectConversation(data[0]);
      }
    } catch (error) {
      console.error("Error loading conversations", error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    try {
      const msgs = await conversationsApi.getMessages(conv.id);
      setMessages(msgs || []);
      setupActionCable(conv.id);
    } catch (error) {
      console.error("Error loading messages", error);
    }
  };

  const setupActionCable = async (conversationId: number) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    if (!cableRef.current) {
      const token = await getStoredToken();
      // Adjust URL if needed (replace http with ws)
      const wsUrl = getApiBaseUrl().replace('http', 'ws').replace('/api/v1', '/cable');
      cableRef.current = createConsumer(`${wsUrl}?token=${token}`);
    }

    channelRef.current = cableRef.current.subscriptions.create(
      { channel: "ConversationChannel", conversation_id: conversationId },
      {
        received: (data: Message) => {
          setMessages((prev) => [...prev, data]);
          scrollToBottom();
        }
      }
    );
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeConversation) return;
    try {
      const msgText = inputMessage;
      setInputMessage("");
      await conversationsApi.sendMessage(activeConversation.id, msgText);
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-[400px] w-full max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] w-full max-w-7xl flex-col bg-white md:flex-row md:border md:shadow-sm">
      {/* Sidebar */}
      <div className="w-full border-r border-slate-200 md:w-1/3 md:max-w-xs flex-col flex">
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">Mensagens</h2>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500">Nenhuma conversa encontrada.</div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-slate-50 ${activeConversation?.id === conv.id ? "bg-slate-50" : ""}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.company_logo || ""} />
                    <AvatarFallback>{(conv.company_name || "C").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-semibold truncate text-sm">
                      {user?.role === "company" ? conv.user_name : conv.company_name}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {conv.last_message || "Iniciar conversa"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {activeConversation ? (
          <>
            <div className="flex items-center gap-3 border-b bg-white p-4 shadow-sm">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activeConversation.company_logo || ""} />
                <AvatarFallback>{(activeConversation.company_name || "C").charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="font-bold">
                {user?.role === "company" ? activeConversation.user_name : activeConversation.company_name}
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-3">
                {messages.map((msg, idx) => {
                  const isMine = (user?.role === "company" && msg.sender_type === "Company") || 
                                 (user?.role !== "company" && msg.sender_type === "User");
                  return (
                    <div key={idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMine ? "bg-blue-600 text-white" : "bg-white text-slate-800 shadow-sm border border-slate-100"
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t bg-white p-4">
              <div className="mx-auto flex max-w-4xl items-center gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <MessageCircle className="mb-4 h-12 w-12 opacity-50" />
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
