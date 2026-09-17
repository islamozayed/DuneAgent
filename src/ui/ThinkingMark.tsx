import { useEffect, useRef, useState } from 'react'
import { asset } from '../asset'

/** Figma mark box is ~183×215; thinking indicator is 70% of the first 48×56 size. */
const CSS_W = 34
const CSS_H = 39
const VIEW_W = 182.53
const VIEW_H = 214.51

const ARCH = { x: 0, y: 0, w: 182.53, h: 91.75 }
const DUNE = { x: 7.08, y: 72.95, w: 168.44, h: 141.55 }

type Stop = { p: number; r: number; g: number; b: number }

type MetalParams = {
  id: 'arch' | 'dune'
  stops: Stop[]
  blur: number
  phase: number
  evolution: number
  gradientOffset: number
  noiseScale: number
  chromaSepR: number
  heightIntensity: number
  noiseAngle: number
  stretch: number
  gradientRepeats: number
}

/** Chromatic metal — coral/peach dune (Figma 2:3). */
const DUNE_METAL: MetalParams = {
  id: 'dune',
  stops: [
    { p: 0.0769, r: 0.6619, g: 0.1941, b: 0.1323 },
    { p: 0.4183, r: 0.8896, g: 0.6268, b: 0.4635 },
    { p: 0.851, r: 0.9484, g: 0.8589, b: 0.6799 },
  ],
  blur: 7.5,
  phase: 0,
  evolution: 47,
  gradientOffset: 27,
  noiseScale: 81,
  chromaSepR: 10,
  heightIntensity: 100,
  noiseAngle: 30,
  stretch: 200,
  gradientRepeats: 2,
}

/** Chromatic metal — iridescent arch (Figma 2:4). */
const ARCH_METAL: MetalParams = {
  id: 'arch',
  stops: [
    { p: 0.1202, r: 0.8192, g: 0.6062, b: 0.7915 },
    { p: 0.3173, r: 0.7098, g: 0.9408, b: 0.9293 },
    { p: 0.7, r: 0.3387, g: 0.2616, b: 0.4929 },
    { p: 0.875, r: 0.8887, g: 0.7632, b: 0.6376 },
  ],
  blur: 7.5,
  phase: 43,
  evolution: 47,
  gradientOffset: 66,
  noiseScale: 200,
  chromaSepR: 68,
  heightIntensity: 63,
  noiseAngle: 30,
  stretch: 200,
  // Figma uses 2 at native layer size; at 34px that parks mid-tones on the
  // purple stop so the arch reads indigo. 1 keeps the ice-cyan Figma 2:4 blue.
  gradientRepeats: 1,
}

const VS = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FS = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying vec2 vUv;
uniform sampler2D uInput;
uniform sampler2D uBlur;
uniform vec4 uC0;
uniform vec4 uC1;
uniform vec4 uC2;
uniform vec4 uC3;
uniform vec4 uP;
uniform float uCount;
uniform float uHeightIntensity;
uniform float uChroma;
uniform float uNoiseScale;
uniform float uPhase;
uniform float uEvolution;
uniform float uNoiseAngle;
uniform float uStretch;
uniform float uGradientOffset;
uniform float uGradientRepeats;
uniform vec2 uUvOrigin;
uniform vec2 uUvSize;

const float TILE = 8.0;

float hash3(vec3 p) {
  vec3 q = fract(p * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yxz + 33.33);
  return fract((q.x + q.y) * q.z);
}

float wrapT(float v, float period) {
  return v - floor(v / period) * period;
}

float smoothNoise3T(vec3 p, float tilePeriod) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 s = f * f * (3.0 - 2.0 * f);
  float wx0 = wrapT(i.x, tilePeriod);
  float x1w = wrapT(i.x + 1.0, tilePeriod);
  float wz0 = wrapT(i.z, tilePeriod);
  float z1w = wrapT(i.z + 1.0, tilePeriod);
  float y0 = i.y;
  float y1 = i.y + 1.0;
  float v000 = hash3(vec3(wx0, y0, wz0));
  float v100 = hash3(vec3(x1w, y0, wz0));
  float v010 = hash3(vec3(wx0, y1, wz0));
  float v110 = hash3(vec3(x1w, y1, wz0));
  float v001 = hash3(vec3(wx0, y0, z1w));
  float v101 = hash3(vec3(x1w, y0, z1w));
  float v011 = hash3(vec3(wx0, y1, z1w));
  float v111 = hash3(vec3(x1w, y1, z1w));
  return mix(
    mix(mix(v000, v100, s.x), mix(v010, v110, s.x), s.y),
    mix(mix(v001, v101, s.x), mix(v011, v111, s.x), s.y),
    s.z
  );
}

