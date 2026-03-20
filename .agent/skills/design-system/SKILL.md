---
name: design-system
description: Руководство по дизайн-системе Loot Arena: иконки, цвета, типографика и компоненты.
---

# Design System — Loot Arena

Единый гайд по визуальному стилю и компонентам приложения.

## Иконки

### Библиотека: Phosphor Icons

**Установка:**
```bash
npm install @phosphor-icons/react
```

**Сайт:** https://phosphoricons.com/

### Стандартный импорт и использование

```tsx
import { 
    Bell, 
    Gift, 
    Fire, 
    Clock, 
    Check, 
    Lightning,
    UserPlus,
    Heart,
    Star,
    Lock,
    X,
    Info,
    QrCode,
    ShoppingBag,
    MapPin,
    ChatCircle,
    Wrench,
    SealCheck,
    CaretUp,
    CaretDown,
    ShareNetwork
} from '@phosphor-icons/react';

// Единый стиль иконок для всего приложения
const ICON_WEIGHT = "regular" as const;
```

### Стили иконок (weight)

| Weight | Описание | Когда использовать |
|--------|----------|-------------------|
| `thin` | Очень тонкие линии | Минималистичный дизайн |
| `light` | Тонкие линии | Элегантные интерфейсы |
| **`regular`** | Стандартные линии | **Основной стиль (по умолчанию)** |
| `bold` | Жирные линии | Акцентные элементы |
| `fill` | Заливка | Активные состояния, кнопки |
| `duotone` | Двухтоновый | Глубина и объём |

### Правила использования

1. **Обязательные пропсы:**
   ```tsx
   <Icon size={20} weight={ICON_WEIGHT} className="text-white" />
   ```

2. **Размеры (size):**
   - Маленькие (табы, чипы): `10-12`
   - Стандарт: `14-20`
   - Крупные (кнопки): `20-24`
   - Заголовки: `24-32`

3. **Для активных состояний:**
   ```tsx
   weight={isActive ? 'fill' : ICON_WEIGHT}
   ```

4. **Цвета через className:**
   ```tsx
   className="text-white/70"
   className="text-green-500"
   className={isFavorite ? 'text-red-500' : 'text-white/70'}
   ```

### Маппинг старых иконок → Phosphor

| Старая (icons.tsx) | Phosphor | Назначение |
|-------------------|----------|------------|
| `ZapFilledIcon` | `Lightning` | Активность, энергия |
| `BellIcon` | `Bell` | Уведомления, подписки |
| `GiftIcon` | `Gift` | Награды, лут |
| `FlameIcon` / `FireIcon` | `Fire` | Горящее, истекающее |
| `ClockIcon` | `Clock` | Время, расписание |
| `CheckIcon` | `Check` | Выполнено, галочка |
| `CloseIcon` | `X` | Закрыть |
| `HeartIcon` | `Heart` | Избранное |
| `StarIcon` | `Star` | Рейтинг, избранное |
| `LockIcon` | `Lock` | Заблокировано |
| `UserPlusIcon` | `UserPlus` | Регистрация, друзья |
| `InfoCircleIcon` | `Info` | Информация |
| `QrCodeIcon` | `QrCode` | QR-коды |
| `ShoppingBagIcon` | `ShoppingBag` | Покупки |
| `ShareIcon` | `ShareNetwork` | Поделиться |
| `LocationIcon` / `MapPinIcon` | `MapPin` | Геолокация |
| `ChatIcon` | `ChatCircle` | Чат, обратная связь |
| `AdminIcon` | `Wrench` | Администрирование |
| `VerifyIcon` | `SealCheck` | Верификация |
| `ChevronDownIcon` | `CaretDown` | Раскрыть |
| `ChevronUpIcon` | `CaretUp` | Свернуть |

## Цветовая палитра

### Основные цвета

```css
/* Бренд */
--ios-primary: #007AFF;
--ios-accent: #5856D6;

/* Статусы */
--success: #10B981;      /* Зелёный */
--warning: #F59E0B;      /* Жёлтый */
--error: #EF4444;        /* Красный */
--info: #3B82F6;         /* Синий */

/* Нейтральные */
--card-bg: #1C1C1E;
--separator: rgba(255,255,255,0.1);
```

### Использование цветов

```tsx
// Статусные теги
bg-yellow-500    // Активный
bg-green-500     // Можно забрать
bg-red-500       // Сгорает
bg-blue-500      // Скоро
bg-gray-600      // Завершён

// Прозрачность
text-white/70    // Вторичный текст
bg-white/10      // Фоны карточек
border-white/5   // Границы
```

## Компоненты

### FilterChip

```tsx
const FilterChip: React.FC<{ 
    label: string, 
    active: boolean, 
    onClick: () => void, 
    icon?: React.FC<any> 
}> = ({ label, active, onClick, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-[11px] font-bold 
            whitespace-nowrap transition-colors flex items-center gap-1.5 
            ${active 
                ? 'bg-white text-black' 
                : 'bg-[#1C1C1E] text-gray-400 border border-white/10'
            }`}
    >
        {Icon && <Icon size={12} weight={active ? 'fill' : ICON_WEIGHT} />}
        {label}
    </button>
);
```

### SettingsRow с иконкой

```tsx
<SettingsRow
    icon={MapPin}  // Передаём компонент Phosphor
    label="Город"
    value={user.city}
    isLink
    onClick={() => setShowModal(true)}
    color="text-green-500"
/>
```

## Миграция с кастомных иконок

1. **Удалить импорт** из `components/icons.tsx`
2. **Добавить импорт** из `@phosphor-icons/react`
3. **Заменить в JSX:**
   ```tsx
   // Было
   <ClockIcon className="w-4 h-4 text-white" />
   
   // Стало
   <Clock size={16} weight={ICON_WEIGHT} className="text-white" />
   ```

4. **Для иконок с filled:**
   ```tsx
   // Было  
   <HeartIcon filled={isFavorite} />
   
   // Стало
   <Heart weight={isFavorite ? 'fill' : ICON_WEIGHT} />
   ```
