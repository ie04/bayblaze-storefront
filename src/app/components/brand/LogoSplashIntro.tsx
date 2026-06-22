"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import styles from "./LogoSplashIntro.module.css";

const INTRO_DURATION_MS = 3000;

export default function LogoSplashIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const introTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(introTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.intro} aria-hidden="true">
      <div className={styles.stage}>
        <div className={styles.ball} />
        <div className={styles.splash} />
        <div className={styles.logoWrap}>
          <Image
            className={styles.logo}
            src="/icons/bayblaze-logo-source.png"
            alt=""
            width={1024}
            height={1024}
            priority
          />
        </div>
      </div>
    </div>
  );
}
