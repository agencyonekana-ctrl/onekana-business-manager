import { useState } from 'react'
import { HelpCircle, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getTourState, setTourState, type TourState } from '../lib/session-storage'
import { useAuth } from '../hooks/use-auth'
import { resetOnboardingGuide } from '../components/app/OnboardingGuide'
import { PageHeader } from '../components/app/PageHeader'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ApprovalSettingsPanel } from '../components/approvals/ApprovalSettingsPanel'
import { featureFlags } from '../config/features'
import { can } from '../lib/access-control'

const guideLabels: Record<TourState, string> = {
  not_asked: 'Demande a afficher',
  accepted: 'Guide en cours',
  later: 'Mis de cote',
  disabled: 'Desactive',
  done: 'Termine',
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [tourState, setLocalTourState] = useState<TourState>(() => getTourState())
  const canManageValidations = featureFlags.approvalCenter && can(user, 'approvals.manage')

  function updateTourState(state: TourState) {
    setTourState(state)
    setLocalTourState(state)
  }

  function restartGuide() {
    resetOnboardingGuide()
    setLocalTourState('accepted')
    toast.success('Guide de prise en main relance')
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        eyebrow="Administration"
        title="Parametres"
        description="Reglez votre espace personnel, vos preferences et la securite de votre compte."
      />

      <Tabs defaultValue="space" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="space" className="border border-border bg-white data-[state=active]:border-primary/30 data-[state=active]:text-primary">Mon espace</TabsTrigger>
          <TabsTrigger value="preferences" className="border border-border bg-white data-[state=active]:border-primary/30 data-[state=active]:text-primary">Preferences</TabsTrigger>
          <TabsTrigger value="account" className="border border-border bg-white data-[state=active]:border-primary/30 data-[state=active]:text-primary">Securite du compte</TabsTrigger>
          {canManageValidations ? <TabsTrigger value="validations" className="border border-border bg-white data-[state=active]:border-primary/30 data-[state=active]:text-primary">Validations</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="space" className="mt-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <Card>
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <CardTitle>Profil utilisateur</CardTitle>
                <CardDescription>Informations de base de votre espace de travail.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <ProfileField label="Nom" value={user?.displayName || 'Utilisateur'} />
                <ProfileField label="Email" value={user?.email || 'Non renseigne'} />
                <ProfileField label="Organisation" value={user?.tenant?.name || 'ONEKANA'} />
                <ProfileField label="Profil" value={friendlyRole(user?.roles?.[0])} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Etat de l espace</CardTitle>
                <CardDescription>Votre espace est pret pour le travail quotidien.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className="rounded-full">Espace actif</Badge>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez utiliser les modules autorises pour votre profil.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" /> Guide utilisateur</CardTitle>
              <CardDescription>Choisissez quand afficher la visite de prise en main.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Etat actuel: {guideLabels[tourState]}</Badge>
                <Button onClick={restartGuide}>Relancer le guide</Button>
                <Button variant="outline" onClick={() => updateTourState('not_asked')}>Me le proposer plus tard</Button>
                <Button variant="ghost" onClick={() => updateTourState('disabled')}>Ne plus afficher</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Le guide ne se lance pas sans votre accord et peut etre relance a tout moment depuis cette page.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Securite du compte</CardTitle>
                <CardDescription>Quelques reflexes simples pour proteger votre espace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Ne partagez jamais vos identifiants.</p>
                <p>Fermez votre session lorsque vous utilisez un ordinateur partage.</p>
                <p>Signalez rapidement tout acces inhabituel a l administrateur.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session</CardTitle>
                <CardDescription>Quittez proprement le back office lorsque vous avez termine.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="gap-2" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Deconnexion
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {canManageValidations ? <TabsContent value="validations" className="mt-6"><ApprovalSettingsPanel /></TabsContent> : null}
      </Tabs>
    </div>
  )
}

function friendlyRole(role?: string) {
  if (!role) return 'Collaborateur'
  if (role.includes('admin')) return 'Administrateur'
  if (role.includes('sales')) return 'Commercial'
  if (role.includes('finance')) return 'Finance'
  return role
}

function ProfileField({ label, value }: { label: string, value: string }) {
  return (
    <div className="rounded-xl border bg-muted/25 p-4">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-bold">{value}</div>
    </div>
  )
}
