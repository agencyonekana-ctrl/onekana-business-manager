import { Image as ImageIcon } from 'lucide-react'
import type { EntityMedia } from '../../types/media'

type EntityThumbnailProps = {
  media?: EntityMedia
  alt: string
}

export function EntityThumbnail({ media, alt }: EntityThumbnailProps) {
  return (
    <span className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground">
      {media ? <img src={media.publicUrl} alt={media.altText || alt} className="h-full w-full object-cover" loading="lazy" /> : <ImageIcon className="h-4 w-4" aria-hidden="true" />}
    </span>
  )
}
