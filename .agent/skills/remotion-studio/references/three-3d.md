# React Three Fiber в Remotion

Интеграция 3D-сцен через `@remotion/three` + `@react-three/fiber` + `@react-three/drei`.

## Подключение

```tsx
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Float, Environment, ContactShadows, MeshTransmissionMaterial } from "@react-three/drei";
```

## Базовая 3D-сцена в Remotion

```tsx
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";

export const My3DScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const rotationY = interpolate(frame, [0, 150], [0, Math.PI * 2]);
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, 5], fov: 50 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <mesh rotation={[0, rotationY, 0]} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#00ff88" metalness={0.8} roughness={0.2} />
      </mesh>
    </ThreeCanvas>
  );
};
```

## Загрузка GLB/GLTF моделей

```tsx
import { useGLTF } from "@react-three/drei";
import { staticFile } from "remotion";

const PhoneModel: React.FC<{ rotation: number }> = ({ rotation }) => {
  const { scene } = useGLTF(staticFile("models/iphone.glb"));

  return (
    <primitive
      object={scene}
      rotation={[0, rotation, 0]}
      scale={2}
    />
  );
};

// Preload для быстрого рендера
useGLTF.preload(staticFile("models/iphone.glb"));
```

## Полезные drei-компоненты

### Float — плавающие объекты
```tsx
<Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
  <PhoneModel rotation={rotY} />
</Float>
```

### Environment — HDRI освещение
```tsx
<Environment preset="city" /> {/* studio, sunset, dawn, night, warehouse, forest, apartment, city */}
```

### ContactShadows — мягкие тени
```tsx
<ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} />
```

### Text3D — 3D текст
```tsx
import { Text3D, Center } from "@react-three/drei";

<Center>
  <Text3D
    font={staticFile("fonts/Inter_Bold.json")}
    size={0.5}
    height={0.1}
    bevelEnabled
    bevelSize={0.02}
  >
    LOOT ARENA
    <meshStandardMaterial color="#00ff88" metalness={0.9} roughness={0.1} />
  </Text3D>
</Center>
```

## Spring-анимация камеры

```tsx
import { useThree } from "@react-three/fiber";

const CameraAnimation: React.FC = () => {
  const { camera } = useThree();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = spring({ frame, fps, from: 8, to: 4, config: { damping: 20 } });
  const rotY = interpolate(frame, [0, 150], [0, Math.PI / 4]);

  camera.position.set(
    Math.sin(rotY) * zoom,
    2,
    Math.cos(rotY) * zoom
  );
  camera.lookAt(0, 0, 0);

  return null;
};
```

## Текстура на экране устройства (скриншот ERP)

```tsx
import { useTexture } from "@react-three/drei";
import { staticFile } from "remotion";

const ScreenTexture: React.FC = () => {
  const texture = useTexture(staticFile("images/erp-dashboard.png"));

  return (
    <mesh position={[0, 0.5, 0.01]}>
      <planeGeometry args={[2.2, 4.5]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
};
```

## Советы по производительности

- Используй `--gl=angle` при рендере для стабильного WebGL
- Уменьши полигоны моделей (< 50k для быстрого рендера)
- `Environment` с `files` вместо `preset` для офлайн-рендера
- Preload все модели и текстуры через `useGLTF.preload()` / `useTexture.preload()`
