import { useLayoutEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { resetCycle } from './dayNight'
import { CameraRig } from './CameraRig'
import { CycleLights } from './CycleLights'
import { DuneTerrain } from './DuneTerrain'
import { SandParticles } from './SandParticles'
import { SkyDome } from './SkyDome'

type Props = {
  flying: boolean
  fading?: boolean
}

export function DuneCanvas({ flying, fading = false }: Props) {
  useLayoutEffect(() => {
    resetCycle()
  }, [])

  return (
    <Canvas
      className={`dune-canvas${fading ? ' is-fading' : ''}`}
      shadows={{ enabled: true, type: THREE.PCFShadowMap }}
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#2e2c58', 1)
        gl.toneMappingExposure = 1
      }}
    >
      <PerspectiveCamera makeDefault fov={40} near={1.2} far={800} position={[3.2, 16.2, 100]} />
      <CameraRig flying={flying} fading={fading} />
      <CycleLights lifted={flying || fading} />
      <SkyDome />
      <DuneTerrain />
      <SandParticles key="sand-visible" />
    </Canvas>
  )
}
