"use client";

import { useState } from "react";
import {
  Bell,
  Clock,
  Award,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface NotificationItem {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string | Date;
}

export function NotificationsClient({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to update notifications");
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Bell className="size-7 text-mint" /> Real-Time Alerts &amp; Deadlines
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Important subsidy cutoff dates, bank EMI notices, and advisory alerts
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="bg-white dark:bg-card border border-sage/40 dark:border-border hover:bg-cream dark:hover:bg-muted text-foreground font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border shadow-xs divide-y divide-sage/20 dark:divide-border/50 flex-1 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="size-10 text-sage dark:text-muted-foreground mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-base">No notifications</h4>
            <p className="text-xs text-muted-foreground mt-1">You are all caught up with deadlines and scheme alerts.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                n.isRead
                  ? "bg-white dark:bg-card hover:bg-cream/20 dark:hover:bg-muted/20"
                  : "bg-mint-pale/40 dark:bg-mint/10 hover:bg-mint-pale/60 dark:hover:bg-mint/20"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  n.isRead
                    ? "bg-cream dark:bg-muted text-muted-foreground"
                    : "bg-mint text-forest dark:text-black font-bold"
                }`}
              >
                {n.type === "WARNING" ? (
                  <AlertCircle className="size-5" />
                ) : n.type === "SCHEME" ? (
                  <Award className="size-5" />
                ) : (
                  <Bell className="size-5" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-forest dark:text-mint">
                    {n.type || "System Alert"}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">{n.message}</p>
              </div>

              {!n.isRead && (
                <span className="size-2 bg-orange rounded-full shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
