"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Box, Sphere } from "@react-three/drei";
import type { OrderData } from "@/types/orders";
import type { Group } from "three";

interface AIChefProps {
  orders: OrderData[];
  previousOrders: OrderData[];
  isTestSpeaking?: boolean;
}

// Fallback simple chef representation with animation
function SimpleChef({ isSpeaking }: { isSpeaking: boolean }) {
  const groupRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    let rotation = 0;
    const animate = () => {
      if (groupRef.current) {
        rotation += 0.02;

        // Gentle floating animation
        groupRef.current.position.y = Math.sin(rotation * 0.5) * 0.15 - 0.5;

        // Subtle body rotation when speaking
        if (isSpeaking) {
          groupRef.current.rotation.y = Math.sin(rotation * 2) * 0.15;
        } else {
          groupRef.current.rotation.y = Math.sin(rotation * 0.3) * 0.05;
        }
      }

      // Animated arms - more active when speaking
      if (leftArmRef.current) {
        if (isSpeaking) {
          leftArmRef.current.rotation.z = 0.3 + Math.sin(rotation * 3) * 0.4;
          leftArmRef.current.rotation.x = Math.sin(rotation * 2.5) * 0.3;
        } else {
          leftArmRef.current.rotation.z = 0.3 + Math.sin(rotation) * 0.1;
        }
      }

      if (rightArmRef.current) {
        if (isSpeaking) {
          rightArmRef.current.rotation.z =
            -0.3 + Math.sin(rotation * 3 + Math.PI) * 0.4;
          rightArmRef.current.rotation.x =
            Math.sin(rotation * 2.5 + Math.PI) * 0.3;
        } else {
          rightArmRef.current.rotation.z =
            -0.3 + Math.sin(rotation + Math.PI) * 0.1;
        }
      }

      // Animated legs - walking motion when speaking
      if (leftLegRef.current) {
        if (isSpeaking) {
          leftLegRef.current.rotation.x = Math.sin(rotation * 2) * 0.2;
        } else {
          leftLegRef.current.rotation.x = 0;
        }
      }

      if (rightLegRef.current) {
        if (isSpeaking) {
          rightLegRef.current.rotation.x =
            Math.sin(rotation * 2 + Math.PI) * 0.2;
        } else {
          rightLegRef.current.rotation.x = 0;
        }
      }

      // Head nod when speaking
      if (headRef.current) {
        if (isSpeaking) {
          headRef.current.rotation.x = Math.sin(rotation * 4) * 0.1;
          headRef.current.position.y = 1.6 + Math.sin(rotation * 6) * 0.05;
        } else {
          headRef.current.rotation.x = 0;
          headRef.current.position.y = 1.6;
        }
      }

      requestAnimationFrame(animate);
    };
    animate();
  }, [isSpeaking]);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} scale={1.8}>
      {/* Head with animation */}
      <group ref={headRef} position={[0, 1.6, 0]}>
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#fdbcb4" roughness={0.8} />
        </Sphere>
        {/* Eyes - positioned lower to look down */}
        <Sphere args={[0.08, 16, 16]} position={[-0.15, 0.0, 0.45]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        <Sphere args={[0.08, 16, 16]} position={[0.15, 0.0, 0.45]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        {/* Smile */}
        <Box
          args={[0.25, 0.05, 0.05]}
          position={[0, -0.2, 0.48]}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial color="#ff6b6b" />
        </Box>
      </group>

      {/* Chef Hat - Taller and more prominent */}
      <group position={[0, 2.3, 0]}>
        <Sphere args={[0.35, 32, 16]} scale={[1, 0.5, 1]}>
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </Sphere>
        <Box args={[0.65, 0.5, 0.65]} position={[0, 0.35, 0]}>
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </Box>
      </group>

      {/* Body - Chef coat */}
      <Box args={[1, 1.4, 0.6]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </Box>

      {/* Coat buttons */}
      <Sphere args={[0.08, 16, 16]} position={[0, 0.8, 0.31]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.5} />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0, 0.4, 0.31]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.5} />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0, 0.0, 0.31]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.5} />
      </Sphere>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.65, 0.5, 0]}>
        <Box args={[0.25, 1, 0.25]}>
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </Box>
        <Sphere args={[0.15, 16, 16]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#fdbcb4" roughness={0.8} />
        </Sphere>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.65, 0.5, 0]}>
        <Box args={[0.25, 1, 0.25]}>
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </Box>
        <Sphere args={[0.15, 16, 16]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#fdbcb4" roughness={0.8} />
        </Sphere>
        {/* Carrot in hand */}
        <group position={[0, -0.65, 0]} rotation={[0, 0, Math.PI / 6]}>
          {/* Carrot body */}
          <mesh>
            <coneGeometry args={[0.08, 0.4, 8]} />
            <meshStandardMaterial color="#ff8c00" roughness={0.6} />
          </mesh>
          {/* Carrot leaves */}
          <group position={[0, 0.2, 0]}>
            <Box
              args={[0.03, 0.15, 0.03]}
              position={[-0.02, 0.075, 0]}
              rotation={[0, 0, -0.3]}
            >
              <meshStandardMaterial color="#228b22" roughness={0.5} />
            </Box>
            <Box
              args={[0.03, 0.15, 0.03]}
              position={[0.02, 0.075, 0]}
              rotation={[0, 0, 0.3]}
            >
              <meshStandardMaterial color="#228b22" roughness={0.5} />
            </Box>
            <Box
              args={[0.03, 0.12, 0.03]}
              position={[0, 0.08, 0]}
              rotation={[0, 0, 0]}
            >
              <meshStandardMaterial color="#228b22" roughness={0.5} />
            </Box>
          </group>
        </group>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.25, -0.7, 0]}>
        <Box args={[0.3, 1, 0.3]}>
          <meshStandardMaterial color="#2c3e50" roughness={0.6} />
        </Box>
        <Box args={[0.35, 0.15, 0.4]} position={[0, -0.6, 0.05]}>
          <meshStandardMaterial color="#000000" roughness={0.3} />
        </Box>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.25, -0.7, 0]}>
        <Box args={[0.3, 1, 0.3]}>
          <meshStandardMaterial color="#2c3e50" roughness={0.6} />
        </Box>
        <Box args={[0.35, 0.15, 0.4]} position={[0, -0.6, 0.05]}>
          <meshStandardMaterial color="#000000" roughness={0.3} />
        </Box>
      </group>
    </group>
  );
}
function ChefModel({ isSpeaking }: { isSpeaking: boolean }) {
  return <SimpleChef isSpeaking={isSpeaking} />;
}

