"use client";
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Initialize cursor position to center of viewport
    gsap.set(cursor, {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    const onMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      requestAnimationFrame(() => {
        gsap.to(cursor, {
          x: clientX,
          y: clientY,
        });
      });
    };

    const handleElementInteraction = (scale: number) => {
      if (!cursor) return;
      gsap.to(cursor, {
        scale,
        duration:1.1
      });
    };

    // Show cursor only when mouse moves
    const showCursor = () => {
      setIsVisible(true);
    };

    // Hide cursor when mouse leaves window
    const hideCursor = () => {
      setIsVisible(false);
    };

    // Use MutationObserver to watch for new elements
    const observer = new MutationObserver(() => {
      attachEventListeners();
    });

    const attachEventListeners = () => {
      const smallZoom = document.querySelectorAll(".smallZoom");
      const bigZoom = document.querySelectorAll(".bigZoom");

      smallZoom.forEach(element => {
        element.addEventListener("mouseenter", () => handleElementInteraction(4));
        element.addEventListener("mouseleave", () => handleElementInteraction(1));
      });

      bigZoom.forEach(element => {
        element.addEventListener("mouseenter", () => handleElementInteraction(6));
        element.addEventListener("mouseleave", () => handleElementInteraction(1));
      });
    };

    // Initial attachment of event listeners
    attachEventListeners();

    // Start observing the document for added/removed nodes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Global event listeners
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousemove", showCursor);
    document.addEventListener("mouseenter", showCursor);
    document.addEventListener("mouseleave", hideCursor);

    return () => {
      observer.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousemove", showCursor);
      document.removeEventListener("mouseenter", showCursor);
      document.removeEventListener("mouseleave", hideCursor);
    };
  }, []);

  return (
    <div
      id="custom-cursor"
      ref={cursorRef}
      className={`fixed top-0 left-0 size-[20px] rounded-full pointer-events-none z-[9999999] mix-blend-difference p-2 sm:flex! justify-center items-center bg-white transition-opacity hidden ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    ></div>
  );
};

export default Cursor;