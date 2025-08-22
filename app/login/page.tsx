import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2d5016] to-[#1a3009] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="mb-6 flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <Image 
                  src="/NHIA-1-1.png" 
                  alt="NHIA Logo" 
                  width={120} 
                  height={60}
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">National Health Insurance Scheme</h1>
            <p className="text-xl text-white/90 mb-2">Claims Management Portal</p>
            <p className="text-lg text-green-200 mb-6 font-medium">Financial Access to Health Care for All</p>
            <p className="text-white/80 leading-relaxed">
              Secure access to Nigeria's comprehensive healthcare insurance claims management system. Streamlining healthcare
              delivery for better patient outcomes.
            </p>
          </div>

          <div className="space-y-4 text-sm text-white/70">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span>Secure & Encrypted Platform</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span>24/7 System Availability</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white/60 rounded-full"></div>
              <span>Comprehensive Claims Management</span>
            </div>
          </div>
        </div>

        {/* Decorative Pattern */}
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
