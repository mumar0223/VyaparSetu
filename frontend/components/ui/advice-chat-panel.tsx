"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
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

export function AdviceChatPanel({ initialContext, className }: AdviceChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: initialContext || "Hello! I am your AI Business Advisor. How can I help you grow your business today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const activeLanguage = useAppStore((state) => state.activeLanguage);

    const mutation = useMutation({
        mutationFn: async (question: string) => {
            // POST /ai/advice {question?, lang}
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || mutation.isPending) return;

        const userMsg = input.trim();
        setInput("");

        setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "user", content: userMsg, timestamp: new Date() },
        ]);

        mutation.mutate(userMsg);
    };

    return (
        <div className={cn("flex flex-col h-full bg-white rounded-3xl border border-sage/30 shadow-sm overflow-hidden", className)}>
            <div className="p-4 border-b border-sage/30 bg-cream/50 flex items-center gap-3">
                <div className="p-2 bg-mint rounded-xl text-forest shrink-0">
                    <Bot className="size-5" />
                </div>
                <div>
                    <h3 className="font-bold text-forest">AI Business Advisor</h3>
                    <p className="text-xs text-ink-muted">Always ready to help</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex max-w-[85%] sm:max-w-[75%]",
                            msg.role === "user" ? "ml-auto justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "rounded-2xl px-4 py-3 shadow-sm",
                                msg.role === "user"
                                    ? "bg-forest text-white rounded-br-sm"
                                    : "bg-cream border border-sage/30 text-ink rounded-bl-sm"
                            )}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <span className={cn(
                                "text-[10px] block mt-1.5 opacity-60",
                                msg.role === "user" ? "text-right" : "text-left"
                            )}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                {mutation.isPending && (
                    <div className="flex justify-start max-w-[85%] sm:max-w-[75%]">
                        <div className="bg-cream border border-sage/30 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin text-forest" />
                            <span className="text-sm text-ink-muted">Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 bg-cream/30 border-t border-sage/30">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about planning, market trends, or loans..."
                        className="flex-1 bg-white border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || mutation.isPending}
                        className="bg-orange hover:bg-orange-hover disabled:bg-sage text-white p-3 rounded-xl transition-colors shrink-0"
                    >
                        <Send className="size-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
