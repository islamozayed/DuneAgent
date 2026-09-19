import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getPhase, samplePalette } from './dayNight'
import { makeSandNormal } from './sandGeometry'

type Props = {
  geometry: THREE.BufferGeometry
  receiveShadow?: boolean
  castShadow?: boolean
}

export function SandMaterialMesh({ geometry, receiveShadow = true, castShadow = true }: Props) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const normalMap = useMemo(() => makeSandNormal(), [])

  useFrame(() => {
    if (material.current) {
      material.current.color.set(samplePalette(getPhase()).sandLit)
    }
  })

  return (
    <mesh geometry={geometry} receiveShadow={receiveShadow} castShadow={castShadow}>
      <meshStandardMaterial
        ref={material}
        vertexColors
        roughness={0.84}
        metalness={0.04}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.38, 0.38)}
        envMapIntensity={0.32}
      />
    </mesh>
  )
}
