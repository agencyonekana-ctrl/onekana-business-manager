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

export type AccountingEntryLine = {
  accountId?: string
  account_id?: string
  accountCode?: string
  account_code?: string
  label?: string
  debit: number
  credit: number
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
  totalDebit?: number
  totalCredit?: number
  status?: string
}

export type TrialBalanceLine = {
  accountCode: string
  accountLabel: string
  debit: number
  credit: number
  balance: number
}

export type WalletAccount = {
  id: string
  name?: string
  nom?: string
  currency?: string
  devise?: string
  balance?: number
  solde?: number
  status?: string
}

export type WalletTransaction = {
  id: string
  type: 'inflow' | 'outflow' | 'encaissement' | 'decaissement' | string
  amount?: number
  montant?: number
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
  amount?: number
  montant?: number
  tax?: number
  taxe?: number
  total?: number
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
  amount?: number
  montant?: number
  date?: string
  reference?: string
}