float fbm3(vec3 p) {
  return smoothNoise3T(p, TILE);
}

vec4 chromeStop(float t) {
  if (t <= uP.x || uCount < 1.5) return uC0;
  if (t <= uP.y || uCount < 2.5) {
    return mix(uC0, uC1, (t - uP.x) / max(uP.y - uP.x, 1e-5));
  }
  if (t <= uP.z || uCount < 3.5) {
    return mix(uC1, uC2, (t - uP.y) / max(uP.z - uP.y, 1e-5));
  }
  if (t <= uP.w) {
    return mix(uC2, uC3, (t - uP.z) / max(uP.w - uP.z, 1e-5));
  }
  return uCount > 3.5 ? uC3 : uC2;
}

vec4 aaGradientLookup(float rawH, float offset) {
  float shifted = rawH + offset;
  float wrapped = fract(shifted);
  float filterWidth = max(fwidth(shifted), 1e-5);
  float distance = min(wrapped, 1.0 - wrapped);
  float blend = clamp(distance / (filterWidth * 1.5), 0.0, 1.0);
  float other = wrapped > 0.5 ? wrapped - 1.0 : wrapped + 1.0;
  return mix(chromeStop(clamp(other, 0.0, 1.0)), chromeStop(wrapped), blend);
}

float heightAt(vec3 np, float hi, float edgeMask, float eps) {
  float noiseValue = fbm3(np);
  float dnx = fbm3(np + vec3(eps, 0.0, 0.0)) - fbm3(np - vec3(eps, 0.0, 0.0));
  float dny = fbm3(np + vec3(0.0, eps, 0.0)) - fbm3(np - vec3(0.0, eps, 0.0));
  return mix(0.5, noiseValue * edgeMask, hi) + (dnx + dny) * 0.5 * hi * 0.3;
}

