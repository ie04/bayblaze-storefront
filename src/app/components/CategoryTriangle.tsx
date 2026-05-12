"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

type TriangleMeasurement = {
  contentHeight: number;
  contentWidth: number;
  diagonalGap: number;
  minSide: number;
  offsetX: number;
  offsetY: number;
};

type CategoryTriangleProps = {
  className?: string;
  subtitle: string;
  subtitleClassName?: string;
  title: string;
  titleClassName?: string;
};

export function getFittingCategoryTriangleSide({
  contentHeight,
  contentWidth,
  diagonalGap,
  minSide,
  offsetX,
  offsetY,
}: TriangleMeasurement) {
  return Math.ceil(
    Math.max(
      minSide,
      offsetX + offsetY + contentWidth + contentHeight + diagonalGap,
    ),
  );
}

function toPixels(value: string) {
  const pixels = Number.parseFloat(value);

  return Number.isFinite(pixels) ? pixels : 0;
}

export default function CategoryTriangle({
  className,
  subtitle,
  subtitleClassName,
  title,
  titleClassName,
}: CategoryTriangleProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;

    if (!root || !content) {
      return undefined;
    }

    let isMounted = true;

    const measure = () => {
      if (!isMounted) {
        return;
      }

      const rootStyle = window.getComputedStyle(root);
      const contentRect = content.getBoundingClientRect();
      const nextSide = getFittingCategoryTriangleSide({
        contentHeight: contentRect.height,
        contentWidth: contentRect.width,
        diagonalGap: toPixels(
          rootStyle.getPropertyValue(
            "--bayblaze-category-triangle-diagonal-gap",
          ),
        ),
        minSide: toPixels(
          rootStyle.getPropertyValue("--bayblaze-category-triangle-min-size"),
        ),
        offsetX: content.offsetLeft,
        offsetY: content.offsetTop,
      });

      setSide((currentSide) =>
        currentSide === nextSide ? currentSide : nextSide,
      );
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(content);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [subtitle, title]);

  const style =
    side === null
      ? undefined
      : ({
          "--bayblaze-category-triangle-size": `${side}px`,
        } as CSSProperties);

  return (
    <div
      ref={rootRef}
      className={["bayblaze-category-triangle", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div aria-hidden="true" className="bayblaze-category-triangle-frame" />
      <div ref={contentRef} className="bayblaze-category-triangle-content">
        <h3 className={titleClassName}>{title}</h3>
        <p className={subtitleClassName}>{subtitle}</p>
      </div>
    </div>
  );
}
