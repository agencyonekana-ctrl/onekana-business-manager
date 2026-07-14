import { useEffect, useState } from 'react'
import { Bell, ChevronRight, Maximize2, Minus, Send, ShieldCheck, Sparkles, X, Zap } from 'lucide-react'
import { dataClient } from '../../lib/data-client'
import { remoteApi } from '../../services/remote-api'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { StatusBadge } from './StatusBadge'

type AppNotification = {
  id: string
  title?: string
  message?: string
  body?: string
  readAt?: string | null
  read_at?: string | null
  createdAt?: string
  created_at?: string
}

type RoadmapItem = {
  id: string
  title?: string
  description?: string
  status?: string
  priority?: string
  targetDate?: string
  target_date?: string
}

export function RightSideBar() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return
    fetchPanelData()
  }, [open])

  async function fetchPanelData() {
    setLoading(true)
    try {
      const [notificationRows, roadmapRows] = await Promise.all([
        dataClient.db.notifications.list<AppNotification>({ orderBy: { createdAt: 'desc' } }),
        dataClient.db.roadmap.list<RoadmapItem>({ orderBy: { targetDate: 'asc' } }),
      ])
      setNotifications(notificationRows)
      setRoadmap(roadmapRows)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notification: AppNotification) {
    try {
      await remoteApi.notifications.markRead(notification.id)
      fetchPanelData()
    } catch {
      setError(true)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setMinimized(false)
        }}
        className="assistant-launcher fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-[1.4rem] bg-[#111111] px-4 py-3 text-left text-white shadow-xl ring-1 ring-white/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-label="Ouvrir les notifications ONEKANA"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/90 text-white">
          <Zap className="h-5 w-5" />
        </span>
        <span className="hidden min-w-44 sm:block">
          <span className="block text-sm font-black uppercase leading-none">ONEKANA</span>
          <span className="mt-1 flex items-center gap-1 text-xs text-white/65">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Notifications & roadmap
          </span>
        </span>
        <Maximize2 className="h-4 w-4 text-white/55" />
      </button>
    )
  }

  return (
    <aside className={`assistant-panel fixed bottom-5 right-5 z-50 overflow-hidden rounded-[1.6rem] border border-black/10 bg-white shadow-2xl transition-[height,width,transform,opacity] duration-300 ease-out ${
      minimized ? 'h-[76px] w-[min(420px,calc(100vw-2rem))]' : 'h-[min(720px,calc(100vh-2.5rem))] w-[min(420px,calc(100vw-2rem))]'
    }`}>
      <div className="flex items-center justify-between bg-[#111111] px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/90">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-black uppercase leading-none">ONEKANA</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-white/65">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Notifications & roadmap
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={() => setMinimized((value) => !value)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <div className="flex h-[calc(100%-80px)] flex-col">
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5 text-primary ring-1 ring-primary/10">
                <Sparkles className="h-9 w-9" />
              </div>
              <h2 className="text-2xl font-black">Bonjour</h2>
              <p className="mt-2 text-sm text-muted-foreground">Notifications et roadmap de gestion ONEKANA.</p>
            </div>

            <Tabs defaultValue="notifications">
              <TabsList className="grid w-full grid-cols-2 rounded-xl">
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              </TabsList>

              <TabsContent value="notifications" className="mt-4 space-y-3">
                {loading ? <PanelState text="Chargement..." /> :
                  error ? <PanelState text="Notifications temporairement indisponibles." /> :
                  notifications.length === 0 ? <PanelState text="Aucune notification pour le moment." /> :
                  notifications.map((notification) => {
                    const read = Boolean(notification.readAt || notification.read_at)
                    return (
                      <div key={notification.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold">{notification.title || 'Notification'}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{notification.message || notification.body || 'Sans message'}</p>
                          </div>
                          {!read && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{notification.createdAt || notification.created_at || 'Date non fournie'}</span>
                          {!read && <button className="font-bold text-primary" onClick={() => markAsRead(notification)}>Marquer lu</button>}
                        </div>
                      </div>
                    )
                  })}
              </TabsContent>

              <TabsContent value="roadmap" className="mt-4 space-y-3">
                {loading ? <PanelState text="Chargement..." /> :
                  error ? <PanelState text="Roadmap temporairement indisponible." /> :
                  roadmap.length === 0 ? <PanelState text="Aucun élément roadmap pour le moment." /> :
                  roadmap.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{item.title || 'Roadmap'}</div>
                          <p className="mt-1 text-sm text-muted-foreground">{item.description || 'Sans description'}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge tone="red">{item.status || 'planned'}</StatusBadge>
                        <StatusBadge>{item.priority || 'normal'}</StatusBadge>
                        {(item.targetDate || item.target_date) && <StatusBadge>{item.targetDate || item.target_date}</StatusBadge>}
                      </div>
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t border-border bg-white p-4">
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              Centre de suivi
              <Send className="ml-auto h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function PanelState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
