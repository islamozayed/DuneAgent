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

    float hg = exp(-pow(dir.y * 3.6, 2.0));
    col += uGlow * hg * 0.42;

    vec3 sunDir = normalize(uSunDir);
    float sun = pow(max(0.0, dot(dir, sunDir)), 900.0) * uSunIntensity;
    float halo = pow(max(0.0, dot(dir, sunDir)), 8.0) * uSunIntensity;
    col += uSunColor * (sun * 2.8 + halo * 0.28);

    float n = hash(normalize(dir) * 220.0);
    float nFine = hash(normalize(dir) * 560.0);
    float sky = smoothstep(0.02, 0.42, dir.y);
    float star = step(0.9928, n) * uStars * sky;
    star *= 0.48 + 0.52 * sin(uTime * (1.15 + n * 2.3) + n * 48.0);
    float star2 = step(0.9974, nFine) * uStars * sky;
    star2 *= 0.35 + 0.65 * sin(uTime * 2.05 + nFine * 31.0);
    col += vec3(star * 0.95 + star2);

    float cloud = smoothstep(0.35, 0.7, hash(vec3(dir.x * 2.2, dir.y * 6.0, 0.2))) * (1.0 - uStars);
    cloud *= exp(-pow(dir.y * 5.0 - 0.4, 2.0)) * 0.18;
    col = mix(col, uGlow, cloud);

    gl_FragColor = vec4(col, 1.0);
  }
`

export function SkyDome() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useRef({
    uZenith: { value: new THREE.Color('#6ba3c9') },
    uHorizon: { value: new THREE.Color('#e8c4a0') },
    uGlow: { value: new THREE.Color('#f0c9a8') },
    uSunDir: { value: new THREE.Vector3(-0.6, 0.4, 0.4) },
    uSunColor: { value: new THREE.Color('#ffe4b3') },
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
