import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { MailPlus, RefreshCw, ShieldCheck, UserRoundCheck, UserRoundX } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ApiError } from '../services/api-client'
import { remoteApi } from '../services/remote-api'
import type { AdminRole, AuthUser } from '../types/auth'

export default function AdminUsers() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setUnavailable(false)
    const [usersResult, rolesResult] = await Promise.allSettled([
      remoteApi.adminUsers.list<AuthUser>(),
      remoteApi.adminRoles.list<AdminRole>(),
    ])
    if (usersResult.status === 'fulfilled') setUsers(usersResult.value)
    if (rolesResult.status === 'fulfilled') setRoles(rolesResult.value)
    setUnavailable(usersResult.status === 'rejected' || rolesResult.status === 'rejected')
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function updateUser(user: AuthUser, values: { roleId?: string, isActive?: boolean }) {
    try {
      const updated = await remoteApi.adminUsers.update<AuthUser>(user.id, values)
      setUsers((current) => current.map((item) => item.id === user.id ? updated : item))
      toast.success('Compte mis à jour')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Modification impossible')
    }
  }

  async function resendInvitation(user: AuthUser) {
    try {
      await remoteApi.adminUsers.invite(user.id)
      toast.success(`Invitation envoyée à ${user.email}`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "L'invitation n'a pas pu être envoyée")
    }
  }

  const activeCount = useMemo(() => users.filter((user) => user.isActive !== false).length, [users])

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        eyebrow="Paramètres"
        title="Utilisateurs & accès"
        description="Invitez les responsables autorisés et contrôlez l'accès à l'espace ONEKANA."
        action={<InviteDialog roles={roles} open={dialogOpen} setOpen={setDialogOpen} onCreated={(user) => setUsers((current) => [user, ...current])} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Utilisateurs" value={users.length} icon={ShieldCheck} />
        <Summary label="Comptes actifs" value={activeCount} icon={UserRoundCheck} />
        <Summary label="Comptes suspendus" value={users.length - activeCount} icon={UserRoundX} />
      </div>

      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="font-black">Comptes autorisés</h3>
            <p className="mt-1 text-sm text-muted-foreground">Les changements de rôle prennent effet à la prochaine ouverture de session.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Actualiser"><RefreshCw className="h-4 w-4" /></Button>
        </div>

        {loading ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-md bg-muted" />)}</div> : null}
        {!loading && users.length === 0 ? <EmptyState title={unavailable ? 'Données temporairement indisponibles' : 'Aucun utilisateur'} description={unavailable ? 'Réessayez dans quelques instants.' : 'Invitez un responsable pour lui donner accès à cet espace.'} /> : null}
        {!loading && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-muted/45 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Utilisateur</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">État</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-5 py-4"><div className="font-bold">{user.displayName}</div><div className="mt-0.5 text-muted-foreground">{user.email}</div></td>
                    <td className="px-4 py-4">
                      <Select value={roleIdFor(user, roles)} onValueChange={(roleId) => void updateUser(user, { roleId })}>
                        <SelectTrigger className="w-52"><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                        <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4"><Badge variant={user.isActive === false ? 'outline' : 'default'}>{user.isActive === false ? 'Suspendu' : 'Actif'}</Badge></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={() => void resendInvitation(user)}><MailPlus className="h-4 w-4" /> Renvoyer l'invitation</Button><Button variant="ghost" size="sm" onClick={() => void updateUser(user, { isActive: user.isActive === false })}>{user.isActive === false ? 'Réactiver' : 'Suspendre'}</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function InviteDialog({ roles, open, setOpen, onCreated }: { roles: AdminRole[], open: boolean, setOpen: (value: boolean) => void, onCreated: (user: AuthUser) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const user = await remoteApi.adminUsers.create<AuthUser>({ name, email, roleId })
      onCreated(user)
      setName(''); setEmail(''); setRoleId(''); setOpen(false)
      toast.success('Invitation envoyée')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "L'invitation n'a pas pu être envoyée")
    } finally { setSubmitting(false) }
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gap-2"><MailPlus className="h-4 w-4" /> Inviter un utilisateur</Button></DialogTrigger><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>Inviter un utilisateur</DialogTitle><DialogDescription>La personne recevra un lien valable 30 minutes pour définir son mot de passe.</DialogDescription></DialogHeader><div className="grid gap-4 py-5"><label className="space-y-2 text-sm font-bold">Nom complet<Input required value={name} onChange={(event) => setName(event.target.value)} /></label><label className="space-y-2 text-sm font-bold">Adresse e-mail<Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><div className="space-y-2"><label className="text-sm font-bold">Rôle</label><Select value={roleId} onValueChange={setRoleId} required><SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger><SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent></Select></div></div><DialogFooter><Button type="submit" disabled={submitting || !roleId}>{submitting ? 'Envoi...' : "Envoyer l'invitation"}</Button></DialogFooter></form></DialogContent></Dialog>
}

function Summary({ label, value, icon: Icon }: { label: string, value: number, icon: typeof ShieldCheck }) {
  return <div className="flex items-center gap-4 rounded-lg border bg-white p-4"><div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/[0.08] text-primary"><Icon className="h-5 w-5" /></div><div><div className="text-2xl font-black">{value}</div><div className="text-xs font-bold uppercase text-muted-foreground">{label}</div></div></div>
}

function roleIdFor(user: AuthUser, roles: AdminRole[]) {
  return roles.find((role) => user.roles.includes(role.key))?.id ?? ''
}
