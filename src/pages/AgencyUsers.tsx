import { useEffect, useMemo, useState } from 'react'
import { Mail, Search } from 'lucide-react'
import { agencyApi, type AgencyUser } from '../services/agency-api'
import { EmptyState } from '../components/app/EmptyState'
import { PageHeader } from '../components/app/PageHeader'
import { StatusBadge } from '../components/app/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

export default function AgencyUsers() {
  const [users, setUsers] = useState<AgencyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [agencyUnavailable, setAgencyUnavailable] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true

    async function loadUsers() {
      setLoading(true)
      try {
        const rows = await agencyApi.users.list()
        if (!active) return
        setUsers(rows)
        setAgencyUnavailable(false)
      } catch {
        if (!active) return
        setUsers([])
        setAgencyUnavailable(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUsers()
    return () => { active = false }
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr')
    if (!query) return users

    return users.filter((user) => [user.name, user.email, user.company, user.role]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase('fr').includes(query)))
  }, [search, users])

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Activite recue" title="Utilisateurs Agency" description="Consultez les comptes exposes par le service Agency depuis une connexion admin securisee." />

      <Card className="border-border bg-white">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-black uppercase">Repertoire Agency</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Les donnees restent accessibles uniquement via le proxy ONEKANA authentifie.</p>
          </div>
          <StatusBadge tone={agencyUnavailable ? 'red' : 'dark'}>{agencyUnavailable ? 'Indisponible' : `${users.length} comptes`}</StatusBadge>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="px-6 pt-1">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un utilisateur, une entreprise ou un role..." className="pl-9" />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Chargement des utilisateurs...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={agencyUnavailable ? 'Connexion Agency indisponible' : 'Aucun utilisateur a afficher'}
                description={agencyUnavailable
                  ? 'Les utilisateurs apparaitront ici apres validation de la connexion Agency.'
                  : 'Aucun compte ne correspond aux filtres actuels.'}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Etat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id || user.email}>
                    <TableCell>
                      <div className="font-semibold">{user.name}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />{user.email || 'Email non renseigne'}</div>
                    </TableCell>
                    <TableCell>{user.company || 'Non renseignee'}</TableCell>
                    <TableCell>{user.role || 'Non renseigne'}</TableCell>
                    <TableCell><StatusBadge tone={user.active === false ? 'red' : 'dark'}>{user.active === false ? 'Inactif' : 'Actif'}</StatusBadge></TableCell>
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
