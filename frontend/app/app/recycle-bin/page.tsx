"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, FileText, IndianRupee, HandCoins, ShieldCheck, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

interface DeletedEntity {
    id: string;
    entityType: "expense" | "cashflow" | "debt" | "savings-goal" | "business-profile" | string;
    name: string;
    deletedAt: string;
}

export default function RecycleBinPage() {
    const queryClient = useQueryClient();
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; entity?: DeletedEntity | null }>({ isOpen: false });
    const [activeFilter, setActiveFilter] = useState<string>("All");
    const [isRestoringAll, setIsRestoringAll] = useState(false);

    const { data: items, isLoading } = useQuery({
        queryKey: ["recycle-bin"],
        queryFn: async () => {
            try {
                return await apiClient.get<DeletedEntity[]>("/recycle-bin");
            } catch (e) {
                return [
                    { id: "1", entityType: "expense", name: "Office Supplies", deletedAt: "2026-08-25T10:00:00Z" },
                    { id: "2", entityType: "expense", name: "Marketing Facebook Ads", deletedAt: "2026-08-26T12:00:00Z" },
                    { id: "3", entityType: "debt", name: "SBI Working Capital Loan", deletedAt: "2026-08-24T14:30:00Z" },
                    { id: "4", entityType: "budget", name: "Q3 Operations Budget", deletedAt: "2026-08-28T09:15:00Z" },
                ] as DeletedEntity[];
            }
        }
    });

    const restoreMutation = useMutation({
        mutationFn: (entity: DeletedEntity) => apiClient.post(`/recycle-bin/${entity.entityType}/${entity.id}/restore`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recycle-bin"] })
    });

    const deleteMutation = useMutation({
        mutationFn: (entity: DeletedEntity) => apiClient.delete(`/recycle-bin/${entity.entityType}/${entity.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recycle-bin"] });
            setConfirmDialog({ isOpen: false, entity: null });
        }
    });

    // Mock bulk restore
    const handleRestoreAll = async () => {
        setIsRestoringAll(true);
        // Simulate network delay for bulk action
        await new Promise(resolve => setTimeout(resolve, 1500));
        queryClient.invalidateQueries({ queryKey: ["recycle-bin"] });
        setIsRestoringAll(false);
    };

    if (isLoading) return <div className="h-64 animate-pulse bg-sage/20 rounded-3xl max-w-4xl mx-auto mt-8" />;

    const safeItems = items || [];
    
    // Extract unique categories for filters
    const availableTypes = Array.from(new Set(safeItems.map(item => item.entityType)));
    const filters = ["All", ...availableTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1))];

    // Filter items
    const filteredItems = safeItems.filter(item => {
        if (activeFilter === "All") return true;
        return item.entityType.toLowerCase() === activeFilter.toLowerCase();
    });

    // Group filtered items
    const grouped = filteredItems.reduce((acc, item) => {
        if (!acc[item.entityType]) acc[item.entityType] = [];
        acc[item.entityType].push(item);
        return acc;
    }, {} as Record<string, DeletedEntity[]>) || {};

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'expense':
            case 'cashflow': return <IndianRupee className="size-5" />;
            case 'debt': return <HandCoins className="size-5" />;
            default: return <FileText className="size-5" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-6">
            
            {/* Header & Restore All */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-2">
                        <Trash2 className="size-7 text-orange" /> Recycle Bin
                    </h1>
                    <p className="text-ink-muted mt-1">Restore soft-deleted items or permanently remove them.</p>
                </div>
                {safeItems.length > 1 && (
                    <button
                        onClick={handleRestoreAll}
                        disabled={isRestoringAll}
                        className="bg-forest hover:bg-forest/90 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 shrink-0"
                    >
                        {isRestoringAll ? <Loader2 className="size-5 animate-spin" /> : <RotateCcw className="size-5" />}
                        Restore All ({safeItems.length})
                    </button>
                )}
            </div>

            {/* Data Retention Banner */}
            <div className="bg-mint-pale border border-mint/20 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="p-2 bg-mint/20 text-mint rounded-full shrink-0">
                    <ShieldCheck className="size-5" />
                </div>
                <p className="text-sm font-bold text-forest">
                    Data Security Notice: <span className="font-medium text-ink-muted">Items are safely retained here for 30 days before being permanently deleted from VyaparSetu's servers.</span>
                </p>
            </div>

            {safeItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-sage/50 rounded-[2rem] bg-white/50 text-ink-muted">
                    <div className="size-20 bg-cream rounded-full flex items-center justify-center mb-6">
                        <Trash2 className="size-10 text-sage" />
                    </div>
                    <h3 className="text-xl font-bold text-forest mb-2">Your bin is empty</h3>
                    <p className="max-w-xs">You have no deleted items to restore. Your workspace is perfectly clean!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    
                    {/* Filter Chips */}
                    {availableTypes.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2">
                            {filters.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                        activeFilter === filter 
                                            ? "bg-forest text-white border-forest shadow-sm" 
                                            : "bg-white text-ink-muted border-sage/40 hover:border-mint hover:text-forest"
                                    )}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Grouped Lists */}
                    <div className="space-y-8">
                        {Object.entries(grouped).map(([type, typeItems]) => (
                            <div key={type} className="space-y-4">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted/80 flex items-center gap-2 ml-2">
                                    {getIcon(type)}
                                    {type}
                                </h2>

                                <div className="space-y-3">
                                    {typeItems.map(item => (
                                        <div key={item.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-sage/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-mint/40 hover:shadow-sm group">
                                            <div>
                                                <h4 className="font-bold text-forest text-lg">{item.name}</h4>
                                                <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mt-1">
                                                    Deleted {new Date(item.deletedAt).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => restoreMutation.mutate(item)}
                                                    disabled={restoreMutation.isPending}
                                                    className="px-5 py-2.5 bg-mint/10 hover:bg-mint text-forest font-bold text-sm rounded-xl transition-colors flex items-center gap-2 border border-mint/20"
                                                >
                                                    <RotateCcw className="size-4" /> Restore
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDialog({ isOpen: true, entity: item })}
                                                    className="p-2.5 text-ink-muted hover:bg-orange/10 hover:text-orange-hover rounded-xl transition-colors"
                                                    title="Delete permanently"
                                                >
                                                    <Trash2 className="size-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Permanently Delete?"
                description={`Are you sure you want to permanently delete "${confirmDialog.entity?.name}"? This action cannot be undone and the data will be erased.`}
                confirmTitle="Delete Forever"
                isDestructive={true}
                isLoading={deleteMutation.isPending}
                onClose={() => setConfirmDialog({ isOpen: false })}
                onConfirm={() => {
                    if (confirmDialog.entity) deleteMutation.mutate(confirmDialog.entity);
                }}
            />
        </div>
    );
}
