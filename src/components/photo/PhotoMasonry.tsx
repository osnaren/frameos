import { PhotoCard } from '@/components/photo/PhotoCard'
import type { PhotoCardView } from '@/types/photo'

export function PhotoMasonry({ items }: { items: PhotoCardView[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <PhotoCard key={item.photo.publicId} item={item} priority={index < 2} />
      ))}
    </div>
  )
}
