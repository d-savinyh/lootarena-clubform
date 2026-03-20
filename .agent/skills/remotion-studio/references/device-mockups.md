# Мокапы устройств

CSS и 3D подходы к демонстрации ERP-интерфейса на реалистичных устройствах.

## Способ 1: CSS-мокап (лёгкий, без 3D)

### iPhone-рамка

```tsx
export const IPhoneMockup: React.FC<{
  screenshot: string;
  rotation?: number;
  scale?: number;
}> = ({ screenshot, rotation = 0, scale = 1 }) => {
  return (
    <div
      style={{
        transform: `perspective(1500px) rotateY(${rotation}deg) scale(${scale})`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Корпус iPhone */}
      <div
        style={{
          width: 375,
          height: 812,
          borderRadius: 44,
          border: "8px solid #1a1a1a",
          backgroundColor: "#000",
          overflow: "hidden",
          boxShadow: "0 25px 70px rgba(0, 255, 136, 0.15), 0 10px 30px rgba(0,0,0,0.5)",
          position: "relative",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 170,
            height: 30,
            backgroundColor: "#1a1a1a",
            borderRadius: "0 0 20px 20px",
            zIndex: 10,
          }}
        />

        {/* Скриншот */}
        <img
          src={staticFile(screenshot)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    </div>
  );
};
```

### MacBook-рамка

```tsx
export const MacBookMockup: React.FC<{
  screenshot: string;
  rotation?: number;
}> = ({ screenshot, rotation = 0 }) => {
  return (
    <div
      style={{
        transform: `perspective(2000px) rotateY(${rotation}deg) rotateX(5deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Экран */}
      <div
        style={{
          width: 960,
          height: 600,
          borderRadius: "12px 12px 0 0",
          border: "16px solid #1a1a1a",
          borderBottom: "none",
          backgroundColor: "#000",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <img src={staticFile(screenshot)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Днище/клавиатура */}
      <div
        style={{
          width: 1060,
          height: 14,
          backgroundColor: "#2a2a2a",
          borderRadius: "0 0 8px 8px",
          margin: "0 auto",
          transform: "translateX(-50px)",
        }}
      />
    </div>
  );
};
```

## Способ 2: 3D мокап (React Three Fiber)

Для максимальной реалистичности — загрузка GLB-модели.

### Где взять 3D модели устройств

- **Sketchfab** (бесплатные): поиск "iPhone mockup GLB", "MacBook GLB"
- **poly.pizza** — бесплатные low-poly модели
- Сохранять в `public/models/`

### 3D iPhone с текстурой ERP

```tsx
import { ThreeCanvas } from "@remotion/three";
import { useGLTF, useTexture, Float, Environment, ContactShadows } from "@react-three/drei";
import { staticFile } from "remotion";

const PhoneWithScreen: React.FC<{ rotY: number }> = ({ rotY }) => {
  const { scene } = useGLTF(staticFile("models/iphone.glb"));
  const screenTexture = useTexture(staticFile("images/erp-screenshot.png"));

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group rotation={[0.1, rotY, 0]}>
        <primitive object={scene} scale={3} />
        {/* Натягиваем скриншот на экран (подбирай позицию под модель) */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.8, 3.8]} />
          <meshBasicMaterial map={screenTexture} />
        </mesh>
      </group>
    </Float>
  );
};

export const Phone3DScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const rotY = interpolate(frame, [0, 150], [-0.3, 0.3]);

  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 5], fov: 45 }}>
      <Environment preset="studio" />
      <ContactShadows position={[0, -2, 0]} opacity={0.4} blur={2.5} />
      <PhoneWithScreen rotY={rotY} />
    </ThreeCanvas>
  );
};
```

## Способ 3: Perspective-поворот со свечением (CSS)

Из Knowledge Item: проверенный паттерн для шоурилов.

```tsx
export const ScreenshotShowcase: React.FC<{
  screenshot: string;
  frame: number;
  rotateY?: number;
}> = ({ screenshot, frame, rotateY = 5 }) => {
  const glowIntensity = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.2, 0.6]);

  return (
    <div
      style={{
        perspective: 1500,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `rotateY(${rotateY}deg)`,
          borderRadius: 16,
          overflow: "hidden",
          border: `2px solid rgba(0, 255, 136, ${glowIntensity})`,
          boxShadow: `
            0 0 30px rgba(0, 255, 136, ${glowIntensity * 0.5}),
            0 25px 50px rgba(0, 0, 0, 0.5)
          `,
        }}
      >
        <img
          src={staticFile(screenshot)}
          style={{ width: 1100, display: "block" }}
        />
      </div>
    </div>
  );
};
```

## Аннотации поверх скриншотов

```tsx
export const AnnotationPill: React.FC<{
  text: string;
  x: number;
  y: number;
  opacity: number;
}> = ({ text, x, y, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      padding: "12px 20px",
      background: "linear-gradient(135deg, #0f0f15ee, #1a1a25ee)",
      backdropFilter: "blur(20px)",
      borderRadius: 12,
      border: "1px solid rgba(0, 255, 136, 0.3)",
      color: "#fff",
      fontSize: 18,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);
```
