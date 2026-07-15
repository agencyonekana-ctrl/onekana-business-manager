export type OhadaAccount = {
  id: string
  code: string
  label?: string
  libelle?: string
  class?: string | number
  classe?: string | number
  type?: string
  isActive?: boolean
  actif?: boolean
}

export type AccountingJournal = {
  id: string
  code: string
  name?: string
  nom?: string
  type: string
}

export type AccountingPeriod = {
  id: string
  label: string
  startsOn: string
  endsOn: string
  status: 'open' | 'closed'
  closedAt?: string | null
}

export type FinanceSettings = {
  configured: boolean
  salesAccountId?: string | null
  receivableAccountId?: string | null
  taxAccountId?: string | null
  bankAccountId?: string | null
  walletAccountId?: string | null
  expenseAccountId?: string | null
}

export type AccountingEntryLine = {
  accountId?: string
  account_id?: string
  accountCode?: string
  account_code?: string
  label?: string
  debit: string | number
  credit: string | number
}

export type AccountingEntry = {
  id: string
  date: string
  journalId?: string
  journal_id?: string
  label?: string
  libelle?: string
  reference?: string
  lines?: AccountingEntryLine[]
  totalDebit?: string | number
  totalCredit?: string | number
  status?: string
}

export type TrialBalanceLine = {
  accountCode: string
  accountLabel: string
  debit: string | number
  credit: string | number
  balance: string | number
}

export type WalletAccount = {
  id: string
  name?: string
  nom?: string
  currency?: string
  devise?: string
  balance?: string | number
  solde?: string | number
  status?: string
}

export type WalletTransaction = {
  id: string
  type: 'inflow' | 'outflow' | 'encaissement' | 'decaissement' | string
  amount?: string | number
  montant?: string | number
  source?: string
  reference?: string
  status?: string
  date?: string
  createdAt?: string
}

export type Invoice = {
  id: string
  number?: string
  numero?: string
  clientName?: string
  client_name?: string
  campaignId?: string
  campaign_id?: string
  amount?: string | number
  montant?: string | number
  tax?: string | number
  taxe?: string | number
  total?: string | number
  balance?: string | number
  subtotal?: string | number
  status?: string
  dueDate?: string
  due_date?: string
}

export type Payment = {
  id: string
  invoiceId?: string
  invoice_id?: string
  method?: string
  moyen?: string
  amount?: string | number
  montant?: string | number
  date?: string
  reference?: string
}
