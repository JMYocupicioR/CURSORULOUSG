"use client"

import { useState, useTransition } from "react"
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications"

type NotificationItem = {
  id: string
  title: string
  body: string | null
  type: string
  reference_id: string | null
  is_read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[]
  unreadCount: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id)
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setIsOpen(false)
    })
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
        aria-label="Notificaciones"
      >
        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors text-[22px]">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-xs text-primary hover:text-cyan-500 font-medium transition-colors disabled:opacity-50"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-200 dark:text-gray-700 mb-2 block">notifications_none</span>
                  <p className="text-sm text-gray-400">No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) handleMarkRead(notif.id)
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-white/3 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors flex gap-3 ${
                      !notif.is_read ? "bg-primary/5 dark:bg-primary/5" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.type === "live_session" 
                        ? "bg-red-500/10 text-red-400" 
                        : "bg-primary/10 text-primary"
                    }`}>
                      <span className="material-symbols-outlined text-base">
                        {notif.type === "live_session" ? "videocam" : "notifications"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${
                        !notif.is_read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"
                      }`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
