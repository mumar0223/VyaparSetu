"use client";

import Link from "next/link";
import { User, Shield, Bell, Trash2, LogOut, ChevronRight, Settings2, Globe } from "lucide-react";
import { getCurrentLanguage, setLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    // Reload page to reflect layout translations if we had fully integrated `dict` across all layouts
    window.location.reload();
  };

  const handleLogout = async () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    toast.success("Logged out (mock)");
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-20 md:pb-0">

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your account and preferences</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <ul className="divide-y divide-slate-100">

          <li className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 text-blue-600"><User className="size-5" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Account Profile</h4>
                <p className="text-sm text-slate-500">Update your email and phone</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-slate-400" />
          </li>

          <li className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-indigo-100 p-2 text-indigo-600"><Globe className="size-5" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Language</h4>
                <p className="text-sm text-slate-500">Choose your preferred language</p>
              </div>
            </div>
            <select
              value={lang}
              onChange={changeLanguage}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </li>

          <Link href="/settings/privacy" className="block">
            <li className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-600"><Shield className="size-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900">Privacy & Security</h4>
                  <p className="text-sm text-slate-500">Consent, data export, and security</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-slate-400" />
            </li>
          </Link>

          <Link href="/settings/recycle-bin" className="block">
            <li className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-600"><Trash2 className="size-5" /></div>
                <div>
                  <h4 className="font-bold text-slate-900">Recycle Bin</h4>
                  <p className="text-sm text-slate-500">Restore deleted expenses or data</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-slate-400" />
            </li>
          </Link>

          <li className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-100 p-2 text-slate-600"><Bell className="size-5" /></div>
              <div>
                <h4 className="font-bold text-slate-900">Notifications</h4>
                <p className="text-sm text-slate-500">Manage what alerts you receive</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-slate-400" />
          </li>

        </ul>
      </div>

      <div className="pt-4">
        <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3.5 font-bold text-red-600 transition-colors hover:bg-red-100">
          <LogOut className="size-5" /> Sign Out
        </button>
      </div>
    </div>
  );
}
