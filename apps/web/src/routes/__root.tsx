import frauncesRomanLatin from '@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2?url'
import plexSansLatin from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2?url'
import {
  HeadContent,
  Scripts,
  createRootRoute,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'

import { NotFound } from '@/components/content/NotFound'
import { ServiceState } from '@/components/content/ServiceState'
import { NavigationProgress } from '@/components/layout/NavigationProgress'
import { ViewfinderCursor } from '@/components/layout/ViewfinderCursor'
import { SITE_NAME, THEME_COLORS } from '@/lib/seo'

import Footer from '../components/Footer'
import Header from '../components/Header'
import appCss from '../styles.css?url'

/** Above-the-fold faces (headings + body/nav); the same hashed files styles/fonts.css references. */
const PRELOADED_FONTS = [frauncesRomanLatin, plexSansLatin]

/*
 * Pocket Worlds opens bright by default; dark is an explicit choice (or stored auto).
 *
 * Browser chrome: the server renders theme-color metas per OS scheme (right without
 * JS). Once the stored theme is resolved, this script inserts one more meta ahead of
 * them — the first matching theme-color wins — and keeps it on the site's data-theme
 * through later toggles. React's own metas are never mutated, so hydration still
 * matches them.
 */
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'light';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.setAttribute('data-theme',resolved);if(mode==='auto'){root.setAttribute('data-theme-mode','auto')}root.style.colorScheme=resolved;var colors={light:'${THEME_COLORS.light}',dark:'${THEME_COLORS.dark}'};var active=document.createElement('meta');active.name='theme-color';document.head.insertBefore(active,document.querySelector('meta[name="theme-color"]'));var sync=function(){var color=colors[root.getAttribute('data-theme')];if(color){active.content=color}};sync();new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-theme']});}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: SITE_NAME,
      },
      { name: 'application-name', content: SITE_NAME },
      { name: 'apple-mobile-web-app-title', content: SITE_NAME },
    ],
    links: [
      ...PRELOADED_FONTS.map((href) => ({
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href,
        crossOrigin: 'anonymous' as const,
      })),
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon/favicon-96x96.png' },
      { rel: 'shortcut icon', href: '/favicon/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
      { rel: 'manifest', href: '/favicon/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorBoundary,
  notFoundComponent: RootNotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Rendered here, not via head(): TanStack dedupes metas by name, which would drop one. */}
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content={THEME_COLORS.light}
        />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_COLORS.dark} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere selection:bg-[rgba(173,120,64,0.28)]">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <NavigationProgress />
        <Header />
        {/* Focusable so the skip link and route changes can move focus here. */}
        <div id="main-content" tabIndex={-1} className="relative pb-20 outline-none">
          {children}
        </div>
        <Footer />
        <ViewfinderCursor />
        <Scripts />
      </body>
    </html>
  )
}

function RootErrorBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  // Rendered inside RootDocument's own outlet by the router — do not
  // re-wrap with <RootDocument>, which would nest a second <html>/<body>.
  return (
    <main className="page-shell px-4 pt-12">
      <ServiceState
        title="The archive needs a moment."
        body="This page didn’t develop properly — usually the photo service is briefly out of reach. Nothing is lost: try again, or keep browsing the Index."
        onRetry={() => {
          // Re-run the loaders, then let the boundary render the route again.
          void router.invalidate().finally(reset)
        }}
        debug={import.meta.env.DEV && error instanceof Error ? error.message : undefined}
      />
    </main>
  )
}

function RootNotFound() {
  return (
    <main className="page-shell px-4 pt-12">
      <NotFound />
    </main>
  )
}
