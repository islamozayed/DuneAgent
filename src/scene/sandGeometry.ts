import * as THREE from 'three'

export function makeSandNormal(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
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
  tex.repeat.set(24, 24)
  tex.anisotropy = 8
  tex.colorSpace = THREE.NoColorSpace
  return tex
}

export function buildSandGeometry(
  width: number,
  depth: number,
  segsX: number,
  segsZ: number,
  heightAt: (x: number, z: number) => number,
  zCenter = 0,
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segsX, segsZ)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const sand = new THREE.Color('#ffffff')
  const shade = new THREE.Color('#6a5340')

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i)
    const z = pos.getZ(i) + zCenter
    pos.setY(i, heightAt(x, z))
    pos.setZ(i, z)
  }
  geo.computeVertexNormals()
  const nrm = geo.attributes.normal
  for (let i = 0; i < pos.count; i += 1) {
    const nx = nrm.getX(i)
    const ny = nrm.getY(i)
    const slip = THREE.MathUtils.clamp((0.52 - ny) * 1.8 + Math.max(0, nx) * 1.15, 0, 1)
    const c = sand.clone().lerp(shade, slip)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeBoundingSphere()
  return geo
}
