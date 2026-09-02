import { memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

const HOLES = [
  { id: 'H1', position: [-0.95, 0.25, 0.5] as [number, number, number], radius: 0.0495 },
  { id: 'H2', position: [-0.55, -0.05, 0.56] as [number, number, number], radius: 0.0580 },
  { id: 'H3', position: [-0.10, 0.20, 0.58] as [number, number, number], radius: 0.0408 },
  { id: 'H4', position: [0.35, -0.10, 0.56] as [number, number, number], radius: 0.0742 },
  { id: 'H5', position: [0.75, 0.20, 0.50] as [number, number, number], radius: 0.0880 },
  { id: 'H6', position: [1.05, -0.10, 0.44] as [number, number, number], radius: 0.1048 },
] as const

const OcarinaModel = memo(function OcarinaModel({ holes }: { holes: boolean[] }) {
  return (
    <group rotation={[0.12, -0.2, -0.08]}>
      <mesh scale={[1.75, 0.72, 0.62]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#2457d6"
          roughness={0.28}
          metalness={0.16}
        />
      </mesh>

      <mesh position={[-2.05, 0.02, -0.02]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.46, 1.65, 40]} />
        <meshStandardMaterial
          color="#1d49be"
          roughness={0.3}
          metalness={0.14}
        />
      </mesh>

      {HOLES.map((hole, index) => {
        const closed = Boolean(holes[index])
        const visualRadius = hole.radius * (closed ? 1.18 : 1)

        return (
          <group key={hole.id} position={hole.position}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[visualRadius, visualRadius, 0.055, 32]} />
              <meshStandardMaterial
                color={closed ? '#f4c84a' : '#080b16'}
                emissive={closed ? '#7a5a08' : '#000000'}
                emissiveIntensity={closed ? 1.15 : 0}
                roughness={0.3}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
})

function sameHoles(left: boolean[], right: boolean[]) {
  return left.length === right.length && left.every((closed, index) => closed === right[index])
}

export const OcarinaScene = memo(function OcarinaScene({ holes }: { holes: boolean[] }) {
  return (
    <div className="ocarina-canvas" aria-label="BM-OC-002 3D interactiva">
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        dpr={[1, 1.5]}
        frameloop="demand"
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[3, 5, 4]} intensity={3.2} />
        <pointLight position={[-4, -2, 3]} intensity={2.2} />
        <pointLight position={[3, -1, 2]} intensity={1.1} />
        <OcarinaModel holes={holes} />
        <OrbitControls enablePan={false} minDistance={3.6} maxDistance={7} />
      </Canvas>
    </div>
  )
}, (previous, next) => sameHoles(previous.holes, next.holes))
