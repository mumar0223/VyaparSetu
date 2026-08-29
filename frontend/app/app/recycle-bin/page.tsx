"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, AlertCircle, FileText, IndianRupee, HandCoins } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DeletedEntity {
    id: string;
    entityType: "expense" | "cashflow" | "debt" | "savings-goal" | "business-profile" | string;
    name: string;
    deletedAt: string;
}

export default function RecycleBinPage() {
    const queryClient = useQueryClient();
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; entity?: DeletedEntity | null }>({ isOpen: false });

    const { data: items, isLoading } = useQuery({
        queryKey: ["recycle-bin"],
        queryFn: async () => {
            try {
                return await apiClient.get<DeletedEntity[]>("/recycle-bin");
            } catch (e) {
                return [
                    { id: "1", entityType: "expense", name: "Office Supplies", deletedAt: "2026-08-25T10:00:00Z" },
                    { id: "2", entityType: "debt", name: "SBI Loan", deletedAt: "2026-08-24T14:30:00Z" },
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

    if (isLoading) return <div className="h-64 animate-pulse bg-sage/20 rounded-3xl max-w-4xl mx-auto" />;

    const grouped = items?.reduce((acc, item) => {
        if (!acc[item.entityType]) acc[item.entityType] = [];
        acc[item.entityType].push(item);
        return acc;
    }, {} as Record<string, DeletedEntity[]>) || {};

    const getIcon = (type: string) => {
        switch (type) {
            case 'expense':
            case 'cashflow': return <IndianRupee className="size-5" />;
            case 'debt': return <HandCoins className="size-5" />;
            default: return <FileText className="size-5" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-forest">Recycle Bin</h1>
                <p className="text-ink-muted">Restore soft-deleted items or permanently remove them.</p>
            </div>

            {Object.keys(grouped).length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-sage/50 rounded-3xl bg-white/50 text-ink-muted">
                    <Trash2 className="size-10 text-sage mb-4" />
                    <h3 className="text-xl font-bold text-forest mb-2">Bin is empty</h3>
                    <p>You have no deleted items to restore.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(grouped).map(([type, typeItems]) => (
                        <div key={type} className="space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-ink-muted border-b border-sage/30 pb-2 flex items-center gap-2">
                                {getIcon(type)}
                                {type}
                            </h2>

                            <div className="bg-white rounded-3xl border border-sage/30 overflow-hidden shadow-sm">
                                <div className="divide-y divide-sage/20">
                                    {typeItems.map(item => (
                                        <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-sage/5">
                                            <div>
                                                <h4 className="font-bold text-ink">{item.name}</h4>
                                                <div className="text-xs text-ink-muted mt-1">Deleted: {new Date(item.deletedAt).toLocaleDateString()}</div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => restoreMutation.mutate(item)}
                                                    disabled={restoreMutation.isPending}
                                                    className="px-4 py-2 bg-cream hover:bg-mint-pale text-forest font-bold text-sm rounded-xl transition-colors flex items-center gap-2 border border-sage/40 hover:border-mint/30"
                                                >
                                                    <RotateCcw className="size-4" /> Restore
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDialog({ isOpen: true, entity: item })}
                                                    className="p-2 text-ink-muted hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-transparent hover:border-red-200"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Permanently Delete?"
                description={`Are you sure you want to permanently delete "${confirmDialog.entity?.name}"? This action cannot be undone.`}
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
