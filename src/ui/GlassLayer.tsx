import { useEffect, useRef } from 'react'
import { paintDynamicSky } from '../scene/skyPaint'

const VS = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FS = `
precision mediump float;

uniform vec3 iResolution;
uniform sampler2D iChannel0;
uniform vec4 uPane[4];
uniform float uRadius[4];
uniform int uCount;

const float NUM_ZERO = 0.0;
const float NUM_ONE = 1.0;
const float POWER_EXPONENT = 6.0;
const float LENS_STRENGTH = 0.18;
const float SAMPLE_RANGE = 3.0;
const float SAMPLE_OFFSET = 0.55;
const float GLASS_TINT = 0.07;

float sdRoundBox(vec2 p, vec2 b, float r) {
  float rad = min(r, min(b.x, b.y));
  vec2 q = abs(p) - b + vec2(rad);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - rad;
}

vec4 sampleBg(vec2 uv) {
  return texture2D(iChannel0, clamp(uv, 0.0, 1.0));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / iResolution.xy;
  vec4 fragColor = vec4(NUM_ZERO);
  float best = NUM_ZERO;

  for (int i = 0; i < 4; i++) {
    if (i < uCount) {
      vec2 center = uPane[i].xy;
      vec2 halfSize = uPane[i].zw;
      vec2 p = fragCoord - center;
      float sd = sdRoundBox(p, halfSize, uRadius[i]);

      if (sd < 3.0) {
        vec2 q = p / max(halfSize, vec2(NUM_ONE));
        float roundedBox = pow(abs(q.x), POWER_EXPONENT) + pow(abs(q.y), POWER_EXPONENT);
        float inset = max(min(halfSize.x, halfSize.y), NUM_ONE);
        float nd = clamp(-sd / inset, NUM_ZERO, NUM_ONE);

        float rb1 = 1.0 - smoothstep(-1.2, 0.9, sd);
        rb1 *= clamp((NUM_ONE - roundedBox * 0.55) * 4.0, 0.35, NUM_ONE);

        float transition = smoothstep(NUM_ZERO, NUM_ONE, rb1);

        if (transition > best) {
          best = transition;
          vec2 paneUv = center / iResolution.xy;

          vec2 lens = paneUv + (uv - paneUv) * (NUM_ONE - (NUM_ONE - nd) * LENS_STRENGTH * (0.45 + roundedBox));

          vec4 acc = vec4(NUM_ZERO);
          float total = NUM_ZERO;
          for (float x = -SAMPLE_RANGE; x <= SAMPLE_RANGE; x++) {
            for (float y = -SAMPLE_RANGE; y <= SAMPLE_RANGE; y++) {
              vec2 offset = vec2(x, y) * SAMPLE_OFFSET / iResolution.xy;
              acc += sampleBg(offset + lens);
              total += NUM_ONE;
            }
          }
          acc /= total;

          float fresnel = smoothstep(-3.2, -0.4, sd) * (1.0 - smoothstep(-0.6, 1.0, sd));
          float lit = clamp(0.62 * q.y - 0.18 * q.x + 0.28, NUM_ZERO, NUM_ONE);
          float spec = fresnel * pow(lit, 1.6) * 0.14;
          float wash = rb1 * smoothstep(-0.05, 1.0, q.y) * 0.035;
          float depth = fresnel * smoothstep(0.35, -0.9, q.y) * 0.05;

          vec4 lighting = acc;
          lighting.rgb = clamp(lighting.rgb + spec + wash - depth, NUM_ZERO, NUM_ONE);
          lighting.rgb = mix(lighting.rgb, lighting.rgb * vec3(0.97, 0.96, 0.95), GLASS_TINT);

          vec4 mixed = mix(sampleBg(uv), lighting, transition);
          mixed.a = transition;
          fragColor = mixed;
        }
      }
    }
  }

  if (best <= NUM_ZERO) {
    discard;
  }
  gl_FragColor = fragColor;
}
`

type Pane = {
  centerX: number
  centerY: number
  halfW: number
  halfH: number
  radius: number
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Liquid glass shader:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function paintBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const sky = document.querySelector('.sky-backdrop') as HTMLCanvasElement | null
  if (sky && sky.width > 1) {
    ctx.drawImage(sky, 0, 0, w, h)
  } else {
    paintDynamicSky(ctx, w, h)
  }

  const dune = document.querySelector('.dune-canvas canvas') as HTMLCanvasElement | null
  if (!dune) return
  const host = dune.parentElement
  const opacity = host ? Number.parseFloat(getComputedStyle(host).opacity || '1') : 1
  if (!(opacity > 0.04)) return
  try {
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.drawImage(dune, 0, 0, w, h)
    ctx.restore()
  } catch {
    // WebGL canvases may be origin-tainted; the sky still reads as glass.
  }
}

