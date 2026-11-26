"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Megaphone, CheckCircle2, AlertCircle, MessageSquare, Calendar } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: "system" | "recruitment" | "task" | "message" | "event";
  href: string;
  timestamp: string;
  unread: boolean;
}

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  eventId?: string | null;
}

export function NotificationsDrawer() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"notifications" | "announcements">("notifications");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [role, setRole] = useState<string>("guest");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setNotifications(data.notifications || []);
          setAnnouncements(data.announcements || []);
          setRole(data.role || "guest");
          if ((data.notifications || []).length === 0 && (data.announcements || []).length > 0) {
            setTab("announcements");
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchNotifs();
    return () => {
      mounted = false;
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border/50 bg-secondary/50 text-foreground hover:bg-secondary transition-all cursor-pointer"
        aria-label="View notifications and announcements"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C01E30] text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] rounded-2xl border border-border/60 bg-card p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header tabs */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
            <div className="flex gap-1 p-1 bg-secondary/60 rounded-xl">
              <button
                type="button"
                onClick={() => setTab("notifications")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  tab === "notifications"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Alerts {unreadCount > 0 && `(${unreadCount})`}
              </button>
              <button
                type="button"
                onClick={() => setTab("announcements")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  tab === "announcements"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Notices ({announcements.length})
              </button>
            </div>
            <span className="text-[10px] font-mono uppercase text-muted-foreground">
              {role.replace("_", " ")}
            </span>
          </div>

          {/* List contents */}
          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
            {tab === "notifications" ? (
              notifications.length > 0 ? (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block p-3 rounded-xl border border-border/40 bg-background/50 hover:border-[#C01E30]/40 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-[#C01E30]">
                        {n.category === "recruitment" && <AlertCircle className="h-4 w-4" />}
                        {n.category === "task" && <CheckCircle2 className="h-4 w-4" />}
                        {n.category === "message" && <MessageSquare className="h-4 w-4" />}
                        {n.category === "event" && <Calendar className="h-4 w-4" />}
                        {n.category === "system" && <Bell className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {n.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No active alerts. You are completely caught up!
                </div>
              )
            ) : announcements.length > 0 ? (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl border border-border/40 bg-background/50 space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Megaphone className="h-3.5 w-3.5 text-[#C01E30] flex-shrink-0" />
                    <span className="truncate">{a.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {a.body}
                  </p>
                  <span className="text-[9px] font-mono text-muted-foreground/60 block pt-1">
                    {new Date(a.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No current cell announcements.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsDrawer;
