"use client";

import { useState, useEffect } from "react";
import { Send, Bot, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { useAppStore } from "@/lib/store";
import { useMutation } from "@tanstack/react-query";

interface Message {
    id: string;
    role: "assistant" | "user";
    content: string;
    timestamp: Date;
}

interface AdviceChatPanelProps {
    initialContext?: string;
    className?: string;
}

const QUICK_ACTIONS = [
    "Analyze local competition",
    "Suggest marketing ideas",
    "Improve cash flow",
    "Find government schemes",
    "Growth opportunities nearby"
];

export function AdviceChatPanel({ initialContext, className }: AdviceChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: initialContext || "Hello! I am your AI Business Advisor. How can I help you grow your enterprise today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [mounted, setMounted] = useState(false);
    const activeLanguage = useAppStore((state) => state.activeLanguage);

    useEffect(() => {
        setMounted(true);
    }, []);

    const mutation = useMutation({
        mutationFn: async (question: string) => {
            return apiClient.post<{ answer: string }>("/ai/advice", {
                question,
                lang: activeLanguage,
            });
        },
        onSuccess: (data) => {
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: "assistant", content: data.answer, timestamp: new Date() },
            ]);
        },
        onError: () => {
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: "assistant", content: "I am having trouble connecting right now. Please try again later.", timestamp: new Date() },
            ]);
        },
    });

    const submitMessage = (userMsg: string) => {
        if (!userMsg.trim() || mutation.isPending) return;
        
        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "user", content: userMsg, timestamp: new Date() },
        ]);
        mutation.mutate(userMsg);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const msg = input.trim();
        setInput("");
        submitMessage(msg);
    };

    return (
        <div className={cn("flex flex-col h-full bg-[#fdfbf7] rounded-[2rem] border border-sage/30 shadow-sm overflow-hidden", className)}>
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-sage/30 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-mint/10 rounded-xl border border-mint/20">
                        <Sparkles className="size-5 text-mint" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-forest text-lg">AI Business Copilot</h3>
                        <p className="text-xs font-bold text-mint uppercase tracking-wider">Online & Ready</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex w-full",
                            msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm",
                                msg.role === "user"
                                    ? "bg-forest text-white rounded-tr-sm"
                                    : "bg-white border border-sage/30 text-ink rounded-tl-sm"
                            )}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <span className={cn(
                                "text-[10px] block mt-2 font-medium opacity-50",
                                msg.role === "user" ? "text-right text-mint-pale" : "text-left"
                            )}>
                                {mounted ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
                            </span>
                        </div>
                    </div>
                ))}
                {mutation.isPending && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-sage/30 shadow-sm rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                            <Loader2 className="size-4 animate-spin text-mint" />
                            <span className="text-sm font-medium text-ink-muted">Analyzing request...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-sage/30 space-y-3">
                
                {/* Quick Actions Scrollbar */}
                {messages.length < 3 && (
                    <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {QUICK_ACTIONS.map(action => (
                            <button
                                key={action}
                                onClick={() => submitMessage(action)}
                                disabled={mutation.isPending}
                                className="shrink-0 px-4 py-2 bg-cream hover:bg-mint-pale text-forest text-xs font-bold rounded-full transition-colors border border-sage/20 disabled:opacity-50"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about market trends, loans, or marketing..."
                        className="w-full bg-cream focus:bg-white border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-2xl pl-5 pr-14 py-3.5 text-sm font-medium outline-none transition-all"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || mutation.isPending}
                        className="absolute right-2 bg-orange hover:bg-orange-hover disabled:bg-sage disabled:text-ink-muted text-white p-2.5 rounded-xl transition-all shadow-sm"
                    >
                        <Send className="size-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