function readPanes(canvas: HTMLCanvasElement): Pane[] {
  const dpr = canvas.width / Math.max(canvas.clientWidth, 1)
  const nodes = document.querySelectorAll<HTMLElement>('.liquid-glass')
  const panes: Pane[] = []
  nodes.forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return
    if (getComputedStyle(el).visibility === 'hidden') return
    const radiusPx = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 24
    panes.push({
      centerX: (rect.left + rect.width / 2) * dpr,
      centerY: canvas.height - (rect.top + rect.height / 2) * dpr,
      halfW: (rect.width / 2) * dpr,
      halfH: (rect.height / 2) * dpr,
      radius: radiusPx * dpr,
    })
  })
  return panes.slice(0, 4)
}

class LiquidGlassEngine {
  private gl: WebGLRenderingContext | null
  private program: WebGLProgram | null = null
  private texture: WebGLTexture | null = null
  private backdrop: HTMLCanvasElement
  private uniforms: {
    resolution: WebGLUniformLocation | null
    texture: WebGLUniformLocation | null
    count: WebGLUniformLocation | null
    pane: WebGLUniformLocation | null
    radius: WebGLUniformLocation | null
  } | null = null
  private raf = 0
  private running = false
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    })
    this.backdrop = document.createElement('canvas')
  }

  start() {
    const gl = this.gl
    if (!gl) return false
    const vs = compile(gl, gl.VERTEX_SHADER, VS)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS)
    if (!vs || !fs) return false
    const program = gl.createProgram()
    if (!program) return false
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Liquid glass program:', gl.getProgramInfoLog(program))
      return false
    }
    this.program = program
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    this.texture = gl.createTexture()
    this.uniforms = {
      resolution: gl.getUniformLocation(program, 'iResolution'),
      texture: gl.getUniformLocation(program, 'iChannel0'),
      count: gl.getUniformLocation(program, 'uCount'),
      pane: gl.getUniformLocation(program, 'uPane[0]'),
      radius: gl.getUniformLocation(program, 'uRadius[0]'),
    }

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    document.documentElement.classList.add('has-liquid-glass')
    this.running = true
    this.resize()
    window.addEventListener('resize', this.resize)
    this.raf = requestAnimationFrame(this.frame)
    return true
  }

  destroy() {
    this.running = false
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    document.documentElement.classList.remove('has-liquid-glass')
    const gl = this.gl
    if (gl && this.program) gl.deleteProgram(this.program)
    this.program = null
  }

  private resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(window.innerWidth * dpr))
    const h = Math.max(1, Math.round(window.innerHeight * dpr))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
      this.backdrop.width = w
      this.backdrop.height = h
    }
  }

  private uploadBackdrop() {
    const gl = this.gl
    if (!gl || !this.texture) return
    const ctx = this.backdrop.getContext('2d')
    if (!ctx) return
    paintBackdrop(ctx, this.backdrop.width, this.backdrop.height)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.backdrop)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  private frame = () => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    const gl = this.gl
    const uniforms = this.uniforms
    if (!gl || !this.program || !uniforms) return

    this.resize()
    const panes = readPanes(this.canvas)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (!panes.length) return

    this.uploadBackdrop()

    gl.useProgram(this.program)
    gl.uniform3f(uniforms.resolution, this.canvas.width, this.canvas.height, 1)
    gl.uniform1i(uniforms.count, panes.length)

    const paneData = new Float32Array(16)
    const radiusData = new Float32Array(4)
    panes.forEach((pane, i) => {
      paneData[i * 4] = pane.centerX
      paneData[i * 4 + 1] = pane.centerY
      paneData[i * 4 + 2] = pane.halfW
      paneData[i * 4 + 3] = pane.halfH
      radiusData[i] = pane.radius
    })
    gl.uniform4fv(uniforms.pane, paneData)
    gl.uniform1fv(uniforms.radius, radiusData)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.uniform1i(uniforms.texture, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}

export function LiquidGlassLayer() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const engine = new LiquidGlassEngine(canvas)
    const ok = engine.start()
    if (!ok) engine.destroy()
    return () => engine.destroy()
  }, [])

  return <canvas ref={ref} className="liquid-glass-layer" aria-hidden />
}
