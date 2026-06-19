export function joinUrl(base: string, path: string) {
  return new URL(path, base).toString()
}

export function buildCanonicalUrl(baseUrl: string, pathname: string, query?: string) {
  const url = new URL(pathname, baseUrl)

  if (query) {
    url.search = query
  }

  return url.toString()
}
