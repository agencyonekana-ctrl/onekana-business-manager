import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileSpreadsheet, Landmark, Scale } from 'lucide-react'
import { dataClient } from '../lib/data-client'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

export default function Accounting() {
  const [stats, setStats] = useState({ accounts: 0, journals: 0, entries: 0, balanceLines: 0 })
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [accounts, journals, entries, balance] = await Promise.all([
          dataClient.db.accountingAccounts.list(),
          dataClient.db.accountingJournals.list(),
          dataClient.db.accountingEntries.list(),
          dataClient.db.trialBalance.list(),
        ])
        setStats({
          accounts: accounts.length,
          journals: journals.length,
          entries: entries.length,
          balanceLines: balance.length,
        })
        setError(false)
      } catch {
        setError(true)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    { title: 'Plan comptable', value: stats.accounts, icon: BookOpen, to: '/accounting/chart-of-accounts' },
    { title: 'Journaux', value: stats.journals, icon: FileSpreadsheet, to: '/accounting/journals' },
    { title: 'Ecritures', value: stats.entries, icon: Landmark, to: '/accounting/entries' },
    { title: 'Balance', value: stats.balanceLines, icon: Scale, to: '/accounting' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Comptabilité OHADA"
        description="Suivez le socle SYSCOHADA: plan comptable, journaux, ecritures equilibrees et balance comptable."
      />

      {error && (
        <EmptyState
          title="Donnees comptables indisponibles"
          description="Les donnees seront affichees des qu elles seront disponibles."
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.title} className="border-primary/15 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold">{item.title}</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{item.value}</div>
              <Button asChild variant="link" className="mt-2 h-auto p-0">
                <Link to={item.to}>Ouvrir</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
