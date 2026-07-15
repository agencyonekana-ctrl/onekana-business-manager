import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarRange, FileSpreadsheet, Landmark, Save, Scale } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { dataClient } from '../lib/data-client'
import { remoteApi } from '../services/remote-api'
import type { AccountingPeriod, FinanceSettings, OhadaAccount } from '../types/finance'
import { PageHeader } from '../components/app/PageHeader'
import { EmptyState } from '../components/app/EmptyState'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const emptySettings: FinanceSettings = { configured: false }

export default function Accounting() {
  const [stats, setStats] = useState({ accounts: 0, journals: 0, entries: 0, balanceLines: 0 })
  const [accounts, setAccounts] = useState<OhadaAccount[]>([])
  const [periods, setPeriods] = useState<AccountingPeriod[]>([])
  const [settings, setSettings] = useState<FinanceSettings>(emptySettings)
  const [periodForm, setPeriodForm] = useState({ label: '', startsOn: '', endsOn: '' })
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    const results = await Promise.allSettled([
      dataClient.db.accountingAccounts.list<OhadaAccount>({ orderBy: { code: 'asc' } }),
      dataClient.db.accountingJournals.list(),
      dataClient.db.accountingEntries.list(),
      dataClient.db.trialBalance.list(),
      dataClient.db.accountingPeriods.list<AccountingPeriod>(),
      remoteApi.accountingSettings.get() as Promise<FinanceSettings>,
    ])
    const [accountRows, journals, entries, balance, periodRows, configuration] = results
    if (accountRows.status === 'fulfilled') setAccounts(accountRows.value)
    if (periodRows.status === 'fulfilled') setPeriods(periodRows.value)
    if (configuration.status === 'fulfilled') setSettings(configuration.value)
    setStats({
      accounts: accountRows.status === 'fulfilled' ? accountRows.value.length : 0,
      journals: journals.status === 'fulfilled' ? journals.value.length : 0,
      entries: entries.status === 'fulfilled' ? entries.value.length : 0,
      balanceLines: balance.status === 'fulfilled' ? balance.value.length : 0,
    })
    setError(results.some((result) => result.status === 'rejected'))
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    try {
      const saved = await remoteApi.accountingSettings.update('current', settings) as FinanceSettings
      setSettings(saved)
      toast.success('Configuration comptable enregistrée')
    } catch { toast.error('Configuration incomplète ou invalide') }
  }

  async function createPeriod(event: FormEvent) {
    event.preventDefault()
    try {
      await dataClient.db.accountingPeriods.create(periodForm)
      setPeriodForm({ label: '', startsOn: '', endsOn: '' })
      toast.success('Période créée')
      await fetchData()
    } catch { toast.error('Impossible de créer cette période') }
  }

  async function closePeriod(period: AccountingPeriod) {
    if (!confirm(`Clôturer ${period.label} ? Cette action bloque toute nouvelle écriture sur la période.`)) return
    try { await remoteApi.financeActions.closePeriod(period.id); toast.success('Période clôturée'); await fetchData() }
    catch { toast.error('La période ne peut pas être clôturée') }
  }

  const cards = [
    { title: 'Plan comptable', value: stats.accounts, icon: BookOpen, to: '/accounting/chart-of-accounts' },
    { title: 'Journaux', value: stats.journals, icon: FileSpreadsheet, to: '/accounting/journals' },
    { title: 'Écritures', value: stats.entries, icon: Landmark, to: '/accounting/entries' },
    { title: 'Balance', value: stats.balanceLines, icon: Scale, to: '/accounting/entries' },
  ]

  return <div className="space-y-7">
    <PageHeader eyebrow="Finance" title="Comptabilité OHADA" description="Structurez les comptes, journaux, périodes et écritures de contrôle de ONEKANA." />
    {error ? <EmptyState title="Certaines données sont indisponibles" description="Les autres éléments restent utilisables. Réessayez dans quelques instants." /> : null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((item) => <Card key={item.title}><CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle className="text-sm">{item.title}</CardTitle><item.icon className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-black">{item.value}</div><Button asChild variant="link" className="mt-1 h-auto p-0"><Link to={item.to}>Ouvrir</Link></Button></CardContent></Card>)}</div>

    <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <Card>
        <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Comptes de liaison</CardTitle><p className="mt-1 text-sm text-muted-foreground">Ils permettent de générer des écritures équilibrées lors des factures, paiements et mouvements Wallet.</p></div><Badge variant={settings.configured ? 'default' : 'outline'}>{settings.configured ? 'Prêt' : 'À configurer'}</Badge></div></CardHeader>
        <CardContent><form onSubmit={saveSettings} className="grid gap-4 sm:grid-cols-2">
          <AccountSelect label="Ventes" value={settings.salesAccountId} onChange={(value) => setSettings({ ...settings, salesAccountId: value })} accounts={accounts} />
          <AccountSelect label="Créances clients" value={settings.receivableAccountId} onChange={(value) => setSettings({ ...settings, receivableAccountId: value })} accounts={accounts} />
          <AccountSelect label="Taxes" value={settings.taxAccountId} onChange={(value) => setSettings({ ...settings, taxAccountId: value })} accounts={accounts} optional />
          <AccountSelect label="Banque" value={settings.bankAccountId} onChange={(value) => setSettings({ ...settings, bankAccountId: value })} accounts={accounts} />
          <AccountSelect label="Wallet" value={settings.walletAccountId} onChange={(value) => setSettings({ ...settings, walletAccountId: value })} accounts={accounts} />
          <AccountSelect label="Charges Wallet" value={settings.expenseAccountId} onChange={(value) => setSettings({ ...settings, expenseAccountId: value })} accounts={accounts} />
          <Button type="submit" className="gap-2 sm:col-span-2"><Save className="h-4 w-4" /> Enregistrer la configuration</Button>
        </form></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-primary" /> Périodes comptables</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={createPeriod} className="grid gap-3"><Label>Libellé<Input value={periodForm.label} onChange={(event) => setPeriodForm({ ...periodForm, label: event.target.value })} placeholder="Exercice 2026" required /></Label><div className="grid grid-cols-2 gap-3"><Label>Début<Input type="date" value={periodForm.startsOn} onChange={(event) => setPeriodForm({ ...periodForm, startsOn: event.target.value })} required /></Label><Label>Fin<Input type="date" value={periodForm.endsOn} onChange={(event) => setPeriodForm({ ...periodForm, endsOn: event.target.value })} required /></Label></div><Button type="submit" variant="outline">Créer la période</Button></form>
          <div className="space-y-2 border-t pt-4">{periods.length === 0 ? <p className="text-sm text-muted-foreground">Une période annuelle sera créée lors de la première écriture.</p> : periods.map((period) => <div key={period.id} className="flex items-center justify-between rounded-md border p-3"><div><div className="text-sm font-bold">{period.label}</div><div className="text-xs text-muted-foreground">{period.startsOn} au {period.endsOn}</div></div>{period.status === 'open' ? <Button size="sm" variant="outline" onClick={() => void closePeriod(period)}>Clôturer</Button> : <Badge variant="outline">Clôturée</Badge>}</div>)}</div>
        </CardContent>
      </Card>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">Le paramétrage et le plan comptable doivent être validés par un professionnel compétent avant toute utilisation réglementaire.</p>
  </div>
}

function AccountSelect({ label, value, onChange, accounts, optional = false }: { label: string, value?: string | null, onChange: (value: string) => void, accounts: OhadaAccount[], optional?: boolean }) {
  return <div className="space-y-2"><Label>{label}{optional ? ' (facultatif)' : ''}</Label><Select value={value || undefined} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.code} - {account.label || account.libelle}</SelectItem>)}</SelectContent></Select></div>
}
