"use client";

import Link from "next/link";
import {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Intent = {
  label: string;
  href: string;
  caption: string;
  cta: string;
};

const intents: Intent[] = [
  {
    label: "Vapes",
    href: "/shop?q=Vapes",
    caption: "Disposable favorites, new drops, and everyday flavors.",
    cta: "Shop Vapes",
  },
  {
    label: "Nicotine",
    href: "/shop?q=Nicotine",
    caption: "Nicotine essentials ready when the day asks for them.",
    cta: "Shop Nicotine",
  },
  {
    label: "Wraps",
    href: "/shop?q=Cones%20%26%20Wraps",
    caption: "Cones, wraps, and rolling staples for the next session.",
    cta: "Shop Wraps",
  },
  {
    label: "Accessories",
    href: "/shop?q=Smoking%20Accessories",
    caption: "Lighters, tools, and add-ons that keep the order complete.",
    cta: "Shop Accessories",
  },
  {
    label: "Deals",
    href: "/shop?q=Deals",
    caption: "Promos and sharp picks worth checking before checkout.",
    cta: "Shop Deals",
  },
  {
    label: "Fast Delivery",
    href: "/shop?availability=fast",
    caption: "Local smoke shop essentials available for fast Tampa delivery.",
    cta: "Shop Fast Delivery",
  },
];

const topAngle = -90;

export default function HomeIntentOrbit() {
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [radius, setRadius] = useState({ x: 94, y: 128 });
  const dragRef = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    startRotation: 0,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setIsReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    function updateRadius() {
      const width = window.innerWidth;

      if (width >= 768) {
        setRadius({ x: 230, y: 196 });
        return;
      }

      if (width <= 390) {
        setRadius({ x: 70, y: 128 });
        return;
      }

      setRadius({ x: 78, y: 132 });
    }

    updateRadius();
    window.addEventListener("resize", updateRadius);

    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  const activeIntent = intents[activeIndex];
  const orbitItems = useMemo(() => {
    return intents.map((intent, index) => {
      const angle = (360 / intents.length) * index + rotation + topAngle;
      const radians = (angle * Math.PI) / 180;

      return {
        angle,
        intent,
        index,
        x: `${(Math.cos(radians) * radius.x).toFixed(2)}px`,
        y: `${(Math.sin(radians) * radius.y).toFixed(2)}px`,
      };
    });
  }, [radius, rotation]);

  function updateActiveFromRotation(nextRotation: number) {
    const nextIndex = getNearestTopIntentIndex(nextRotation);
    setActiveIndex(nextIndex);
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (isReducedMotion) {
      return;
    }

    event.preventDefault();
    setRotation((currentRotation) => {
      const nextRotation = currentRotation + event.deltaY * 0.18;
      updateActiveFromRotation(nextRotation);
      return nextRotation;
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isReducedMotion) {
      return;
    }

    dragRef.current = {
      dragging: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: rotation,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (isReducedMotion || !dragRef.current.dragging) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    const dragDistance = Math.hypot(deltaX, deltaY);

    if (dragDistance > 6) {
      dragRef.current.moved = true;
    }

    const nextRotation = dragRef.current.startRotation + deltaX * 0.85;
    setRotation(nextRotation);
    updateActiveFromRotation(nextRotation);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging) {
      return;
    }

    dragRef.current.dragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleIntentClick(index: number, event: ReactMouseEvent) {
    setActiveIndex(index);

    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
    }
  }

  return (
    <div className="bayblaze-intent-orbit-shell">
      <div
        className="bayblaze-intent-orbit"
        data-reduced-motion={isReducedMotion ? "true" : "false"}
        aria-label="Shop by intent"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div className="bayblaze-intent-orbit-track" aria-hidden="true" />

        <div className="bayblaze-intent-orbit-center">
          <Link href="/shop" className="bayblaze-intent-shop-all">
            Shop All
          </Link>
        </div>

        {orbitItems.map(({ intent, index, x, y }) => {
          const isActive = index === activeIndex;

          return (
            <Link
              key={intent.label}
              href={intent.href}
              aria-label={`${intent.label}: ${intent.caption}`}
              className="bayblaze-intent-card"
              data-active={isActive ? "true" : "false"}
              style={{
                left: `calc(50% + ${x})`,
                top: `calc(50% + ${y})`,
              } as CSSProperties}
              onClick={(event) => handleIntentClick(index, event)}
              onFocus={() => setActiveIndex(index)}
            >
              <span>{intent.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="bayblaze-intent-caption" aria-live="polite">
        <p>{activeIntent.caption}</p>
        <Link href={activeIntent.href}>{activeIntent.cta}</Link>
      </div>
    </div>
  );
}

function getNearestTopIntentIndex(rotation: number) {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  intents.forEach((_, index) => {
    // Compare each card's current orbit angle against the top position.
    const angle = (360 / intents.length) * index + rotation;
    const distance = Math.abs(normalizeAngle(angle));

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function normalizeAngle(angle: number) {
  return ((((angle % 360) + 540) % 360) - 180);
}
