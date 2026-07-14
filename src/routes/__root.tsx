import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  HeadContent,
  Scripts,
  createRootRoute,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { ServiceState } from '@/components/content/ServiceState'

import Footer from '../components/Footer'
import Header from '../components/Header'
import appCss from '../styles.css?url'

/* Pocket Worlds opens bright by default; dark is an explicit choice (or stored auto). */
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'light';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.setAttribute('data-theme',resolved);if(mode==='auto'){root.setAttribute('data-theme-mode','auto')}root.style.colorScheme=resolved;}catch(e){}})();`

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
        title: 'FrameOS',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon/favicon-96x96.png' },
      { rel: 'shortcut icon', href: '/favicon/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorBoundary,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere selection:bg-[rgba(173,120,64,0.28)]">
        <Header />
        <div className="relative pb-20">{children}</div>
        <Footer />
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}

function RootErrorBoundary({ error }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : 'The route could not be rendered.'

  return (
    <RootDocument>
      <main className="page-shell px-4 pt-12">
        <ServiceState title="The archive needs a moment." body={message} />
      </main>
    </RootDocument>
  )
}
