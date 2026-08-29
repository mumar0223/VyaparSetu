"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmTitle?: string;
    cancelTitle?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmTitle = "Confirm",
    cancelTitle = "Cancel",
    isDestructive = false,
    isLoading = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                        isDestructive ? "bg-red-100 text-red-600" : "bg-mint-pale text-forest"
                    )}>
                        <AlertTriangle className="size-6" />
                    </div>
                    <h2 className="text-xl font-bold text-ink mb-2">{title}</h2>
                    <p className="text-ink-muted text-sm leading-relaxed">{description}</p>
                </div>

                <div className="p-4 bg-cream/50 border-t border-sage/30 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-white border border-sage/40 hover:bg-sage/10 text-ink-muted font-bold py-3 rounded-xl transition-all"
                    >
                        {cancelTitle}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 text-white font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2",
                            isDestructive
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-forest hover:bg-forest-deep"
                        )}
                    >
                        {isLoading && <Loader2 className="size-4 animate-spin" />}
                        {confirmTitle}
                    </button>
                </div>
            </div>
        </div>
    );
}
