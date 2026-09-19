import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPhase, samplePalette, sunDirection } from './dayNight'

type Props = {
  lifted: boolean
}

export function CycleLights({ lifted }: Props) {
  const dir = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const ambient = useRef<THREE.AmbientLight>(null)
  const sunVec = useRef(new THREE.Vector3())
  const { scene } = useThree()
  const fog = useRef(new THREE.FogExp2('#101c2c', 0.011))

  if (scene.fog !== fog.current) {
    scene.fog = fog.current
    scene.background = null
  }

  useFrame(() => {
    const palette = samplePalette(getPhase())
    const sun = sunDirection(palette)
    sunVec.current.set(sun[0], sun[1], sun[2]).multiplyScalar(110)
    if (dir.current) {
      dir.current.position.copy(sunVec.current)
      dir.current.color.set(palette.sunColor)
      dir.current.intensity = palette.sunIntensity * (lifted ? 0.85 : 1)
    }
    if (hemi.current) {
      hemi.current.color.set(palette.hemiSky)
      hemi.current.groundColor.set(palette.hemiGround)
      hemi.current.intensity = 0.55
    }
    if (ambient.current) {
      ambient.current.color.set(palette.ambient)
      ambient.current.intensity = palette.ambientIntensity
    }
    fog.current.color.set(palette.fog)
    fog.current.density = lifted ? 0.0004 : 0.0026
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#2a3c58', '#121c2c', 0.55]} />
      <ambientLight ref={ambient} intensity={0.4} />
      <directionalLight ref={dir} />
    </>
  )
}
