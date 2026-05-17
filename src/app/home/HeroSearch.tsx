"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./HeroSearch.module.css";

const searchPrompts = [
  "Search for RAZ...",
  "Search for Lost Mary...",
  "Search for ZYNs...",
  "Search for vapes...",
  "Search for wraps...",
  "Search for cones...",
  "Search for lighters...",
  "Search for Geek Bar...",
  "Search for rolling papers...",
  "Search for grinders...",
];

const ribbonTaglines = [
  "Tampa’s 2-Hour Headshop",
  "Skip The Shop. We Pull Up.",
  "Tap. Order. Blaze.",
  "Popular Picks Delivered Today",
];

const ribbonRepeatCount = 6;

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedPrompt, setTypedPrompt] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const prompt = searchPrompts[promptIndex];
    const isComplete = typedPrompt === prompt;
    const isEmpty = typedPrompt.length === 0;
    const delay =
      isComplete && !isDeleting
        ? 1350
        : isEmpty && isDeleting
          ? 260
          : isDeleting
            ? 42
            : 72;

    const timeout = window.setTimeout(() => {
      if (isComplete && !isDeleting) {
        setIsDeleting(true);
        return;
      }

      if (isEmpty && isDeleting) {
        setIsDeleting(false);
        setPromptIndex(
          (currentIndex) => (currentIndex + 1) % searchPrompts.length,
        );
        return;
      }

      const nextLength = typedPrompt.length + (isDeleting ? -1 : 1);
      setTypedPrompt(prompt.slice(0, nextLength));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [isDeleting, promptIndex, typedPrompt]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const query = new FormData(event.currentTarget).get("q")?.toString().trim();

    if (!query) {
      event.preventDefault();
    }
  }

  return (
    <div className={styles.searchStack}>
      <form
        action="/shop"
        className={styles.search}
        method="get"
        role="search"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="hero-product-search">
          Search products
        </label>

        <button
          type="submit"
          className={styles.submit}
          aria-label="Search"
        >
          <SearchIcon />
        </button>

        <div className={styles.field}>
          <input
            id="hero-product-search"
            name="q"
            type="search"
            autoComplete="off"
            className={styles.input}
            value={query}
            onBlur={() => setIsFocused(false)}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onFocus={() => setIsFocused(true)}
          />

          <span
            aria-hidden="true"
            className={`${styles.placeholder} ${
              query || isFocused
                ? styles.placeholderHidden
                : styles.placeholderVisible
            }`}
          >
            {typedPrompt}
            <span className={styles.caret} />
          </span>
        </div>
      </form>

      <div
        className={styles.ribbon}
        aria-label={ribbonTaglines.join(" · ")}
      >
        <div className={styles.ribbonTrack} aria-hidden="true">
          {Array.from({ length: ribbonRepeatCount }).map((_, index) => (
            <RibbonGroup key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RibbonGroup() {
  return (
    <div className={styles.ribbonGroup}>
      {ribbonTaglines.map((tagline) => (
        <span key={tagline} className={styles.ribbonItem}>
          {tagline}
        </span>
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}
