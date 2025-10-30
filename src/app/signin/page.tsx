"use client"
import type { NextPage } from "next"
import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { setCookie } from "@/lib/utils";
import { gsap } from "gsap"
import { Mail, Lock, ArrowRight } from "lucide-react"
import Image from "next/image"
import logo from "../../../public/shrut.png";

const Page: NextPage = ({}) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const formRef = useRef<HTMLDivElement>(null)
  const inputsRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const gradientRef = useRef<HTMLDivElement>(null)

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard")
    }
  }, [router])

  useEffect(() => {
    const tl = gsap.timeline()

    // Animate form container
    if (formRef.current) {
      gsap.set(formRef.current, { opacity: 0, x: -30 })
      tl.to(
        formRef.current,
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        0,
      )
    }

    // Animate input fields
    if (inputsRef.current) {
      const inputs = inputsRef.current.querySelectorAll("input")
      gsap.set(inputs, { opacity: 0, y: 20 })
      tl.to(
        inputs,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
        },
        0.2,
      )
    }

    // Animate button
    if (buttonRef.current) {
      gsap.set(buttonRef.current, { opacity: 0, y: 20 })
      tl.to(
        buttonRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        0.4,
      )
    }

    // Animate gradient background
    if (gradientRef.current) {
      gsap.set(gradientRef.current, { opacity: 0 })
      tl.to(
        gradientRef.current,
        {
          opacity: 1,
          duration: 1,
          ease: "power2.out",
        },
        0,
      )

      // Subtle floating animation for gradient
      gsap.to(gradientRef.current, {
        y: -20,
        duration: 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Save JWT token to both localStorage and cookies
        localStorage.setItem("token", data.token)
        setCookie("token", data.token, 7) // Valid for 7 days

        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search)
        const redirect = urlParams.get("redirect") || "/dashboard"
        router.push(redirect)
      } else {
        setError(data.message || "Something went wrong")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div ref={formRef} className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Image src={logo} alt="Logo" className="w-10 h-10"/>
              <h1 className="text-2xl font-bold text-neutral-900">nomnom</h1>
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h2>
            <p className="text-neutral-600">Sign in to your restaurant dashboard</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div ref={inputsRef} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-neutral-900 placeholder-neutral-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-neutral-900 placeholder-neutral-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <button
              ref={buttonRef}
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bigZoom"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-neutral-600">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Gradient Background */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 items-center justify-center relative overflow-hidden">
        <div ref={gradientRef} className="absolute inset-0 opacity-50">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center text-white px-8">
          <h3 className="text-3xl font-bold mb-4">Welcome to nomnom</h3>
          <p className="text-lg text-orange-100 max-w-sm">
            Manage your restaurant with ease. Real-time orders, kitchen management, and customer insights all in one
            place.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Page