// Voice Synthesis Hook
const useVoiceSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string, priority: "high" | "normal" = "normal") => {
    if (!isEnabled) {
      return;
    }

    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported in this browser");
      return;
    }

    // Cancel current speech if high priority
    if (priority === "high" && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;

    // Small delay to ensure speech synthesis is ready
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stopSpeaking, isSpeaking, isEnabled, setIsEnabled };
};

// Main AI Chef Component
export default function AIChef({
  orders,
  previousOrders,
  isTestSpeaking = false,
}: AIChefProps) {
  const { speak, isSpeaking, isEnabled } = useVoiceSynthesis();
  const lastAnnouncedRef = useRef<Set<string>>(new Set());
  const lastUrgentCheckRef = useRef<number>(Date.now());
  const motivationalTimerRef = useRef<number>(Date.now());
  const isInitialLoadRef = useRef(true);
  const ordersRef = useRef<OrderData[]>(orders);

  // Keep ordersRef updated without triggering effects
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Detect new orders - only when previousOrders changes (i.e., during actual fetch)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      ordersRef.current.forEach((order) => {
        lastAnnouncedRef.current.add(order.id);
      });
      return;
    }
    if (previousOrders.length === 0) {
      return;
    }

    const newOrders = ordersRef.current.filter(
      (order) =>
        !previousOrders.some((prev) => prev.id === order.id) &&
        order.status === "pending" &&
        !lastAnnouncedRef.current.has(order.id)
    );

    newOrders.forEach((order) => {
      lastAnnouncedRef.current.add(order.id);

      const items = order.order_items
        .map((item) => `${item.quantity} ${item.dish_details?.name}`)
        .join(", ");

      const announcement = `New order received! Table number ${
        order.table_id
      }. Items: ${items}. Priority ${Math.round(
        100 - (order.priorityScore || 0)
      )} percent. Let's get cooking!`;

      speak(announcement, "high");
    });
  }, [previousOrders, speak, isEnabled]);

  useEffect(() => {
    const now = Date.now();
    const urgentCheckInterval = 120000;

    if (now - lastUrgentCheckRef.current < urgentCheckInterval) {
      return;
    }

    const pendingOrders = ordersRef.current.filter(
      (o) => o.status === "pending"
    );
    const urgentOrders = pendingOrders.filter((order) => {
      const orderTime = new Date(order.created_at).getTime();
      const minutesPending = (now - orderTime) / 60000;
      return minutesPending > 10;
    });

    if (urgentOrders.length > 0) {
      lastUrgentCheckRef.current = now;
      const urgentMessage = `Attention! We have ${urgentOrders.length} order${
        urgentOrders.length > 1 ? "s" : ""
      } waiting for more than 10 minutes. Let's speed things up, team!`;
      speak(urgentMessage, "high");
    }
  }, [orders, speak]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }
    if (previousOrders.length === 0) {
      return;
    }

    const now = Date.now();
    const motivationalInterval = 60 * 1000;

    if (now - motivationalTimerRef.current < motivationalInterval) {
      return;
    }

    const pendingCount = ordersRef.current.filter(
      (o) => o.status === "pending"
    ).length;
    const preparingCount = ordersRef.current.filter(
      (o) => o.status === "preparing"
    ).length;

    if (pendingCount === 0 && preparingCount === 0) {
      motivationalTimerRef.current = now;
      speak(
        "Great job team! All orders are completed. Ready for the next wave!"
      );
    } else if (preparingCount > 5) {
      motivationalTimerRef.current = now;
      speak(
        `We're cooking with fire! ${preparingCount} orders in progress. Keep up the excellent work!`
      );
    } else if (pendingCount > 8) {
      motivationalTimerRef.current = now;
      speak(
        `High volume alert! ${pendingCount} orders pending. Let's work together and knock these out!`
      );
    }
  }, [previousOrders, speak]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }
    if (previousOrders.length === 0) {
      return;
    }

    const completedOrders = ordersRef.current.filter(
      (order) =>
        order.status === "completed" &&
        previousOrders.some(
          (prev) => prev.id === order.id && prev.status === "preparing"
        )
    );

    if (completedOrders.length > 0) {
      completedOrders.forEach((order) => {
        speak(
          `Order ${String(order.id).slice(-6)} completed! Excellent work, chef!`
        );
      });
    }
  }, [previousOrders, speak]);

  return (
    <div className="h-full w-full relative">
      <div className="relative w-full h-full">
        <Canvas camera={{ position: [0, 0, 5.5], fov: 80 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <directionalLight position={[-10, 5, -5]} intensity={0.5} />
          <spotLight position={[0, 10, 0]} angle={0.3} intensity={1} />
          <ChefModel isSpeaking={isSpeaking || isTestSpeaking} />
          <Environment preset="sunset" />
        </Canvas>
      </div>
    </div>
  );
}
