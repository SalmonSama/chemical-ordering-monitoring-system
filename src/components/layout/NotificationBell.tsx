"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

// Define Notification Type matching the DB
type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  user_id: string;
};

export function NotificationBell() {
  const { profile } = useUser();
  const supabase = createClient();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (!profile?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`notifications:user_id=eq.${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setUnreadCount((count) => count + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          if (updated.is_read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    setIsOpen(false);

    // Navigate to link if present
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    
    // Update local state immediately for perceived performance
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 rounded-lg transition-base hover:bg-[#F3F4F6] dark:hover:bg-[#374151]"
        style={{ color: "var(--color-text-muted)" }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--color-surface-card)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50 animate-fade-in flex flex-col overflow-hidden"
          style={{
            background: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
            maxHeight: "calc(100vh - 5rem)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs font-medium hover:underline transition-base flex items-center gap-1"
                style={{ color: "var(--color-brand-600)" }}
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 p-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-3 py-3 rounded-lg flex gap-3 cursor-pointer transition-base hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] ${
                      !notif.is_read ? "bg-[#EFF6FF] dark:bg-[#1E3A8A]/30" : ""
                    }`}
                  >
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm mb-0.5 ${!notif.is_read ? "font-semibold" : "font-medium"}`}
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                        {notif.body}
                      </p>
                      <p className="text-[10px] mt-1.5" style={{ color: "var(--color-text-tertiary)" }}>
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
