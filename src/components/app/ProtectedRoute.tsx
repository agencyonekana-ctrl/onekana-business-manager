import type { ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/use-auth'
import { hasAccess, type AccessRequirement } from '../../lib/access-control'
import { Card, CardContent } from '../ui/card'

type ProtectedRouteProps = AccessRequirement & {
  children: ReactNode
}

export function ProtectedRoute({ children, ...requirement }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-sm font-semibold text-muted-foreground">
        Chargement de la session...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (hasAccess(user, requirement)) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <Card className="max-w-md border-primary/15 bg-white text-center">
        <CardContent className="p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black uppercase">Accès non autorisé</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vos droits ne permettent pas d’ouvrir cette page. Contactez un administrateur si vous pensez qu’il s’agit d’une erreur.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
