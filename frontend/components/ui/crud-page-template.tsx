"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, IndianRupee } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface CrudField {
    name: string;
    label: string;
    type: "text" | "number" | "date" | "select";
    options?: { label: string; value: string }[];
    required?: boolean;
}

interface CrudConfig {
    entityName: string;
    pluralName: string;
    endpoint: string;
    fields: CrudField[];
    renderItem: (item: any) => React.ReactNode;
}

interface CrudPageTemplateProps {
    config: CrudConfig;
}

export function CrudPageTemplate({ config }: CrudPageTemplateProps) {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});

    const { data: items = [], isLoading } = useQuery({
        queryKey: [config.endpoint],
        queryFn: async () => {
            try {
                return await apiClient.get<any[]>(config.endpoint);
            } catch (e) {
                // Mock fallback wrapper since backend might be offline
                return [
                    { id: "1", amount: 2500, category: "Operations", date: "2026-08-25", name: "Sample Item 1" },
                    { id: "2", amount: 4800, category: "Marketing", date: "2026-08-26", name: "Sample Item 2" },
                ];
            }
        }
    });

    const mutation = useMutation({
        mutationFn: async (payload: { id?: string; data: any }) => {
            if (payload.id) {
                return apiClient.patch(`${config.endpoint}/${payload.id}`, payload.data);
            }
            return apiClient.post(config.endpoint, payload.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [config.endpoint] });
            closeForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiClient.delete(`${config.endpoint}/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [config.endpoint] });
        }
    });

    const openForm = (item?: any) => {
        if (item) {
            setEditingId(item.id);
            setFormData(item);
        } else {
            setEditingId(null);
            setFormData({});
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({ id: editingId || undefined, data: formData });
    };

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-forest">{config.pluralName}</h1>
                    <p className="text-ink-muted hidden sm:block">Manage your {config.pluralName.toLowerCase()} securely.</p>
                </div>
                <button
                    onClick={() => openForm()}
                    className="bg-forest hover:bg-forest-deep text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus className="size-5" />
                    <span className="hidden sm:inline">Add {config.entityName}</span>
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse h-20 bg-sage/20 rounded-2xl" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-sage/50 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="size-16 bg-cream rounded-full flex items-center justify-center mb-4">
                        <IndianRupee className="size-8 text-sage" />
                    </div>
                    <h3 className="text-xl font-bold text-forest mb-2">No {config.pluralName.toLowerCase()} yet</h3>
                    <p className="text-ink-muted mb-6">Click the button above to add your first {config.entityName.toLowerCase()}.</p>
                    <button onClick={() => openForm()} className="text-orange hover:text-orange-hover font-bold flex items-center gap-2">
                        <Plus className="size-5" /> Add Now
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-white border border-sage/30 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                {config.renderItem(item)}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                <button
                                    onClick={() => openForm(item)}
                                    className="p-2 text-ink-muted hover:bg-mint-pale hover:text-forest rounded-lg transition-colors border border-transparent hover:border-mint/30"
                                >
                                    <Pencil className="size-4" />
                                </button>
                                <button
                                    onClick={() => deleteMutation.mutate(item.id)}
                                    disabled={deleteMutation.isPending}
                                    className="p-2 text-ink-muted hover:bg-top hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Sheet / Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 md:zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-sage/30 bg-cream/30">
                            <h2 className="text-xl font-bold text-forest">
                                {editingId ? "Edit" : "New"} {config.entityName}
                            </h2>
                            <button onClick={closeForm} className="p-2 text-ink-muted hover:text-ink hover:bg-sage/20 rounded-full transition-colors">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                            {config.fields.map(field => (
                                <div key={field.name} className="space-y-2">
                                    <label className="block text-sm font-bold text-ink-muted">
                                        {field.label} {field.required && <span className="text-orange">*</span>}
                                    </label>

                                    {field.type === "select" ? (
                                        <select
                                            value={formData[field.name] || ""}
                                            onChange={e => handleChange(field.name, e.target.value)}
                                            required={field.required}
                                            className="w-full bg-cream border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-3 text-ink font-bold outline-none transition-all appearance-none"
                                        >
                                            <option value="" disabled>Select {field.label}</option>
                                            {field.options?.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={formData[field.name] || ""}
                                            onChange={e => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                            required={field.required}
                                            className="w-full bg-cream border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-3 text-ink font-bold outline-none transition-all"
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="pt-6 border-t border-sage/30 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="flex-1 bg-orange hover:bg-orange-hover text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70"
                                >
                                    {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                                    {editingId ? "Save Changes" : `Create ${config.entityName}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
