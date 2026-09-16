import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { collisionHeight, TERRAIN_BOUNDS } from './terrain'

const COUNT = 200_000
const COL_W = 64
const COL_D = 56
const Z_FLOW = 0.014
const TRAIL_SCALE = 3.75
const TRAIL_SEGS = 14

function bakeCollision(): THREE.DataTexture {
  const data = new Uint8Array(COL_W * COL_D * 4)
  const { x0, x1, z0, z1 } = TERRAIN_BOUNDS
  for (let j = 0; j < COL_D; j += 1) {
    for (let i = 0; i < COL_W; i += 1) {
      const x = x0 + (i / (COL_W - 1)) * (x1 - x0)
      const z = z0 + (j / (COL_D - 1)) * (z1 - z0)
      const idx = (j * COL_W + i) * 4
      const packed = Math.min(255, Math.round((collisionHeight(x, z) / 24) * 255))
      data[idx] = packed
      data[idx + 1] = packed
      data[idx + 2] = packed
      data[idx + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, COL_W, COL_D, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false
  tex.flipY = false
  tex.colorSpace = THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

function trailLength(): number {
  const r = Math.random()
  if (r < 0.48) return (0.08 + Math.random() * 0.38) * TRAIL_SCALE
  if (r < 0.8) return (0.55 + Math.random() * 1.05) * TRAIL_SCALE
  return (2.05 + Math.random() * 2.35) * TRAIL_SCALE
}

const vertex = /* glsl */ `
  attribute vec3 aOrigin;
  attribute vec2 aSeed;
  attribute float aTrail;
  uniform float uTime;
  uniform sampler2D uHeight;
  uniform vec4 uBounds;
  varying vec2 vUv;
  varying float vAlong;
  varying float vAspect;

  float sampleHeight(vec2 xz) {
    vec2 uv = vec2(
      (xz.x - uBounds.x) / (uBounds.y - uBounds.x),
      (xz.y - uBounds.z) / (uBounds.w - uBounds.z)
    );
    uv = clamp(uv, 0.001, 0.999);
    return texture2D(uHeight, uv).r * 24.0;
  }

  vec3 grainPos(float time, vec3 origin, vec2 seed) {
    float zSpan = uBounds.w - uBounds.z;
    float z01 = fract((origin.z - uBounds.z) / zSpan - time * ${Z_FLOW.toFixed(3)} - seed.y);
    vec3 p;
    p.z = uBounds.z + z01 * zSpan;
    p.x = origin.x
      + sin(time * 0.28 + seed.y * 11.0) * 0.55
      + sin(time * 0.79 + seed.y * 6.1) * 0.042;
    p.x = clamp(p.x, uBounds.x + 2.0, uBounds.y - 2.0);
    float lift = 0.2 + seed.y * 0.35;
    p.y = sampleHeight(p.xz) + lift + sin(time * 1.4 + seed.y * 16.0) * 0.08;
    return p;
  }

  vec3 trailPoint(float t, float tau, vec3 head, vec3 origin, vec2 seed, float trail) {
    float time = uTime - tau * t;
    float zSpan = uBounds.w - uBounds.z;
    float zSpeed = ${Z_FLOW.toFixed(3)} * zSpan;
    float e = sin(3.14159265 * clamp(t, 0.0, 1.0));
    float bow = sin(seed.y * 21.7);
    float ess = sin(6.2831853 * t + seed.y * 8.2);
    float k = mix(0.45, 1.0, fract(seed.y * 4.13));

    vec3 p;
    p.x = origin.x
      + sin(time * 0.28 + seed.y * 11.0) * 0.55
      + sin(time * 0.79 + seed.y * 6.1) * 0.042
      + e * mix(bow, ess, 0.58) * k * trail * 0.02;
    p.x = clamp(p.x, uBounds.x + 2.0, uBounds.y - 2.0);
    p.z = head.z + zSpeed * tau * t;
    p.y = sampleHeight(p.xz) + 0.2 + seed.y * 0.35
      + sin(time * 1.4 + seed.y * 16.0) * 0.08
      + e * trail * 0.0015 * abs(bow) * k;
    return p;
  }

  vec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    return 0.5 * (
      (2.0 * p1) +
      (-p0 + p2) * t +
      (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2 +
      (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
    );
  }

  vec3 catmullTangent(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float t2 = t * t;
    return 0.5 * (
      (-p0 + p2) +
      2.0 * (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t +
      3.0 * (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t2
    );
  }

  void main() {
    vUv = uv;
    float scale = aSeed.x;
    float zSpan = uBounds.w - uBounds.z;
    float zSpeed = ${Z_FLOW.toFixed(3)} * zSpan;
    float tau = aTrail / max(zSpeed, 0.001);
    float t = 1.0 - uv.y;

    vec3 head = grainPos(uTime, aOrigin, aSeed);
    vec3 c0 = trailPoint(-0.16, tau, head, aOrigin, aSeed, aTrail);
    vec3 c1 = trailPoint(0.0, tau, head, aOrigin, aSeed, aTrail);
    vec3 c2 = trailPoint(0.2, tau, head, aOrigin, aSeed, aTrail);
    vec3 c3 = trailPoint(0.4, tau, head, aOrigin, aSeed, aTrail);
    vec3 c4 = trailPoint(0.6, tau, head, aOrigin, aSeed, aTrail);
    vec3 c5 = trailPoint(0.8, tau, head, aOrigin, aSeed, aTrail);
    vec3 c6 = trailPoint(1.0, tau, head, aOrigin, aSeed, aTrail);
    vec3 c7 = trailPoint(1.16, tau, head, aOrigin, aSeed, aTrail);

    float u = clamp(t, 0.0, 0.9999) * 5.0;
    float seg = floor(u);
    float lt = fract(u);
    vec3 spine;
    vec3 tang;
    if (seg < 0.5) {
      spine = catmullRom(c0, c1, c2, c3, lt);
      tang = catmullTangent(c0, c1, c2, c3, lt);
    } else if (seg < 1.5) {
      spine = catmullRom(c1, c2, c3, c4, lt);
      tang = catmullTangent(c1, c2, c3, c4, lt);
    } else if (seg < 2.5) {
      spine = catmullRom(c2, c3, c4, c5, lt);
      tang = catmullTangent(c2, c3, c4, c5, lt);
    } else if (seg < 3.5) {
      spine = catmullRom(c3, c4, c5, c6, lt);
      tang = catmullTangent(c3, c4, c5, c6, lt);
    } else {
      spine = catmullRom(c4, c5, c6, c7, lt);
      tang = catmullTangent(c4, c5, c6, c7, lt);
    }

    if (dot(tang, tang) < 1e-8) {
      tang = vec3(0.0, 0.0, 1.0);
    }
    vec3 along = -normalize(tang);
    spine += along * mix(scale * 0.5, -scale * 0.5, t);

    vec3 toCam = cameraPosition - spine;
    vec3 across = cross(along, toCam);
    float acrossLen = length(across);
    if (acrossLen < 1e-5) {
      across = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    } else {
      across /= acrossLen;
    }

    float width = scale * mix(1.0, 0.16, t * t);
    vec3 world = spine + across * position.x * width;

    vAlong = t;
    vAspect = (aTrail + scale) / max(scale, 1e-4);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying float vAlong;
  varying float vAspect;

  void main() {
    float nx = vUv.x * 2.0 - 1.0;
    float ny = (vUv.y - 1.0) * vAspect * 2.0 + 1.0;
    float r2 = nx * nx + ny * ny;
    float grain = 1.0 - smoothstep(0.72, 1.0, r2);

    float taper = mix(0.48, 0.08, vAlong);
    float ribbon = 1.0 - smoothstep(taper, taper + 0.26, abs(nx));
    float fade = pow(clamp(vUv.y, 0.0, 1.0), 1.08);
    float tail = ribbon * fade * (1.0 - grain);

    float alpha = (smoothstep(1.0, 0.18, r2) + tail) * 0.04;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(vec3(1.0), clamp(alpha, 0.0, 1.0));
  }
`

export function SandParticles() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const { geometry, heightMap } = useMemo(() => {
    const heightMap = bakeCollision()
    const plane = new THREE.PlaneGeometry(1, 1, 1, TRAIL_SEGS)
    const geo = new THREE.InstancedBufferGeometry()
    geo.index = plane.index
    geo.attributes.position = plane.attributes.position
    geo.attributes.uv = plane.attributes.uv
    plane.dispose()

    const origins = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT * 2)
    const trails = new Float32Array(COUNT)
    const { x0, x1, z0, z1 } = TERRAIN_BOUNDS
    for (let i = 0; i < COUNT; i += 1) {
      const x = x0 + Math.random() * (x1 - x0)
      const z = z0 + Math.random() * (z1 - z0)
      origins[i * 3] = x
      origins[i * 3 + 1] = collisionHeight(x, z)
      origins[i * 3 + 2] = z
      seeds[i * 2] = 0.09 + Math.random() * 0.11
      seeds[i * 2 + 1] = Math.random()
      trails[i] = trailLength()
    }
    geo.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(origins, 3))
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 2))
    geo.setAttribute('aTrail', new THREE.InstancedBufferAttribute(trails, 1))
    geo.instanceCount = COUNT
    return { geometry: geo, heightMap }
  }, [])

  const uniforms = useRef({
    uTime: { value: 0 },
    uHeight: { value: heightMap },
    uBounds: {
      value: new THREE.Vector4(
        TERRAIN_BOUNDS.x0,
        TERRAIN_BOUNDS.x1,
        TERRAIN_BOUNDS.z0,
        TERRAIN_BOUNDS.z1,
      ),
    },
  })

  useFrame((_, dt) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value += dt
  })

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms.current}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest
        depthFunc={THREE.LessEqualDepth}
        toneMapped={false}
      />
    </mesh>
  )
}
