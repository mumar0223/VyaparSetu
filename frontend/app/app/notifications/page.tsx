import { Bell, CheckCircle2 } from "lucide-react";

export default function NotificationsPage() {
    return (
        <div className="mx-auto max-w-2xl space-y-6 pb-20 md:pb-0">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h2>
                    <p className="text-sm text-slate-500">Updates and alerts</p>
                </div>
                <button className="text-sm font-semibold text-blue-600 hover:underline">
                    Mark all as read
                </button>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-5 hover:bg-slate-50 transition">
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600 shrink-0">
                        <Bell className="size-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-slate-900">Your SBI loan is due in 5 days</h4>
                        <p className="text-sm text-slate-600">Please prepare ₹4,500.</p>
                        <p className="text-xs text-slate-400">2 hours ago</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-1"></div>
                </div>

                <div className="flex items-start gap-4 p-5 hover:bg-slate-50 transition border-l-2 border-transparent border-l-slate-200">
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 shrink-0">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <div className="flex-1 space-y-1 text-slate-500">
                        <h4 className="font-bold text-slate-700">Goal achieved!</h4>
                        <p className="text-sm">You reached 100% of your Rent Deposit savings goal.</p>
                        <p className="text-xs font-semibold">Yesterday</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
