import { memo, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'

const PRODUCTION_MODEL_URL = '/models/BM-OC-002.glb'
const MODEL_SCALE = 20
const MODEL_OFFSET_X = -1.8

// Positions come from hardware/ocarina-acoustic-v2/acoustic_design_v2.json.
// Blender exports meters; the web scene scales the physical 180 mm instrument by 20x.
const HOLES = [
  { id: 'H1', position: [-0.301622, 0.194594, 0.389190] as [number, number, number], radius: 0.03856 },
  { id: 'H2', position: [0.009730, -0.038918, 0.435892] as [number, number, number], radius: 0.04518 },
  { id: 'H3', position: [0.360000, 0.155676, 0.451460] as [number, number, number], radius: 0.03178 },
  { id: 'H4', position: [0.710270, -0.077838, 0.435892] as [number, number, number], radius: 0.05778 },
  { id: 'H5', position: [1.021622, 0.155676, 0.389190] as [number, number, number], radius: 0.06848 },
  { id: 'H6', position: [1.255136, -0.077838, 0.342486] as [number, number, number], radius: 0.08157 },
] as const

function useProductionModelAvailable() {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    void fetch(PRODUCTION_MODEL_URL, { method: 'HEAD', cache: 'no-store' })
      .then((response) => {
        const contentType = response.headers.get('content-type') ?? ''
        if (!cancelled) setAvailable(response.ok && !contentType.includes('text/html'))
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return available
}

function ProductionOcarinaBody() {
  const { scene } = useGLTF(PRODUCTION_MODEL_URL)

  return (
    <primitive
      object={scene}
      scale={MODEL_SCALE}
      position={[MODEL_OFFSET_X, 0, 0]}
      dispose={null}
    />
  )
}

function ProceduralOcarinaBody() {
  return (
    <>
      <mesh scale={[1.75, 0.72, 0.62]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#2457d6" roughness={0.28} metalness={0.16} />
      </mesh>

      <mesh position={[-2.05, 0.02, -0.02]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.46, 1.65, 40]} />
        <meshStandardMaterial color="#1d49be" roughness={0.3} metalness={0.14} />
      </mesh>
    </>
  )
}

function HoleOverlay({
  position,
  radius,
  closed,
}: {
  position: [number, number, number]
  radius: number
  closed: boolean
}) {
  const visualRadius = radius * (closed ? 1.25 : 1)

  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[visualRadius, visualRadius, 0.035, 32]} />
      <meshStandardMaterial
        color={closed ? '#f4c84a' : '#080b16'}
        emissive={closed ? '#7a5a08' : '#000000'}
        emissiveIntensity={closed ? 1.15 : 0}
        roughness={0.3}
      />
    </mesh>
  )
}

const OcarinaModel = memo(function OcarinaModel({
  holes,
  productionModelAvailable,
}: {
  holes: boolean[]
  productionModelAvailable: boolean
}) {
  return (
    <group rotation={[0.12, -0.2, -0.08]}>
      {productionModelAvailable ? <ProductionOcarinaBody /> : <ProceduralOcarinaBody />}

      {HOLES.map((hole, index) => (
        <HoleOverlay
          key={hole.id}
          position={hole.position}
          radius={hole.radius}
          closed={Boolean(holes[index])}
        />
      ))}
    </group>
  )
})

function sameHoles(left: boolean[], right: boolean[]) {
  return left.length === right.length && left.every((closed, index) => closed === right[index])
}

export const OcarinaScene = memo(function OcarinaScene({ holes }: { holes: boolean[] }) {
  const productionModelAvailable = useProductionModelAvailable()

  return (
    <div
      className="ocarina-canvas"
      aria-label={productionModelAvailable ? 'BM-OC-002 3D física interactiva' : 'BM-OC-002 3D procedural interactiva'}
      data-model-source={productionModelAvailable ? 'bm-oc-002-glb' : 'procedural-fallback'}
    >
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        dpr={[1, 1.5]}
        frameloop="demand"
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[3, 5, 4]} intensity={3.2} />
        <pointLight position={[-4, -2, 3]} intensity={2.2} />
        <pointLight position={[3, -1, 2]} intensity={1.1} />
        <OcarinaModel holes={holes} productionModelAvailable={productionModelAvailable} />
        <OrbitControls enablePan={false} minDistance={3.6} maxDistance={7} />
      </Canvas>
    </div>
  )
}, (previous, next) => sameHoles(previous.holes, next.holes))
