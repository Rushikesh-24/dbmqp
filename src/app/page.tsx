"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  QrCode,
  BarChart3,
  Utensils,
  Play,
} from "lucide-react";
import Image from "next/image";
import logo from "../../public/shrut.png";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaContainerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const footerCtaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  
  useEffect(() => {
    setIsMounted(true);

    const tl = gsap.timeline();

    // Headline reveal animation
    if (headlineRef.current) {
      gsap.set(headlineRef.current, { opacity: 0, y: 30 });
      tl.to(
        headlineRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
        },
        0
      );
    }

    // Subheading fade in
    if (subheadingRef.current) {
      gsap.set(subheadingRef.current, { opacity: 0, y: 20 });
      tl.to(
        subheadingRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        0.2
      );
    }

    // CTA buttons staggered animation
    if (ctaContainerRef.current) {
      const buttons = ctaContainerRef.current.querySelectorAll("a, button");
      if (buttons.length > 0) {
        gsap.set(buttons, { opacity: 0, y: 20 });
        tl.to(
          buttons,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.15,
          },
          0.4
        );
      }
    }

    if (featuresRef.current) {
      const featureCards =
        featuresRef.current!.querySelectorAll(".feature-card");
      if (featureCards.length > 0) {
        gsap.set(featureCards, { opacity: 0, y: 40 });

        gsap.to(featureCards, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }
    }

    if (stepsRef.current) {
      const stepCards = stepsRef.current!.querySelectorAll(".step-card");
      if (stepCards.length > 0) {
        gsap.set(stepCards, { opacity: 0, y: 40 });

        gsap.to(stepCards, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: stepsRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }
    }

    if (footerCtaRef.current) {
      gsap.set(footerCtaRef.current, { opacity: 0, y: 30 });
      gsap.to(footerCtaRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: footerCtaRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    }

    // Floating animation for hero elements
    if (isMounted) {
      gsap.to(".hero-float", {
        y: -10,
        duration: 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.5,
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [isMounted]);

  const openVideoModal = () => {
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
  };

  return (
    <div className="bg-gradient-to-br from-neutral-50 via-amber-50/30 to-orange-50/20 text-neutral-900 min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="border-b border-amber-200/50 sticky top-0 z-50 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                <Image
                  src={logo}
                  alt="nomnom Logo"
                  fill
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                nomnom
              </h1>
            </div>
            <nav className="hidden md:flex gap-8">
              <a
                href="#features"
                className="text-neutral-700 hover:text-amber-600 transition-all duration-300 font-medium relative group"
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#how-it-works"
                className="text-neutral-700 hover:text-amber-600 transition-all duration-300 font-medium relative group"
              >
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a
                href="#contact"
                className="text-neutral-700 hover:text-amber-600 transition-all duration-300 font-medium relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            </nav>
            <div className="flex gap-3">
              <Link
                href="/signin"
                className="text-neutral-700 hover:text-amber-600 transition-all duration-300 px-4 py-2 rounded-xl font-medium hover:bg-white/50"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-300 px-6 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-24 md:py-40 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-sm font-semibold border border-amber-200/50 backdrop-blur-sm">
                  ✨ Restaurant Management Reimagined
                </span>
              </div>
              <h2
                ref={headlineRef}
                className="text-6xl md:text-7xl font-black mb-6 leading-[0.9] text-balance"
              >
                <span className="text-neutral-900">Smart</span>
                <br />
                <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Restaurant
                </span>
                <br />
                <span className="text-neutral-900">Revolution</span>
              </h2>
              <p
                ref={subheadingRef}
                className="text-2xl text-neutral-600 mb-12 leading-relaxed text-pretty font-light"
              >
                Transform your restaurant with AI-powered ordering, intelligent
                kitchen management, and award-winning customer experiences.
              </p>
              <div
                ref={ctaContainerRef}
                className="flex flex-col sm:flex-row gap-6"
              >
                <Link
                  href="/signup"
                  className="group bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-300 px-10 py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 shadow-2xl hover:shadow-amber-500/25 transform hover:-translate-y-1"
                >
                  Start Free Trial
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={openVideoModal}
                  className="group border-2 border-amber-300/50 text-neutral-800 hover:border-amber-500 hover:bg-white/50 transition-all duration-300 px-10 py-5 rounded-2xl text-xl font-bold backdrop-blur-sm hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span className="flex items-center gap-3">
                    Watch Demo
                    <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </span>
                </button>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center relative">
              <div className="relative w-80 h-80">
                {/* Floating Elements */}
                <div className="hero-float absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl rotate-12 shadow-xl"></div>
                <div className="hero-float absolute -bottom-6 -right-6 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl -rotate-12 shadow-lg"></div>

                {/* Main Logo Container */}
                <div className="relative w-full h-full bg-gradient-to-br from-white/80 to-amber-50/50 rounded-3xl shadow-2xl backdrop-blur-sm border border-amber-200/30 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-3xl"></div>
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                    <Image
                      src={logo}
                      alt="nomnom Restaurant"
                      fill
                    />
                  </div>
                </div>

                {/* Orbiting Elements */}
                <div className="hero-float absolute top-1/4 -right-8 w-8 h-8 bg-gradient-to-r from-amber-300 to-orange-400 rounded-full shadow-lg"></div>
                <div className="hero-float absolute bottom-1/3 -left-6 w-6 h-6 bg-gradient-to-r from-orange-300 to-red-400 rounded-full shadow-md"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="relative py-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-sm font-semibold border border-amber-200/50">
                🚀 Powerful Features
              </span>
            </div>
            <h3 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-neutral-900 via-amber-800 to-orange-700 bg-clip-text text-transparent">
              Everything You Need
            </h3>
            <p className="text-2xl text-neutral-600 max-w-3xl mx-auto font-light leading-relaxed">
              Award-winning platform designed for modern restaurants and their
              demanding customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card group relative bg-white/70 backdrop-blur-xl border border-amber-200/30 rounded-2xl p-8 hover:bg-white/90 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-amber-700" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:text-amber-800 transition-colors">
                  Intuitive Customer App
                </h4>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  Seamless ordering experience with dynamic cart management and
                  personalized loyalty rewards
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card group relative bg-white/70 backdrop-blur-xl border border-amber-200/30 rounded-2xl p-8 hover:bg-white/90 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Utensils className="w-8 h-8 text-amber-700" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:text-amber-800 transition-colors">
                  Kitchen Display System
                </h4>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  Real-time order management with intelligent prioritization and
                  efficient status updates
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card group relative bg-white/70 backdrop-blur-xl border border-amber-200/30 rounded-2xl p-8 hover:bg-white/90 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-amber-700" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:text-amber-800 transition-colors">
                  High-Performance Backend
                </h4>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  Powered by Next.js and edge-native Turso database for
                  lightning-fast performance
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card group relative bg-white/70 backdrop-blur-xl border border-amber-200/30 rounded-2xl p-8 hover:bg-white/90 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-8 h-8 text-amber-700" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:text-amber-800 transition-colors">
                  QR Code Management
                </h4>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  Generate and manage QR codes for each table, enabling seamless
                  phone-based ordering
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="feature-card group relative bg-white/70 backdrop-blur-xl border border-amber-200/30 rounded-2xl p-8 hover:bg-white/90 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-amber-700" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:text-amber-800 transition-colors">
                  Advanced Analytics
                </h4>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  Track revenue, popular dishes, and customer insights to
                  optimize operations
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="feature-card group relative bg-white/70 backdrop-blur-xl border border-amber-200/30 rounded-2xl p-8 hover:bg-white/90 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-amber-700" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-neutral-900 group-hover:text-amber-800 transition-colors">
                  Growth Tools
                </h4>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  Loyalty programs and data-driven insights to accelerate
                  restaurant growth
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        ref={stepsRef}
        className="relative py-24 bg-gradient-to-br from-amber-50/30 via-white/50 to-orange-50/30 backdrop-blur-sm z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-sm font-semibold border border-amber-200/50">
                ⚡ Simple Process
              </span>
            </div>
            <h3 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-neutral-900 via-amber-800 to-orange-700 bg-clip-text text-transparent">
              How It Works
            </h3>
            <p className="text-2xl text-neutral-600 max-w-3xl mx-auto font-light leading-relaxed">
              Three elegant steps to transform your restaurant operations
              forever
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">

            <div className="step-card text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-3xl mx-auto mb-8 flex items-center justify-center text-3xl font-black shadow-2xl shadow-amber-500/25 transform hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h4 className="text-2xl font-bold mb-4 text-neutral-900">
                Setup Your Restaurant
              </h4>
              <p className="text-neutral-600 leading-relaxed text-lg">
                Lightning-fast onboarding to connect your menu, staff, and
                systems to the award-winning nomnom platform
              </p>
            </div>

            <div className="step-card text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-3xl mx-auto mb-8 flex items-center justify-center text-3xl font-black shadow-2xl shadow-amber-500/25 transform hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h4 className="text-2xl font-bold mb-4 text-neutral-900">
                Customers Order
              </h4>
              <p className="text-neutral-600 leading-relaxed text-lg">
                Customers experience seamless ordering through our intuitive app
                with personalized recommendations and instant payments
              </p>
            </div>

            <div className="step-card text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-3xl mx-auto mb-8 flex items-center justify-center text-3xl font-black shadow-2xl shadow-amber-500/25 transform hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h4 className="text-2xl font-bold mb-4 text-neutral-900">
                Kitchen Delivers
              </h4>
              <p className="text-neutral-600 leading-relaxed text-lg">
                Smart kitchen displays with AI-powered prioritization ensure
                perfect timing and exceptional customer satisfaction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={footerCtaRef}
        className="relative py-24 bg-gradient-to-br from-amber-600 via-orange-500 to-red-500 text-white overflow-hidden z-10"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block mb-8">
            <span className="px-6 py-2 rounded-full bg-white/20 text-white text-sm font-semibold border border-white/30 backdrop-blur-sm">
              🎉 Join the Revolution
            </span>
          </div>
          <h3 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
            Ready to Transform
            <br />
            Your Restaurant?
          </h3>
          <p className="text-2xl text-amber-100 mb-16 max-w-3xl mx-auto leading-relaxed font-light">
            Join thousands of award-winning restaurants already using nomnom to
            revolutionize their operations and customer experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/signup"
              className="group bg-white text-amber-600 hover:bg-amber-50 transition-all duration-300 px-12 py-6 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-white/20 transform hover:-translate-y-1"
            >
              <span className="flex items-center gap-3">
                Get Started Free
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <button
              onClick={openVideoModal}
              className="group border-2 border-white text-white hover:bg-white/10 transition-all duration-300 px-12 py-6 rounded-2xl text-xl font-bold backdrop-blur-sm hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="flex items-center gap-3">
                Watch Demo
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="relative py-16 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-neutral-900 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                  <Image
                    src={logo}
                    alt="nomnom Logo"
                    fill
                  />
                </div>
                <h4 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  nomnom
                </h4>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                Revolutionizing the restaurant experience with award-winning
                technology, one order at a time.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-black mb-6 text-lg">Product</h5>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-black mb-6 text-lg">Company</h5>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-black mb-6 text-lg">Legal</h5>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-amber-800/30 pt-8 text-center">
            <p className="text-neutral-400">
              © 2025 nomnom. All rights reserved. Crafted with ❤️ for
              restaurants worldwide.
            </p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeVideoModal}
        >
          <div
            className="relative w-full max-w-4xl mx-4 bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <video
              ref={videoRef}
              className="w-full aspect-video"
              controls
              autoPlay
            >
              <source src="/Nom Nom App Promo Video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
