import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getPhase, samplePalette, sunDirection } from './dayNight'

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vDir = normalize(world.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w;
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform float uStars;
  uniform float uTime;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  void main() {
    vec3 dir = normalize(vDir);
    float elev = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uHorizon, uZenith, pow(elev, 0.82));

    float hg = exp(-pow(dir.y * 3.2, 2.0));
    col += uGlow * hg * 0.55;

    vec3 sunDir = normalize(uSunDir);
    float sun = pow(max(0.0, dot(dir, sunDir)), 700.0) * uSunIntensity;
    float halo = pow(max(0.0, dot(dir, sunDir)), 5.5) * uSunIntensity;
    col += uSunColor * (sun * 2.4 + halo * 0.42);

    // Spherical cells stay fixed on the sky. Hashing a continuous direction
    // made 1px sparkles crawl with the camera and pulse as grain once uStars
    // hits 1 at night.
    float sky = smoothstep(0.08, 0.28, dir.y);
    float az = atan(dir.z, dir.x);
    float el = asin(clamp(dir.y, -1.0, 1.0));
    vec2 sph = vec2(az * 0.15915494 + 0.5, el * 0.31830989 + 0.5);

    vec2 gid = floor(sph * vec2(110.0, 56.0));
    float n = hash(vec3(gid, 13.0));
    vec2 fu = fract(sph * vec2(110.0, 56.0)) - 0.5;
    vec2 jitter = vec2(hash(vec3(gid, 3.1)), hash(vec3(gid, 8.7))) - 0.5;
    float disc = smoothstep(0.07, 0.0, length(fu - jitter * 0.4));
    float twinkle = 0.9 + 0.1 * sin(uTime * (0.38 + n * 0.5) + n * 37.0);
    float star = disc * step(0.93, n) * sky * uStars * (0.42 + n * 0.58) * twinkle;

    vec2 gidB = floor(sph * vec2(48.0, 24.0));
    float nB = hash(vec3(gidB, 19.1));
    vec2 fuB = fract(sph * vec2(48.0, 24.0)) - 0.5;
    vec2 jitterB = vec2(hash(vec3(gidB, 2.2)), hash(vec3(gidB, 6.8))) - 0.5;
    float discB = smoothstep(0.1, 0.0, length(fuB - jitterB * 0.34));
    float twinkleB = 0.92 + 0.08 * sin(uTime * (0.26 + nB * 0.35) + nB * 21.0);
    float starB = discB * step(0.97, nB) * sky * uStars * (0.55 + nB * 0.45) * twinkleB;

    col += vec3(0.9, 0.93, 1.0) * (star * 0.72 + starB * 1.02);

    float cloud = smoothstep(0.35, 0.7, hash(vec3(dir.x * 2.2, dir.y * 6.0, 0.2))) * (1.0 - uStars);
    cloud *= exp(-pow(dir.y * 5.0 - 0.4, 2.0)) * 0.18;
    col = mix(col, uGlow, cloud);

    gl_FragColor = vec4(col, 1.0);
  }
`

export function SkyDome() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useRef({
    uZenith: { value: new THREE.Color('#2e2c58') },
    uHorizon: { value: new THREE.Color('#b8a4d4') },
    uGlow: { value: new THREE.Color('#dcc4e8') },
    uSunDir: { value: new THREE.Vector3(-0.6, 0.4, 0.4) },
    uSunColor: { value: new THREE.Color('#f0d4f4') },
    uSunIntensity: { value: 3 },
    uStars: { value: 0 },
    uTime: { value: 0 },
  })

  useFrame((_, dt) => {
    const palette = samplePalette(getPhase())
    const sun = sunDirection(palette)
    const m = mat.current
    if (!m) return
    m.uniforms.uZenith.value.set(palette.skyZenith)
    m.uniforms.uHorizon.value.set(palette.skyHorizon)
    m.uniforms.uGlow.value.set(palette.skyGlow)
    m.uniforms.uSunDir.value.set(sun[0], sun[1], sun[2])
    m.uniforms.uSunColor.value.set(palette.sunColor)
    m.uniforms.uSunIntensity.value = palette.sunIntensity
    m.uniforms.uStars.value = palette.starOpacity
    m.uniforms.uTime.value += dt
  })

  return (
    <mesh scale={[-1, 1, 1]} frustumCulled={false}>
      <sphereGeometry args={[420, 48, 32]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms.current}
        side={THREE.BackSide}
        depthTest={false}
        depthWrite={false}
        toneMapped
        fog={false}
      />
    </mesh>
  )
}
