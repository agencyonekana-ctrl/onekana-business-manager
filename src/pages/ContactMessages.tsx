import { useEffect, useState } from 'react'
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'

type ContactMessage = {
  id: string
  name: string
  email: string
  subject?: string
  message: string
  status?: string
  createdAt?: string
  created_at?: string
}

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ContactMessage | null>(null)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  useEffect(() => {
    fetchMessages()
  }, [])

  async function fetchMessages() {
    setLoading(true)
    try {
      const rows = await dataClient.db.contactMessages.list<ContactMessage>({ orderBy: { createdAt: 'desc' } })
      setMessages(rows)
    } catch {
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  async function markHandled(message: ContactMessage) {
    try {
      await dataClient.db.contactMessages.update(message.id, { ...message, status: 'handled' })
      toast.success('Demande marquée comme traitée')
      fetchMessages()
    } catch {
      toast.error('Impossible de mettre à jour la demande')
    }
  }

  function openEdit(message: ContactMessage) {
    setEditing(message)
    setForm({
      name: message.name || '',
      email: message.email || '',
      subject: message.subject || '',
      message: message.message || '',
    })
  }

  function closeEdit() {
    setEditing(null)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault()
    if (!editing) return

    try {
      await dataClient.db.contactMessages.update(editing.id, { ...editing, ...form })
      toast.success('Demande modifiee')
      closeEdit()
      fetchMessages()
    } catch {
      toast.error('Impossible de modifier la demande')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette demande client ?')) return
    try {
      await dataClient.db.contactMessages.delete(id)
      toast.success('Demande supprimée')
      fetchMessages()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ventes OOH"
        title="Demandes clients"
        description="Point d'entrée commercial: qualifiez les messages reçus depuis le site public ONEKANA avant de préparer un pack ou une campagne."
      />

      <Card className="border-primary/15 bg-white" data-tour="client-requests-table">
        <CardContent className="p-0">
          {loading ? (
            <div className="h-32 p-6 text-center text-sm text-muted-foreground">Chargement des demandes...</div>
          ) : messages.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Aucune demande client"
                description="Les nouveaux messages du site public apparaîtront ici dès qu’ils seront disponibles."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Contact</TableHead>
                  <TableHead>Besoin</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="font-bold">{message.name}</div>
                      <a className="text-xs text-primary" href={`mailto:${message.email}`}>{message.email}</a>
                    </TableCell>
                    <TableCell>{message.subject || 'Demande générale'}</TableCell>
                    <TableCell className="max-w-md truncate text-sm text-muted-foreground">{message.message}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                        message.status === 'handled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {message.status === 'handled' ? 'Traitée' : 'Nouvelle'}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(message)} aria-label="Modifier la demande">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier la demande</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => markHandled(message)} aria-label="Marquer comme traitée">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Marquer cette demande comme traitée</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(message.id)} aria-label="Supprimer la demande">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Supprimer la demande</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Modifier la demande client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="request-name">Nom</Label>
                <Input id="request-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-email">Email</Label>
                <Input id="request-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-subject">Besoin</Label>
              <Input id="request-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-message">Message</Label>
              <Textarea id="request-message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} rows={4} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEdit}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