void main() {
  vec2 uv = vUv;
  vec2 localUv = vec2(
    (uv.x - uUvOrigin.x) / max(uUvSize.x, 1e-5),
    1.0 - (uv.y - uUvOrigin.y) / max(uUvSize.y, 1e-5)
  );
  float heightIntensity = uHeightIntensity / 100.0;
  float chromaSeparation = uChroma / 1000.0;
  float noiseScale = max(0.01, uNoiseScale / 100.0);
  float stretchY = max(0.01, uStretch / 100.0);
  float gradientOffset = uGradientOffset / 100.0;
  float phaseX = (uPhase / 100.0) * TILE;
  float evolutionZ = (uEvolution / 100.0) * TILE;

  float angle = uNoiseAngle * 0.017453292;
  float cosA = cos(angle);
  float sinA = sin(angle);
  vec2 centered = localUv - vec2(0.5);
  vec2 rotated = vec2(
    centered.x * cosA - centered.y * sinA,
    centered.x * sinA + centered.y * cosA
  ) + vec2(0.5);

  vec4 inputColor = texture2D(uInput, uv);
  float edgeMask = texture2D(uBlur, uv).a;

  vec3 noiseBase = vec3(
    rotated.x / noiseScale + phaseX,
    rotated.y / noiseScale / stretchY,
    0.37 + evolutionZ
  );

  float eps = 0.005 / noiseScale;
  float nx = fbm3(noiseBase + vec3(eps, 0.0, 0.0)) - fbm3(noiseBase - vec3(eps, 0.0, 0.0));
  float ny = fbm3(noiseBase + vec3(0.0, eps, 0.0)) - fbm3(noiseBase - vec3(0.0, eps, 0.0));
  float heightCenter = mix(0.5, fbm3(noiseBase) * edgeMask, heightIntensity) + (nx + ny) * 0.5 * heightIntensity * 0.3;
  vec2 normalDir = normalize(vec2(nx, ny) + vec2(1e-6));
  vec2 uvShift = normalDir * chromaSeparation;

  float hR = clamp(heightAt(noiseBase + vec3(uvShift, 0.0), heightIntensity, edgeMask, eps), 0.0, 1.0);
  float hG = clamp(heightCenter, 0.0, 1.0);
  float hB = clamp(heightAt(noiseBase - vec3(uvShift, 0.0), heightIntensity, edgeMask, eps), 0.0, 1.0);

  float gradientRepeats = max(1.0, floor(uGradientRepeats + 0.5));
  float dhR = fwidth(hR) * gradientRepeats;
  float dhG = fwidth(hG) * gradientRepeats;
  float dhB = fwidth(hB) * gradientRepeats;
  vec4 colorR = vec4(0.0);
  vec4 colorG = vec4(0.0);
  vec4 colorB = vec4(0.0);
  for (int sampleIndex = 0; sampleIndex < 4; sampleIndex++) {
    float jitter = (float(sampleIndex) + 0.5) / 4.0 - 0.5;
    colorR += aaGradientLookup(hR * gradientRepeats + jitter * dhR, gradientOffset);
    colorG += aaGradientLookup(hG * gradientRepeats + jitter * dhG, gradientOffset);
    colorB += aaGradientLookup(hB * gradientRepeats + jitter * dhB, gradientOffset);
  }
  colorR *= 0.25;
  colorG *= 0.25;
  colorB *= 0.25;

  float softAlpha = smoothstep(0.45, 0.55, edgeMask) * inputColor.a;
  gl_FragColor = vec4(colorR.r, colorG.g, colorB.b, 1.0) * softAlpha;
}
`

type Layer = {
  input: WebGLTexture
  blur: WebGLTexture
  params: MetalParams
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Thinking mark shader:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(src))
    img.src = src
  })
}

function paintMask(
  img: HTMLImageElement,
  width: number,
  height: number,
  box: { x: number; y: number; w: number; h: number },
  blur: number,
) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const sx = width / VIEW_W
  const sy = height / VIEW_H
  ctx.clearRect(0, 0, width, height)
  ctx.filter = blur > 0 ? `blur(${blur}px)` : 'none'
  ctx.drawImage(img, box.x * sx, box.y * sy, box.w * sx, box.h * sy)
  return canvas
}

function upload(gl: WebGLRenderingContext, texture: WebGLTexture, source: HTMLCanvasElement) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

function setColor(gl: WebGLRenderingContext, loc: WebGLUniformLocation | null, stop?: Stop) {
  if (!loc) return
  if (!stop) {
    gl.uniform4f(loc, 0, 0, 0, 1)
    return
  }
  gl.uniform4f(loc, stop.r, stop.g, stop.b, 1)
}

function FallbackMark() {
  return (
    <div className="thinking-mark thinking-mark-fallback" aria-hidden>
      <span className="thinking-part thinking-arch" />
      <span className="thinking-part thinking-dune" />
    </div>
  )
}

export function ThinkingMark() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    if (!gl) {
      setFallback(true)
      return
    }
    gl.getExtension('OES_standard_derivatives')

    const vs = compile(gl, gl.VERTEX_SHADER, VS)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS)
    if (!vs || !fs) {
      setFallback(true)
      return
    }
    const program = gl.createProgram()
    if (!program) {
      setFallback(true)
      return
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Thinking mark program:', gl.getProgramInfoLog(program))
      setFallback(true)
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const uniforms = {
      uInput: gl.getUniformLocation(program, 'uInput'),
      uBlur: gl.getUniformLocation(program, 'uBlur'),
      uC0: gl.getUniformLocation(program, 'uC0'),
      uC1: gl.getUniformLocation(program, 'uC1'),
      uC2: gl.getUniformLocation(program, 'uC2'),
      uC3: gl.getUniformLocation(program, 'uC3'),
      uP: gl.getUniformLocation(program, 'uP'),
      uCount: gl.getUniformLocation(program, 'uCount'),
      uHeightIntensity: gl.getUniformLocation(program, 'uHeightIntensity'),
      uChroma: gl.getUniformLocation(program, 'uChroma'),
      uNoiseScale: gl.getUniformLocation(program, 'uNoiseScale'),
      uPhase: gl.getUniformLocation(program, 'uPhase'),
      uEvolution: gl.getUniformLocation(program, 'uEvolution'),
      uNoiseAngle: gl.getUniformLocation(program, 'uNoiseAngle'),
      uStretch: gl.getUniformLocation(program, 'uStretch'),
      uGradientOffset: gl.getUniformLocation(program, 'uGradientOffset'),
      uGradientRepeats: gl.getUniformLocation(program, 'uGradientRepeats'),
      uUvOrigin: gl.getUniformLocation(program, 'uUvOrigin'),
      uUvSize: gl.getUniformLocation(program, 'uUvSize'),
    }

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    let layers: Layer[] = []
    let raf = 0
    let alive = true
    const started = performance.now()

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = Math.round(CSS_W * dpr * 2)
    const height = Math.round(CSS_H * dpr * 2)
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)

    function drawLayer(layer: Layer, time: number) {
      const { params } = layer
      const phase = params.phase + time * (params.id === 'arch' ? 3.2 : 4.4)
      const evolution =
        params.evolution + Math.sin(time * (params.id === 'arch' ? 0.16 : 0.2) + params.phase * 0.02) * 8

      gl.uniform1i(uniforms.uInput, 0)
      gl.uniform1i(uniforms.uBlur, 1)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, layer.input)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, layer.blur)

      const stops = params.stops
      setColor(gl, uniforms.uC0, stops[0])
      setColor(gl, uniforms.uC1, stops[1] ?? stops[0])
      setColor(gl, uniforms.uC2, stops[2] ?? stops[1] ?? stops[0])
      setColor(gl, uniforms.uC3, stops[3] ?? stops[2] ?? stops[0])
      gl.uniform4f(
        uniforms.uP,
        stops[0]?.p ?? 0,
        stops[1]?.p ?? 1,
        stops[2]?.p ?? 1,
        stops[3]?.p ?? 1,
      )
      gl.uniform1f(uniforms.uCount, stops.length)
      gl.uniform1f(uniforms.uHeightIntensity, params.heightIntensity)
      gl.uniform1f(uniforms.uChroma, params.chromaSepR)
      gl.uniform1f(uniforms.uNoiseScale, params.noiseScale)
      gl.uniform1f(uniforms.uPhase, phase)
      gl.uniform1f(uniforms.uEvolution, evolution)
      gl.uniform1f(uniforms.uNoiseAngle, params.noiseAngle)
      gl.uniform1f(uniforms.uStretch, params.stretch)
      gl.uniform1f(uniforms.uGradientOffset, params.gradientOffset)
      gl.uniform1f(uniforms.uGradientRepeats, params.gradientRepeats)
      const box = params.id === 'arch' ? ARCH : DUNE
      gl.uniform2f(uniforms.uUvOrigin, box.x / VIEW_W, 1 - (box.y + box.h) / VIEW_H)
      gl.uniform2f(uniforms.uUvSize, box.w / VIEW_W, box.h / VIEW_H)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    function frame(now: number) {
      if (!alive) return
      const time = (now - started) / 1000
      gl.clear(gl.COLOR_BUFFER_BIT)
      for (const layer of layers) drawLayer(layer, time)
      raf = requestAnimationFrame(frame)
    }

    Promise.all([loadImage(asset('icons/dune-mark-arch.svg')), loadImage(asset('icons/dune-mark-dune.svg'))])
      .then(([archImg, duneImg]) => {
        if (!alive) return
        const scale = height / VIEW_H
        const makeLayer = (img: HTMLImageElement, box: typeof ARCH, params: MetalParams): Layer => {
          const blurPx = params.blur * scale
          const inputTex = gl.createTexture()
          const blurTex = gl.createTexture()
          if (!inputTex || !blurTex) throw new Error('texture')
          upload(gl, inputTex, paintMask(img, width, height, box, 0))
          upload(gl, blurTex, paintMask(img, width, height, box, blurPx))
          return { input: inputTex, blur: blurTex, params }
        }
        layers = [
          makeLayer(duneImg, DUNE, DUNE_METAL),
          makeLayer(archImg, ARCH, ARCH_METAL),
        ]
        raf = requestAnimationFrame(frame)
      })
      .catch(() => {
        if (alive) setFallback(true)
      })

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      gl.deleteProgram(program)
      for (const layer of layers) {
        gl.deleteTexture(layer.input)
        gl.deleteTexture(layer.blur)
      }
    }
  }, [])

  if (fallback) return <FallbackMark />

  return (
    <canvas
      ref={canvasRef}
      className="thinking-mark"
      width={CSS_W}
      height={CSS_H}
      aria-hidden
    />
  )
}
