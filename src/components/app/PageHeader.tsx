import type { ReactNode } from 'react'
import { DataSourceBadge } from './DataSourceBadge'

type PageHeaderProps = {
  title: string
  description: string
  eyebrow?: string
  action?: ReactNode
  showDataSource?: boolean
}

export function PageHeader({ title, description, eyebrow, action, showDataSource = true }: PageHeaderProps) {
  const cleanTitle = cleanText(title)
  const cleanDescription = cleanText(description)
  const cleanEyebrow = eyebrow ? cleanText(eyebrow) : undefined

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-primary/15 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {cleanEyebrow && <span className="text-xs font-black uppercase tracking-wide text-primary">{cleanEyebrow}</span>}
          {showDataSource && <DataSourceBadge />}
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">{cleanTitle}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{cleanDescription}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function cleanText(value: string) {
  return value
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã /g, 'à')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã‰/g, 'É')
    .replace(/â€™/g, "'")
}
