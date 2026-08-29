"use client";

import { User } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-forest">User Profile</h1>
                <p className="text-ink-muted">Manage your personal details.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-sage/30 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-20 rounded-full bg-forest text-white flex items-center justify-center font-bold text-2xl">
                    R
                </div>
                <h3 className="text-xl font-bold text-forest">Ramesh Patil</h3>
                <p className="text-ink-muted">+91 9876543210</p>
            </div>
        </div>
    );
}
