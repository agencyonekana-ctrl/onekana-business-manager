import { DatabaseZap } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

export function DataSourceBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-[11px] uppercase text-primary">
            <DatabaseZap className="h-3 w-3" />
            API REST
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Le back office lit et écrit uniquement via l'API Laravel configurée.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
