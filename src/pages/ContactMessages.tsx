import { useEffect, useState } from 'react'
import { CheckCircle2, Mail, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'

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
                description="Les nouveaux messages du site public apparaîtront ici dès qu’ils seront disponibles via l’API ou les données locales."
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
    </div>
  )
}
