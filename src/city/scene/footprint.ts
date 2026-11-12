// L'emprise au sol de tout ce qui est construit, lue dans la scène elle-même : murs, troncs, poteaux, bancs.
// Les passants s'en servent pour ne jamais traverser un mur, même si la ville change.
import * as THREE from 'three'
import { PLINTH } from '../store'

const CELL = 0.05
/** Tranche de hauteur qui gêne un passant : au-dessus du trottoir, sous la tête. Plus haut, c'est un auvent ou un feuillage. */
const LOW = 0.085
const HIGH = 0.26

export interface Footprint {
  /** Vrai si un obstacle se trouve à moins de r du point. */
  blocked: (x: number, z: number, r: number) => boolean
  /** Ajoute un obstacle rond : quelqu'un qui attend là, par exemple. */
  stamp: (x: number, z: number, r: number) => void
}

/** Ce qui n'est pas un obstacle : ce qui bouge, le ciel, le verre, les enseignes et les halos. */
function ignored(o: THREE.Object3D) {
  if (o.userData.mobile) return true
  const mesh = o as THREE.Mesh
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return materials.some((m) => !m || !m.depthWrite)
}

export function readFootprint(root: THREE.Object3D): Footprint {
  const W = Math.ceil((PLINTH.xMax - PLINTH.xMin) / CELL)
  const H = Math.ceil((PLINTH.zMax - PLINTH.zMin) / CELL)
  const grid = new Uint8Array(W * H)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const world = new THREE.Matrix4()
  const instance = new THREE.Matrix4()
  const mark = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3) => {
    if (Math.max(p.y, q.y, r.y) < LOW || Math.min(p.y, q.y, r.y) > HIGH) return
    const i0 = Math.max(0, Math.floor((Math.min(p.x, q.x, r.x) - PLINTH.xMin) / CELL))
    const i1 = Math.min(W - 1, Math.floor((Math.max(p.x, q.x, r.x) - PLINTH.xMin) / CELL))
    const j0 = Math.max(0, Math.floor((Math.min(p.z, q.z, r.z) - PLINTH.zMin) / CELL))
    const j1 = Math.min(H - 1, Math.floor((Math.max(p.z, q.z, r.z) - PLINTH.zMin) / CELL))
    if (i1 < i0 || j1 < j0) return
    const d = (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x)
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        // Un mur vertical se projette en segment : toute sa boîte compte
        if (Math.abs(d) > 1e-6) {
          const x = PLINTH.xMin + (i + 0.5) * CELL
          const z = PLINTH.zMin + (j + 0.5) * CELL
          const u = ((q.x - x) * (r.z - z) - (q.z - z) * (r.x - x)) / d
          const v = ((r.x - x) * (p.z - z) - (r.z - z) * (p.x - x)) / d
          const slack = (CELL * 1.5) / Math.sqrt(Math.abs(d))
          if (u < -slack || v < -slack || u + v > 1 + slack) continue
        }
        grid[j * W + i] = 1
      }
    }
  }
  root.updateMatrixWorld(true)
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.visible || ignored(mesh)) return
    const geometry = mesh.geometry
    const pos = geometry.attributes.position
    if (!pos) return
    const index = geometry.index
    const triangles = (index ? index.count : pos.count) / 3
    const inst = (mesh as THREE.InstancedMesh).isInstancedMesh ? (mesh as THREE.InstancedMesh) : null
    for (let k = 0; k < (inst ? inst.count : 1); k++) {
      world.copy(mesh.matrixWorld)
      if (inst) {
        inst.getMatrixAt(k, instance)
        world.multiply(instance)
      }
      for (let t = 0; t < triangles; t++) {
        const i = index ? index.getX(t * 3) : t * 3
        const j = index ? index.getX(t * 3 + 1) : t * 3 + 1
        const l = index ? index.getX(t * 3 + 2) : t * 3 + 2
        mark(a.fromBufferAttribute(pos, i).applyMatrix4(world), b.fromBufferAttribute(pos, j).applyMatrix4(world), c.fromBufferAttribute(pos, l).applyMatrix4(world))
      }
    }
  })
  return {
    blocked(x, z, r) {
      const i0 = Math.floor((x - r - PLINTH.xMin) / CELL)
      const i1 = Math.floor((x + r - PLINTH.xMin) / CELL)
      const j0 = Math.floor((z - r - PLINTH.zMin) / CELL)
      const j1 = Math.floor((z + r - PLINTH.zMin) / CELL)
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          // Hors du socle : le vide
          if (i < 0 || j < 0 || i >= W || j >= H) return true
          const cx = PLINTH.xMin + (i + 0.5) * CELL - x
          const cz = PLINTH.zMin + (j + 0.5) * CELL - z
          if (grid[j * W + i] && cx * cx + cz * cz <= (r + CELL * 0.71) ** 2) return true
        }
      }
      return false
    },
    stamp(x, z, r) {
      for (let i = Math.floor((x - r - PLINTH.xMin) / CELL); i <= Math.floor((x + r - PLINTH.xMin) / CELL); i++) {
        for (let j = Math.floor((z - r - PLINTH.zMin) / CELL); j <= Math.floor((z + r - PLINTH.zMin) / CELL); j++) {
          if (i < 0 || j < 0 || i >= W || j >= H) continue
          if (Math.hypot(PLINTH.xMin + (i + 0.5) * CELL - x, PLINTH.zMin + (j + 0.5) * CELL - z) <= r) grid[j * W + i] = 1
        }
      }
    },
  }
}
