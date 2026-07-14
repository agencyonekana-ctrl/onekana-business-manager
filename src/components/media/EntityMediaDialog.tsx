import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Save, Star, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { mediaApi } from '../../services/media-api'
import type { EntityMedia, MediaEntityType } from '../../types/media'
import { EmptyState } from '../app/EmptyState'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'

type EntityMediaDialogProps = {
  entityType: MediaEntityType
  entityId: string
  entityLabel: string
  onChanged?: () => void
}

export function EntityMediaDialog({ entityType, entityId, entityLabel, onChanged }: EntityMediaDialogProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<EntityMedia[]>([])
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await mediaApi.list(entityType, entityId)
      setItems(rows)
      setAltDrafts(Object.fromEntries(rows.map((item) => [item.id, item.altText || ''])))
    } catch {
      toast.error('Impossible de charger les images')
    } finally {
      setLoading(false)
    }
  }, [entityId, entityType])

  useEffect(() => {
    if (open) load()
  }, [load, open])

  async function upload(file?: File) {
    if (!file) return
    if (items.length >= 8) {
      toast.error('Cette galerie contient déjà huit images')
      return
    }

    setUploading(true)
    try {
      await mediaApi.upload(entityType, entityId, file, `${entityLabel} - ${file.name}`, items.length === 0)
      toast.success('Image ajoutée')
      await load()
      onChanged?.()
    } catch {
      toast.error('Cette image n’a pas pu être enregistrée')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function setCover(item: EntityMedia) {
    try {
      await mediaApi.update(item.id, { isCover: true })
      await load()
      onChanged?.()
      toast.success('Image de couverture mise à jour')
    } catch {
      toast.error('Impossible de modifier la couverture')
    }
  }

  async function saveAlt(item: EntityMedia) {
    try {
      await mediaApi.update(item.id, { altText: altDrafts[item.id] || '' })
      await load()
      toast.success('Description mise à jour')
    } catch {
      toast.error('Impossible de modifier cette description')
    }
  }

  async function move(item: EntityMedia, direction: -1 | 1) {
    const index = items.findIndex((current) => current.id === item.id)
    const target = items[index + direction]
    if (!target) return

    try {
      await Promise.all([
        mediaApi.update(item.id, { sortOrder: target.sortOrder || index + direction }),
        mediaApi.update(target.id, { sortOrder: item.sortOrder || index }),
      ])
      await load()
      onChanged?.()
    } catch {
      toast.error('Impossible de réordonner les images')
    }
  }

  async function remove(item: EntityMedia) {
    if (!window.confirm('Supprimer définitivement cette image ?')) return
    try {
      await mediaApi.remove(item.id)
      await load()
      onChanged?.()
      toast.success('Image supprimée')
    } catch {
      toast.error('Impossible de supprimer cette image')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title={`Gérer les images de ${entityLabel}`}>
          <ImagePlus className="h-4 w-4" />
          <span className="sr-only">Gérer les images</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Images de {entityLabel}</DialogTitle></DialogHeader>

        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">{items.length}/8 images</p>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WebP, 8 Mo maximum par image.</p>
          </div>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
          <Button type="button" onClick={() => fileInput.current?.click()} disabled={uploading || items.length >= 8} className="gap-2">
            <Upload className="h-4 w-4" />{uploading ? 'Envoi...' : 'Ajouter une image'}
          </Button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Chargement des images...</div>
        ) : items.length === 0 ? (
          <EmptyState title="Aucune image" description="Ajoutez une première photo pour identifier rapidement cette ressource." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, index) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="relative aspect-video bg-muted">
                  <img src={item.publicUrl} alt={item.altText || entityLabel} className="h-full w-full object-cover" />
                  {item.isCover && <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-black uppercase text-white">Couverture</span>}
                </div>
                <div className="space-y-3 p-3">
                  <div className="flex gap-2">
                    <Input value={altDrafts[item.id] || ''} onChange={(event) => setAltDrafts((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={255} aria-label="Description de l’image" />
                    <Button type="button" variant="outline" size="icon" onClick={() => saveAlt(item)} title="Enregistrer la description"><Save className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => move(item, -1)} disabled={index === 0} title="Déplacer vers la gauche"><ArrowLeft className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => move(item, 1)} disabled={index === items.length - 1} title="Déplacer vers la droite"><ArrowRight className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setCover(item)} disabled={item.isCover} title="Choisir comme couverture"><Star className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="ml-auto text-destructive" onClick={() => remove(item)} title="Supprimer l’image"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
