function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createPhotoSlug(publicId: string) {
  const tail = publicId.split('/').at(-1) ?? publicId
  const label = slugify(tail) || 'photo'
  return `${label}--${toBase64Url(publicId)}`
}

export function decodePhotoSlug(slug: string) {
  if (!slug.includes('--')) {
    return null
  }

  const encoded = slug.split('--').at(-1)

  if (!encoded) {
    return null
  }

  try {
    return fromBase64Url(encoded)
  } catch {
    return null
  }
}
