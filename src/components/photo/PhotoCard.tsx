import { Link } from '@tanstack/react-router'

import { CloudinaryImage } from '@/components/photo/CloudinaryImage'

import type { PhotoCardView } from '@/types/photo'

export function PhotoCard({ item, priority = false }: { item: PhotoCardView; priority?: boolean }) {
  return (
    <article className="group flex flex-col gap-4">
      <Link
        to="/photos/$slug"
        params={{ slug: item.photo.slug }}
        className="overflow-hidden rounded-[1.75rem] bg-(--panel-strong) no-underline"
      >
        <CloudinaryImage
          publicId={item.photo.publicId}
          alt={item.photo.alt}
          preset="card"
          priority={priority}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[0.7rem] font-semibold tracking-[0.22em] uppercase text-(--accent)">
            {item.photo.category ?? 'Portfolio'}
          </p>
          <h3 className="display-font mt-2 text-2xl text-(--ink)">{item.photo.title}</h3>
        </div>
        <div className="pt-2 text-right text-sm text-(--muted)">
          <p className="m-0">{item.photo.locationLabel ?? 'Selected work'}</p>
          <p className="m-0">{item.photo.captureDate?.slice(0, 10) ?? 'Undated'}</p>
        </div>
      </div>
    </article>
  )
}
