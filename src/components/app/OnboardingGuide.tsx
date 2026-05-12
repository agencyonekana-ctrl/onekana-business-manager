import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, HelpCircle, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'

const STORAGE_KEY = 'onekana:tour:v1'
const RESET_EVENT = 'onekana:tour-reset'

type TourStep = {
  id: string
  route: string
  target: string
  title: string
  description: string
}

const steps: TourStep[] = [
  {
    id: 'dashboard',
    route: '/',
    target: 'dashboard-kpis',
    title: 'Lire le tableau de bord',
    description: 'Commencez par les indicateurs commerciaux: demandes, campagnes, revenus et disponibilités.',
  },
  {
    id: 'lead',
    route: '/demandes',
    target: 'client-requests-table',
    title: 'Traiter une demande client',
    description: 'Les messages du site public arrivent ici. L’objectif est de qualifier le besoin avant de préparer une offre.',
  },
  {
    id: 'packs',
    route: '/packs',
    target: 'packs-table',
    title: 'Choisir un pack commercial',
    description: 'Les packs servent de base aux devis et accélèrent la préparation commerciale.',
  },
  {
    id: 'campaign',
    route: '/campaigns',
    target: 'campaigns-workspace',
    title: 'Créer une campagne',
    description: 'Créez la campagne client, puis ajoutez les lignes de réservation d’emplacements.',
  },
  {
    id: 'inventory',
    route: '/inventory',
    target: 'inventory-tabs',
    title: 'Vérifier les disponibilités',
    description: 'L’inventaire rassemble les sites, supports, emplacements et visuels disponibles.',
  },
  {
    id: 'documents',
    route: '/documents',
    target: 'documents-table',
    title: 'Centraliser les documents',
    description: 'Ajoutez devis, contrats et documents utiles au suivi interne.',
  },
]

function readStepIndex() {
  const value = Number(localStorage.getItem(STORAGE_KEY) || '0')
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), steps.length - 1) : 0
}

export function resetOnboardingGuide() {
  localStorage.setItem(STORAGE_KEY, '0')
  window.dispatchEvent(new Event(RESET_EVENT))
}

export function OnboardingGuide() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(() => readStepIndex())
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'done')
  const [targetFound, setTargetFound] = useState(false)

  const step = steps[stepIndex]
  const progress = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex])

  useEffect(() => {
    const handleReset = () => {
      setStepIndex(0)
      setDismissed(false)
      navigate(steps[0].route)
    }
    window.addEventListener(RESET_EVENT, handleReset)
    return () => window.removeEventListener(RESET_EVENT, handleReset)
  }, [navigate])

  useEffect(() => {
    if (!dismissed) localStorage.setItem(STORAGE_KEY, String(stepIndex))
  }, [dismissed, stepIndex])

  useEffect(() => {
    if (dismissed) return
    if (window.location.pathname !== step.route) {
      navigate(step.route)
      return
    }

    const findTarget = () => {
      const target = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
      setTargetFound(Boolean(target))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.classList.add('tour-target-ring')
      }
      return target
    }

    const target = findTarget()
    const timer = window.setTimeout(findTarget, 250)

    return () => {
      window.clearTimeout(timer)
      target?.classList.remove('tour-target-ring')
      document.querySelector(`[data-tour="${step.target}"]`)?.classList.remove('tour-target-ring')
    }
  }, [dismissed, navigate, step])

  if (dismissed) return null

  function completeStep() {
    if (stepIndex >= steps.length - 1) {
      localStorage.setItem(STORAGE_KEY, 'done')
      setDismissed(true)
      return
    }
    setStepIndex((current) => current + 1)
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(390px,calc(100vw-2rem))] rounded-lg border border-primary/20 bg-white p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase">Visite guidée ONEKANA</h3>
            <p className="mt-1 text-xs text-muted-foreground">Etape {stepIndex + 1} sur {steps.length}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDismissed(true)} aria-label="Masquer la visite">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
          <span>{step.title}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{step.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={`flex items-center gap-1 text-xs font-bold ${targetFound ? 'text-green-700' : 'text-amber-700'}`}>
          <CheckCircle2 className="h-4 w-4" />
          {targetFound ? 'Zone trouvée' : 'Recherche de la zone'}
        </span>
        <Button size="sm" onClick={completeStep} disabled={!targetFound} className="gap-2">
          {stepIndex >= steps.length - 1 ? 'Terminer' : 'Continuer'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  )
}
