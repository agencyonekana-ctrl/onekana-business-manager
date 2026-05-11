import { ArrowRight, Building2, Calendar, FileText, Megaphone } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuth } from '../hooks/use-auth'

export default function Landing() {
  const { login } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <img src="/logo-1.png" alt="ONEKANA" className="h-11 w-auto" />
          <span className="font-black uppercase text-primary">Back Office</span>
        </div>
        <Button onClick={() => login()} className="rounded-full px-8">
          Se connecter
        </Button>
      </nav>

      <main className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center space-y-12 px-4 text-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-black uppercase tracking-tight text-foreground md:text-7xl">
            Le pilotage interne de <span className="text-primary">ONEKANA</span>.
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Une interface locale pour gérer les campagnes OOH, les réservations agences, les supports, les documents
            et l'équipe opérationnelle.
          </p>
        </div>

        <Button onClick={() => login()} size="lg" className="h-14 gap-2 rounded-full px-8 text-lg">
          Ouvrir le back office <ArrowRight className="h-5 w-5" />
        </Button>

        <div className="grid grid-cols-2 gap-4 pt-12 md:grid-cols-4">
          {[
            { icon: Megaphone, label: 'Campagnes' },
            { icon: Building2, label: 'Inventaire OOH' },
            { icon: FileText, label: 'Documents' },
            { icon: Calendar, label: 'Horaires' },
          ].map((feature) => (
            <div key={feature.label} className="flex flex-col items-center gap-3 rounded-lg border border-primary/15 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <span className="font-bold">{feature.label}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="flex h-20 items-center justify-center border-t border-border text-sm text-muted-foreground">
        © {new Date().getFullYear()} ONEKANA Back Office. Tous droits réservés.
      </footer>
    </div>
  )
}
