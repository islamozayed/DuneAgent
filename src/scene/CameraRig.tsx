import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import * as THREE from 'three'

gsap.registerPlugin(useGSAP)

export const FLY_SECONDS = 2.8

const LAND = new THREE.Vector3(3.2, 16.2, 100)
const LAND_LOOK = new THREE.Vector3(0, 20.2, -50)
/** Rise while holding the landing gaze — forward, slightly up — so dunes fall away and sky fills the frame. */
const RISE = new THREE.Vector3(1.6, 118, 62)
const RISE_LOOK = new THREE.Vector3(0, 128, -50)

/** One slow circuit in front of the ridge — ~80s, always starting at LAND. */
const ORBIT_SPEED = 0.078

function sampleOrbit(angle: number, position: THREE.Vector3, target: THREE.Vector3) {
  const swing = Math.sin(angle)
  const depth = Math.cos(angle)
  position.set(3.2 + swing * 34, 16.2 + Math.sin(angle * 0.65) * 1.45, 100 + depth * 18)
  target.set(swing * 22, 20.2 + Math.sin(angle * 0.5) * 2.6, -48 + depth * 14)
}

type Props = {
  flying: boolean
  fading?: boolean
}

export function CameraRig({ flying, fading = false }: Props) {
  const { camera } = useThree()
  const rest = useRef(LAND.clone())
  const look = useRef(LAND_LOOK.clone())
  const orbit = useRef(0)
  const bob = useRef(0)

  useGSAP(
    () => {
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(rest.current)
      gsap.killTweensOf(look.current)
      if (flying) {
        gsap.to(rest.current, {
          x: RISE.x,
          y: RISE.y,
          z: RISE.z,
          duration: FLY_SECONDS,
          ease: 'expo.inOut',
        })
        gsap.to(look.current, {
          x: RISE_LOOK.x,
          y: RISE_LOOK.y,
          z: RISE_LOOK.z,
          duration: FLY_SECONDS,
          ease: 'expo.inOut',
        })
        return
      }
      if (fading) {
        gsap.set(rest.current, { x: RISE.x, y: RISE.y, z: RISE.z })
        look.current.copy(RISE_LOOK)
        return
      }
      sampleOrbit(orbit.current, rest.current, look.current)
    },
    { dependencies: [flying, fading], revert: false },
  )

  useFrame((_, dt) => {
    bob.current += dt
    if (!flying && !fading) {
      orbit.current += dt * ORBIT_SPEED
      sampleOrbit(orbit.current, rest.current, look.current)
    }
    const hover = Math.sin(bob.current * 0.7) * (flying || fading ? 0.04 : 0.18)
    camera.position.set(rest.current.x, rest.current.y + hover, rest.current.z)
    camera.lookAt(look.current.x, look.current.y + hover, look.current.z)
  })

  return null
}
