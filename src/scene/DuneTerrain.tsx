import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { duneHeight, TERRAIN_BOUNDS } from './terrain'
import { getPhase, samplePalette, sunDirection } from './dayNight'

let sandNormal: THREE.CanvasTexture | null = null
let fresnelLight: THREE.CanvasTexture | null = null

export function getSandNormal(): THREE.CanvasTexture {
  if (sandNormal) return sandNormal
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    sandNormal = new THREE.CanvasTexture(canvas)
    return sandNormal
  }
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = Math.random() * 0.35 + 0.5
      const i = (y * size + x) * 4
      img.data[i] = Math.floor(n * 255)
      img.data[i + 1] = Math.floor((1 - n) * 200 + 40)
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(36, 36)
  tex.anisotropy = 8
  tex.colorSpace = THREE.NoColorSpace
  sandNormal = tex
  return tex
}

function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function getFresnelLight(): THREE.CanvasTexture {
  if (fresnelLight) return fresnelLight
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    fresnelLight = new THREE.CanvasTexture(canvas)
    return fresnelLight
  }
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y += 1) {
    const nl = y / (size - 1)
    const peakT = (nl - 0.62) / 0.22
    const sunPeak = Math.exp(-(peakT * peakT))
    const sunFill = Math.pow(nl, 0.55)
    for (let x = 0; x < size; x += 1) {
      const f = x / (size - 1)
      const grain = 0.86 + hash2(x * 0.37, y * 1.13) * 0.28
      const ripple = 0.92 + 0.08 * Math.sin(x * 0.41 + y * 0.09)
      const rim = Math.pow(f, 1.55)
      const hot = Math.pow(f, 4.2)
      const wrap = Math.pow(1 - nl, 1.35) * Math.pow(f, 2.1)
      const warm = (rim * (0.32 + 0.95 * sunPeak) + hot * 0.85 * sunPeak + rim * sunFill * 0.36) * grain * ripple
      const cool = wrap * (0.62 + grain * 0.18)
      const i = (y * size + x) * 4
      img.data[i] = Math.min(255, Math.floor((warm * 0.9 + cool * 0.64) * 255))
      img.data[i + 1] = Math.min(255, Math.floor((warm * 0.76 + cool * 0.7) * 255))
      img.data[i + 2] = Math.min(255, Math.floor((warm * 1.08 + cool * 0.98) * 255))
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  fresnelLight = tex
  return tex
}

const FRESNEL_CACHE_KEY = 'dune-fresnel-rim-v5'

function injectFresnelRim(shader: THREE.WebGLProgramParametersWithUniforms, uniforms: RimUniforms) {
  shader.uniforms.uFresnelTex = uniforms.uFresnelTex
  shader.uniforms.uSunDir = uniforms.uSunDir
  shader.uniforms.uSunColor = uniforms.uSunColor
  shader.uniforms.uRimCool = uniforms.uRimCool
  shader.uniforms.uRimStrength = uniforms.uRimStrength

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      /* glsl */ `
      #include <common>
      uniform sampler2D uFresnelTex;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uRimCool;
      uniform float uRimStrength;
      `,
    )
    .replace(
      'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',
      /* glsl */ `
      vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
      {
        vec3 viewDir = normalize(vViewPosition);
        vec3 rimN = normalize(nonPerturbedNormal);
        float ndv = saturate(dot(rimN, viewDir));
        float fresnel = pow(1.0 - ndv, 1.45);
        vec3 sunView = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
        float ndl = dot(rimN, sunView);
        float nl01 = saturate(ndl * 0.5 + 0.5);
        float knife = pow(1.0 - abs(ndl), 1.8) * saturate(ndl + 0.18);
        vec3 worldN = normalize((vec4(rimN, 0.0) * viewMatrix).xyz);
        float slope = smoothstep(0.04, 0.5, 1.0 - worldN.y);
        float grain = 0.5;
        #ifdef USE_NORMALMAP
          grain = texture2D(normalMap, vNormalMapUv).r;
        #endif
        vec2 lutUv = vec2(saturate((fresnel * 0.78 + knife * 0.4) * mix(0.96, 1.05, grain)), nl01);
        vec3 rim = texture2D(uFresnelTex, lutUv).rgb * uSunColor;
        vec3 wrap = uRimCool * fresnel * mix(0.78, 0.14, nl01);
        outgoingLight += (rim + wrap) * uRimStrength * mix(0.28, 1.0, slope);
      }
      `,
    )
}

type RimUniforms = {
  uFresnelTex: { value: THREE.Texture }
  uSunDir: { value: THREE.Vector3 }
  uSunColor: { value: THREE.Color }
  uRimCool: { value: THREE.Color }
  uRimStrength: { value: number }
}

export function DuneTerrain() {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const { geometry, normalMap, fresnelMap } = useMemo(() => {
    const width = TERRAIN_BOUNDS.x1 - TERRAIN_BOUNDS.x0
    const depth = TERRAIN_BOUNDS.z1 - TERRAIN_BOUNDS.z0
    const geo = new THREE.PlaneGeometry(width, depth, 280, 240)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const cx = (TERRAIN_BOUNDS.x0 + TERRAIN_BOUNDS.x1) / 2
    const cz = (TERRAIN_BOUNDS.z0 + TERRAIN_BOUNDS.z1) / 2

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i) + cx
      const z = pos.getZ(i) + cz
      pos.setX(i, x)
      pos.setZ(i, z)
      pos.setY(i, duneHeight(x, z))
    }
    geo.computeVertexNormals()
    const nrm = geo.attributes.normal
    for (let i = 0; i < pos.count; i += 1) {
      const nx = nrm.getX(i)
      const ny = nrm.getY(i)
      const slip = THREE.MathUtils.clamp((0.52 - ny) * 1.8 + Math.max(0, nx) * 1.15, 0, 1)
      colors[i * 3] = 1 - slip * 0.58
      colors[i * 3 + 1] = 1 - slip * 0.67
      colors[i * 3 + 2] = 1 - slip * 0.75
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeBoundingSphere()
    return { geometry: geo, normalMap: getSandNormal(), fresnelMap: getFresnelLight() }
  }, [])

  const rimUniforms = useRef<RimUniforms>({
    uFresnelTex: { value: fresnelMap },
    uSunDir: { value: new THREE.Vector3(-0.6, 0.4, 0.4) },
    uSunColor: { value: new THREE.Color('#bad7fd') },
    uRimCool: { value: new THREE.Color('#9ab4cc') },
    uRimStrength: { value: 1.7 },
  })

  const onBeforeCompile = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      injectFresnelRim(shader, rimUniforms.current)
    },
    [],
  )

  useFrame(() => {
    const palette = samplePalette(getPhase())
    const sun = sunDirection(palette)
    if (material.current) {
      material.current.color.set(palette.sandLit)
    }
    const rim = rimUniforms.current
    rim.uSunDir.value.set(sun[0], sun[1], sun[2])
    rim.uSunColor.value.set(palette.sunColor)
    rim.uRimCool.value.set(palette.skyGlow)
    rim.uRimStrength.value = 1.12 + palette.sunIntensity * 0.38
  })

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        ref={material}
        vertexColors
        roughness={0.84}
        metalness={0.04}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.38, 0.38)}
        envMapIntensity={0.32}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => FRESNEL_CACHE_KEY}
      />
    </mesh>
  )
}
