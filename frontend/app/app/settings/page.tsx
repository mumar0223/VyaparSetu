"use client";

import Link from "next/link";
import { User, ShieldCheck, Bell, Trash2, LogOut, ChevronRight, Globe, Download, Settings as SettingsIcon } from "lucide-react";
import { getCurrentLanguage, setLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [lang, setLang] = useState("en");

  useEffect(() => {
    setLang(getCurrentLanguage());
  }, []);

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as "en" | "hi";
    setLanguage(newLang);
    setLang(newLang);
    window.location.reload();
  };

  const handleLogout = async () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    toast.success("Logged out securely.");
    router.push("/");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-6">
      
      {/* Header */}
      <div className="space-y-1 border-b border-sage/30 pb-6">
        <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-2">
            <SettingsIcon className="size-7 text-orange" /> Settings & Preferences
        </h1>
        <p className="text-ink-muted mt-1">Manage your account, privacy, language, and application preferences.</p>
      </div>

      <div className="space-y-8">
          
        {/* GROUP 1: Account */}
        <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted ml-2">Account</h3>
            <div className="bg-white rounded-[2rem] border border-sage/30 overflow-hidden shadow-sm">
                <div className="divide-y divide-sage/20">
                    
                    {/* Profile */}
                    <div className="p-5 hover:bg-sage/5 transition-colors cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-sage/20 p-2.5 border border-sage/40 text-forest"><User className="size-5" /></div>
                            <div>
                                <h4 className="font-bold text-forest text-lg">Account Profile</h4>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mt-0.5">Update email and phone</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted bg-sage/10 px-2.5 py-1 rounded-md hidden sm:inline-block">Complete</span>
                            <ChevronRight className="size-5 text-ink-muted group-hover:text-forest transition-colors" />
                        </div>
                    </div>

                    {/* Language */}
                    <div className="p-5 hover:bg-sage/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-sage/20 p-2.5 border border-sage/40 text-forest"><Globe className="size-5" /></div>
                            <div>
                                <h4 className="font-bold text-forest text-lg">Language</h4>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mt-0.5">Choose your preferred language</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select
                                value={lang}
                                onChange={changeLanguage}
                                className="w-full sm:w-auto bg-cream border border-sage/40 focus:border-mint focus:ring-2 focus:ring-mint-light rounded-xl px-4 py-2.5 text-forest font-bold outline-none transition-all cursor-pointer"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* GROUP 2: Privacy & Security */}
        <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted ml-2">Privacy & Security</h3>
            <div className="bg-white rounded-[2rem] border border-sage/30 overflow-hidden shadow-sm">
                <div className="divide-y divide-sage/20">
                    
                    {/* Privacy & Consent */}
                    <Link href="/app/privacy-consent" className="block">
                        <div className="p-5 hover:bg-sage/5 transition-colors cursor-pointer flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-mint/20 p-2.5 border border-mint/30 text-mint"><ShieldCheck className="size-5" /></div>
                                <div>
                                    <h4 className="font-bold text-forest text-lg">Privacy & Consent</h4>
                                    <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mt-0.5">Account Aggregator & DPDP Compliance</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-mint bg-mint/10 px-2.5 py-1 rounded-md border border-mint/20 hidden sm:inline-block">Consent Active</span>
                                <ChevronRight className="size-5 text-ink-muted group-hover:text-forest transition-colors" />
                            </div>
                        </div>
                    </Link>

                    {/* Data Export (Placeholder) */}
                    <div className="p-5 hover:bg-sage/5 transition-colors cursor-pointer flex items-center justify-between group opacity-70 hover:opacity-100">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-sage/20 p-2.5 border border-sage/40 text-forest"><Download className="size-5" /></div>
                            <div>
                                <h4 className="font-bold text-forest text-lg">Data Export</h4>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mt-0.5">Download your platform data</p>
                            </div>
                        </div>
                        <ChevronRight className="size-5 text-ink-muted group-hover:text-forest transition-colors" />
                    </div>
                </div>
            </div>
        </div>

        {/* GROUP 3: Application */}
        <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted ml-2">Application</h3>
            <div className="bg-white rounded-[2rem] border border-sage/30 overflow-hidden shadow-sm">
                <div className="divide-y divide-sage/20">
                    
                    {/* Notifications */}
                    <div className="p-5 hover:bg-sage/5 transition-colors cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-orange/10 p-2.5 border border-orange/20 text-orange"><Bell className="size-5" /></div>
                            <div>
                                <h4 className="font-bold text-forest text-lg">Notifications</h4>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mt-0.5">Manage SMS and Email alerts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-sage/20 px-2.5 py-1 rounded-md hidden sm:inline-block">Enabled</span>
                            <ChevronRight className="size-5 text-ink-muted group-hover:text-forest transition-colors" />
                        </div>
                    </div>

                    {/* Recycle Bin */}
                    <Link href="/app/recycle-bin" className="block">
                        <div className="p-5 hover:bg-sage/5 transition-colors cursor-pointer flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-sage/20 p-2.5 border border-sage/40 text-forest"><Trash2 className="size-5" /></div>
                                <div>
                                    <h4 className="font-bold text-forest text-lg">Recycle Bin</h4>
                                    <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mt-0.5">Restore deleted expenses or data</p>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-ink-muted group-hover:text-forest transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>

        {/* GROUP 4: Account Actions (Danger Zone) */}
        <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted ml-2">Account Actions</h3>
            <div className="bg-red-50/50 rounded-[2rem] border border-red-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h4 className="font-bold text-red-900 text-lg">Sign Out</h4>
                    <p className="text-sm font-medium text-red-700/80 mt-1">End your current session securely across all devices.</p>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition-all hover:bg-red-700 shadow-sm active:scale-95"
                >
                    <LogOut className="size-5" /> Sign Out
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
