import { memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

const HOLE_POSITIONS: [number, number, number][] = [
  [-0.95, 0.25, 0.5],
  [-0.55, -0.05, 0.56],
  [-0.1, 0.2, 0.58],
  [0.35, -0.1, 0.56],
  [0.75, 0.2, 0.5],
  [1.05, -0.1, 0.44],
]

const OcarinaModel = memo(function OcarinaModel({ holes }: { holes: boolean[] }) {
  return (
    <group rotation={[0.12, -0.2, -0.08]}>
      <mesh scale={[1.75, 0.72, 0.62]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#d7d2c8" roughness={0.5} metalness={0.08} />
      </mesh>

      <mesh position={[-2.05, 0.02, -0.02]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.46, 1.65, 32]} />
        <meshStandardMaterial color="#c8c1b5" roughness={0.55} metalness={0.05} />
      </mesh>

      {HOLE_POSITIONS.map((position, index) => {
        const closed = Boolean(holes[index])
        return (
          <mesh key={index} position={position} scale={closed ? 1.12 : 1}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 24]} />
            <meshStandardMaterial
              color={closed ? '#ff4f9a' : '#111111'}
              emissive={closed ? '#6b1238' : '#000000'}
              emissiveIntensity={closed ? 1.4 : 0}
              roughness={0.35}
            />
          </mesh>
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
    <div className="ocarina-canvas" aria-label="Ocarina 3D interactiva">
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        dpr={[1, 1.5]}
        frameloop="demand"
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 5, 4]} intensity={3} />
        <pointLight position={[-4, -2, 3]} intensity={2} />
        <OcarinaModel holes={holes} />
        <OrbitControls enablePan={false} minDistance={3.6} maxDistance={7} />
      </Canvas>
    </div>
  )
}, (previous, next) => sameHoles(previous.holes, next.holes))
