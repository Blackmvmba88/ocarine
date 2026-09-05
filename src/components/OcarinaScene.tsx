import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { HoleState } from '../music/fingerings'

function Hole({ position, closed }: { position: [number, number, number]; closed: boolean }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.12, 0.12, 0.035, 32]} />
      <meshStandardMaterial
        color={closed ? '#78ff9c' : '#080a0d'}
        emissive={closed ? '#2ddc65' : '#000000'}
        emissiveIntensity={closed ? 0.8 : 0}
        roughness={0.45}
      />
    </mesh>
  )
}

function Ocarina({ holes }: { holes: HoleState }) {
  return (
    <group rotation={[-0.22, 0.2, -0.08]}>
      <mesh scale={[1.65, 0.58, 1.05]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#d8dde8" metalness={0.12} roughness={0.34} />
      </mesh>

      <mesh position={[1.55, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.75, 0.28, 0.34]}>
        <cylinderGeometry args={[0.62, 0.88, 1.5, 32]} />
        <meshStandardMaterial color="#c8ceda" metalness={0.08} roughness={0.38} />
      </mesh>

      <Hole position={[-0.62, 0.55, 0.44]} closed={holes[0]} />
      <Hole position={[-0.18, 0.62, 0.34]} closed={holes[1]} />
      <Hole position={[0.28, 0.60, 0.26]} closed={holes[2]} />
      <Hole position={[0.66, 0.48, 0.12]} closed={holes[3]} />
    </group>
  )
}

export function OcarinaScene({ holes }: { holes: HoleState }) {
  return (
    <Canvas camera={{ position: [0, 2.5, 5.4], fov: 38 }}>
      <color attach="background" args={['#090b10']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[4, 6, 4]} intensity={4.2} />
      <directionalLight position={[-4, 1, -3]} intensity={1.2} />
      <Ocarina holes={holes} />
      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={8} />
    </Canvas>
  )
}
