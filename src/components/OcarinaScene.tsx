import { Canvas } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Group } from 'three'
import { useEffect, useState } from 'react'
import type { MaterialPreset } from '../instrument'

const BM_OC_002_MODEL_URL = '/models/BM-OC-002.glb'
const BM_OC_002_MODEL_SCALE = 20
const BM_OC_002_MODEL_OFFSET: [number, number, number] = [-1.8, 0, 0]

// Derived from hardware/ocarina-acoustic-v2/acoustic_design_v2.json.
// The positions match the 180 mm physical prototype after the Blender export scale.
const BM_OC_002_HOLES = [
  { id: 'H1', position: [-0.301622, 0.194594, 0.389190] as [number, number, number], visualRadius: 0.12 },
  { id: 'H2', position: [0.009730, -0.038918, 0.435892] as [number, number, number], visualRadius: 0.13 },
  { id: 'H3', position: [0.360000, 0.155676, 0.451460] as [number, number, number], visualRadius: 0.11 },
  { id: 'H4', position: [0.710270, -0.077838, 0.435892] as [number, number, number], visualRadius: 0.15 },
  { id: 'H5', position: [1.021622, 0.155676, 0.389190] as [number, number, number], visualRadius: 0.17 },
  { id: 'H6', position: [1.255136, -0.077838, 0.342486] as [number, number, number], visualRadius: 0.19 },
] as const

function useBmOc002Model() {
  const [scene, setScene] = useState<Group | null>(null)

  useEffect(() => {
    let active = true
    const loader = new GLTFLoader()

    loader.load(
      BM_OC_002_MODEL_URL,
      (gltf) => {
        if (active) setScene(gltf.scene)
      },
      undefined,
      () => {
        if (active) setScene(null)
      },
    )

    return () => {
      active = false
    }
  }, [])

  return scene
}

export function OcarinaScene({
  holes,
  breath,
  material,
}: {
  holes: boolean[]
  breath: number
  material: MaterialPreset
}) {
  const productionScene = useBmOc002Model()
  const airflowOpacity = 0.08 + breath * 0.5

  return (
    <>
    <p role="status" className="model-status">{productionScene ? "Modelo BM-OC-002 cargado" : "Vista provisional · modelo BM-OC-002 no disponible"}</p>
    <Canvas camera={{ position: [0.4, 0.4, 10], fov: 42 }}>
      <ambientLight intensity={1.6} />
      <directionalLight position={[4, 5, 6]} intensity={3} />
      <pointLight position={[-4, -1, 3]} intensity={18} color="#20ff7a" />
      <group rotation={[-0.18, -0.18, 0.04]}>
        {productionScene ? (
          <primitive
            object={productionScene}
            scale={BM_OC_002_MODEL_SCALE}
            position={BM_OC_002_MODEL_OFFSET}
          />
        ) : (
          <>
            <mesh scale={[2.2, 1.25, 0.72]}>
              <sphereGeometry args={[1, 64, 32]} />
              <meshStandardMaterial
                color={material.bodyColor}
                metalness={material.metalness}
                roughness={material.roughness}
              />
            </mesh>
            <mesh position={[2.2, 0.08, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.55, 0.55, 1.4]}>
              <coneGeometry args={[0.55, 1.8, 32]} />
              <meshStandardMaterial
                color={material.mouthColor}
                metalness={material.metalness}
                roughness={material.roughness}
              />
            </mesh>
          </>
        )}

        {breath > 0.015 && (
          <mesh position={[1.55, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.7 + breath * 0.5]}>
            <cylinderGeometry args={[0.08, 0.22, 2.4, 20]} />
            <meshStandardMaterial
              color="#70ffb0"
              emissive="#20ff7a"
              emissiveIntensity={1.5 + breath * 4}
              transparent
              opacity={airflowOpacity}
              roughness={0.1}
            />
          </mesh>
        )}

        {BM_OC_002_HOLES.map((hole, index) => (
          <mesh key={hole.id} position={hole.position} scale={holes[index] ? 0.82 : 1}>
            <sphereGeometry args={[hole.visualRadius, 32, 16]} />
            <meshStandardMaterial
              color={holes[index] ? '#06110b' : '#50ffa0'}
              emissive={holes[index] ? '#000000' : '#0b6b38'}
              emissiveIntensity={holes[index] ? 0 : 1.4}
              roughness={0.38}
            />
          </mesh>
        ))}
      </group>
    </Canvas>
    </>
  )
}
