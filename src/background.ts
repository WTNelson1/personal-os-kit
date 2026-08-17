// Floating-matrix ambient background — a node-and-line mesh painted on a fixed
// canvas behind all content. Decoration only: pointer-events none, never
// load-bearing, and it renders a single static frame under
// prefers-reduced-motion.
//
// Framework-free on purpose. `startMatrix` drives a canvas you own (React,
// Svelte, whatever); `initBackground` makes one and puts it behind the page.
// Both return a dispose function that cancels the loop and unbinds listeners.

export interface MatrixOptions {
  /** Accent as [r, g, b], 0–255. Usually your --accent, spelled out. */
  accent: [number, number, number]
  /**
   * How many nodes. A function receives the viewport size, so a phone can get
   * a sparser, cheaper field than a desktop window — links are O(n²).
   */
  count: number | ((width: number, height: number) => number)
  /** Nodes closer than this get a connecting line, in px. */
  linkDist: number
  /** Drift speed, px per frame. */
  speed: number
  /** Line alpha at the top of the page. */
  baseAlpha: number
  /** Extra line alpha added by the time you reach the bottom. */
  scrollAlpha: number
  /** Node alpha at the top of the page. */
  nodeAlpha: number
  /** Extra node alpha added by the time you reach the bottom. */
  nodeAlphaScroll: number
  /** How much the field lags the page as you scroll, 0–1. */
  parallax: number
}

const DEFAULTS: MatrixOptions = {
  accent: [122, 214, 192],
  count: 48,
  linkDist: 180,
  speed: 0.18,
  baseAlpha: 0.1,
  scrollAlpha: 0.16,
  nodeAlpha: 0.35,
  nodeAlphaScroll: 0.35,
  parallax: 0.12,
}

interface FieldNode {
  x: number
  y: number
  vx: number
  vy: number
  depth: number
}

/** Paint the field into a canvas you already have. Returns a dispose function. */
export function startMatrix(
  canvas: HTMLCanvasElement,
  opts: Partial<MatrixOptions> = {},
): () => void {
  const o: MatrixOptions = { ...DEFAULTS, ...opts }
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const [r, g, b] = o.accent
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches

  let w = 0
  let h = 0
  let dpr = 1
  let raf = 0
  let nodes: FieldNode[] = []
  let scroll = 0
  let target = 0

  // Deterministic pseudo-random so the field is stable across reloads.
  const rand = (s: number) => (Math.sin(s * 12.9898) * 43758.5453) % 1

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.width = window.innerWidth * dpr
    h = canvas.height = window.innerHeight * dpr
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
  }

  function seed() {
    const count =
      typeof o.count === 'function' ? o.count(window.innerWidth, window.innerHeight) : o.count
    nodes = []
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.abs(rand(i + 1)) * window.innerWidth,
        y: Math.abs(rand(i + 7.3)) * window.innerHeight,
        vx: (rand(i + 2.1) - 0.5) * o.speed,
        vy: (rand(i + 5.7) - 0.5) * o.speed,
        depth: 0.4 + Math.abs(rand(i + 9.4)) * 0.9,
      })
    }
  }

  function frame() {
    if (!ctx) return
    if (!still) scroll += (target - scroll) * 0.08
    const docH = Math.max(1, document.body.scrollHeight - window.innerHeight)
    const prog = Math.min(1, Math.max(0, scroll / docH))

    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.scale(dpr, dpr)
    const linkA = o.baseAlpha + prog * o.scrollAlpha

    if (!still) {
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < -20) n.x = window.innerWidth + 20
        if (n.x > window.innerWidth + 20) n.x = -20
        if (n.y < -20) n.y = window.innerHeight + 20
        if (n.y > window.innerHeight + 20) n.y = -20
      }
    }
    const pts = nodes.map((n) => ({
      x: n.x,
      y: n.y - ((scroll * o.parallax * n.depth) % (window.innerHeight + 40)),
      depth: n.depth,
    }))

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
        if (d < o.linkDist) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / o.linkDist) * linkA})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pts[i].x, pts[i].y)
          ctx.lineTo(pts[j].x, pts[j].y)
          ctx.stroke()
        }
      }
    }
    for (const n of pts) {
      ctx.fillStyle = `rgba(${r},${g},${b},${o.nodeAlpha + prog * o.nodeAlphaScroll})`
      ctx.beginPath()
      ctx.arc(n.x, n.y, 1.6 * n.depth + 0.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    if (!still) raf = requestAnimationFrame(frame)
  }

  const onResize = () => {
    resize()
    seed()
    if (still) frame() // re-render the single static frame at the new size
  }
  const onScroll = () => {
    target = window.scrollY
  }

  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onScroll, { passive: true })
  resize()
  seed()
  if (still) frame()
  else raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('scroll', onScroll)
  }
}

/**
 * Make a `canvas.grid-bg`, put it behind the page, and start the field.
 * For apps that don't want to own the element. Needs `ambient.css` for the
 * canvas positioning.
 */
export function initBackground(opts: Partial<MatrixOptions> = {}): () => void {
  const canvas = document.createElement('canvas')
  canvas.className = 'grid-bg'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.prepend(canvas)
  const stop = startMatrix(canvas, opts)
  return () => {
    stop()
    canvas.remove()
  }
}
