import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

// The wordmark, opened. Every app in the suite shares this language and owns
// its palette, so the dot beside each name carries the identity — the palette
// is the wayfinding.
//
// Deliberately bare: plain <a href> rather than a router link, because these
// point at sibling apps on other origins. Drop it inside your <h1> and the
// header's pulsing accent dot still sits to its left.

export interface AppLink {
  /** Lowercase, as it appears in that app's wordmark. */
  name: string
  /** Absolute URL — these are sibling deploys, not routes. */
  url: string
  /** That app's --accent, as a literal colour. */
  color: string
}

export interface AppSwitcherProps {
  apps: AppLink[]
  /** Which entry is this app. Matched against `name`; it is listed, not linked. */
  current?: string
  /** Trigger text. Defaults to `current`, or the first app's name. */
  label?: string
  className?: string
}

export default function AppSwitcher({ apps, current, label, className }: AppSwitcherProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const menuId = useId()
  const text = label ?? current ?? apps[0]?.name ?? ''

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        root.current?.querySelector<HTMLButtonElement>('.app-switcher-trigger')?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Up/down walk the list; the popover is small enough that nothing more is
  // warranted.
  function onMenuKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...(root.current?.querySelectorAll<HTMLAnchorElement>('a.app-switcher-item') ?? [])]
    if (!items.length) return
    const i = items.indexOf(document.activeElement as HTMLAnchorElement)
    const next = e.key === 'ArrowDown' ? i + 1 : i - 1
    items[(next + items.length) % items.length].focus()
  }

  return (
    <span className={['app-switcher', className].filter(Boolean).join(' ')} ref={root}>
      <button
        type="button"
        className="app-switcher-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {text}
        <span className="app-switcher-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="app-switcher-menu" role="menu" id={menuId} onKeyDown={onMenuKey}>
          {apps.map((app) => {
            const here = app.name === current
            const dot = (
              <span className="app-switcher-dot" style={{ background: app.color }} aria-hidden="true" />
            )
            return here ? (
              <span key={app.name} className="app-switcher-item is-current" role="menuitem" aria-current="true">
                {dot}
                {app.name}
                <span className="app-switcher-here">here</span>
              </span>
            ) : (
              <a key={app.name} className="app-switcher-item" role="menuitem" href={app.url}>
                {dot}
                {app.name}
              </a>
            )
          })}
        </div>
      )}
    </span>
  )
}

export { AppSwitcher }
