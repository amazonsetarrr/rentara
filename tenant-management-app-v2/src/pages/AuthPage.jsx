"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Eye, EyeOff, CheckCircle, BarChart3, Users, Zap } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 relative overflow-hidden">
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 25% 25%, white 2px, transparent 2px)",
              backgroundSize: "60px 60px",
            }}
          ></div>

          <div className="relative z-10 flex flex-col justify-center px-8 py-12 text-white">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Rentara</h1>
              </div>
              <p className="text-lg text-blue-100 font-medium">Smart Tenant Management System</p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-base text-blue-50">Manage properties effortlessly</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-base text-blue-50">Track tenants and payments</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <span className="text-base text-blue-50">Generate insightful reports</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-base text-blue-50">AI-powered insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Rentara</h1>
              </div>
              <p className="text-sm text-gray-600">Smart Property Management</p>
            </div>

            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                <p className="text-gray-600">Sign in to your account to continue</p>
              </div>

              <form className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                      Remember me
                    </Label>
                  </div>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                    Forgot your password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium"
                >
                  Sign In
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-3 text-sm">New to Rentara?</p>
                <Button
                  variant="outline"
                  className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Create your organization
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}