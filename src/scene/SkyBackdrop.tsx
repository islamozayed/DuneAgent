import { useEffect, useRef } from 'react'
import { paintDynamicSky } from './skyPaint'

export function SkyBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let raf = 0
    let running = true

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(window.innerWidth * dpr))
      const h = Math.max(1, Math.round(window.innerHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const frame = (now: number) => {
      if (!running) return
      resize()
      paintDynamicSky(ctx, canvas.width, canvas.height, now / 1000)
      raf = requestAnimationFrame(frame)
    }

    window.addEventListener('resize', resize)
    resize()
    raf = requestAnimationFrame(frame)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="sky-backdrop" aria-hidden />
}
