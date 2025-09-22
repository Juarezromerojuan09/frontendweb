'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Clear any existing authentication data on component mount
  useEffect(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await axios.post(`${apiUrl}/api/auth/login`, formData)

      if (response.data.token && response.data.user) {
        // Guardar token de autenticación y datos del usuario
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userId', response.data.user.id)
        localStorage.setItem('userName', response.data.user.username)
        localStorage.setItem('userEmail', response.data.user.email)
        router.push('/dashboard')
      } else {
        setError('Respuesta inválida del servidor')
      }
    } catch (err: unknown) {
      // Clear localStorage on error to ensure clean state
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      localStorage.removeItem('userEmail')
      
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data
        let errorMessage = 'Error de autenticación'
        
        // Handle specific account status errors
        if (errorData?.message === 'account_suspended' || errorData?.message === 'account_pending') {
          errorMessage = errorData.message
        } else {
          errorMessage = errorData?.message || 'Error de autenticación'
        }
        
        setError(errorMessage)
        
        // Log detailed error for debugging
        console.error('Login error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: errorMessage
        })
      } else {
        setError('Error de autenticación')
        console.error('Unknown login error:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000e24' }}>
      {/* Circuit Pattern Background with longer lines and hollow circles */}
      <div className="absolute inset-0 opacity-40">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Radial gradient for fading center */}
            <radialGradient id="fadeCenter" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#000e24" stopOpacity="0" />
              <stop offset="40%" stopColor="#000e24" stopOpacity="0" />
              <stop offset="100%" stopColor="#000e24" stopOpacity="1" />
            </radialGradient>
            
            <pattern id="circuitPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Longer lines with direction changes and hollow circles */}
              <g stroke="#012f78" strokeWidth="0.8" fill="none" opacity="0.6">
                {/* Line 1 - from left to center with angle */}
                <path d="M0,40 L80,40 L100,60" />
                <circle cx="100" cy="60" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 2 - from top to center with angle */}
                <path d="M40,0 L40,80 L60,100" />
                <circle cx="60" cy="100" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 3 - from right to center with angle */}
                <path d="M200,60 L120,60 L100,80" />
                <circle cx="100" cy="80" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 4 - from bottom to center with angle */}
                <path d="M60,200 L60,120 L80,100" />
                <circle cx="80" cy="100" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 5 - from top-left to center */}
                <path d="M0,20 L60,20 L80,40" />
                <circle cx="80" cy="40" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 6 - from top-right to center */}
                <path d="M200,20 L140,20 L120,40" />
                <circle cx="120" cy="40" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 7 - from bottom-left to center */}
                <path d="M0,180 L60,180 L80,160" />
                <circle cx="80" cy="160" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 8 - from bottom-right to center */}
                <path d="M200,180 L140,180 L120,160" />
                <circle cx="120" cy="160" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 9 - diagonal from left */}
                <path d="M0,100 L50,100 L70,120" />
                <circle cx="70" cy="120" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 10 - diagonal from right */}
                <path d="M200,100 L150,100 L130,80" />
                <circle cx="130" cy="80" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 11 - diagonal from top */}
                <path d="M100,0 L100,50 L120,70" />
                <circle cx="120" cy="70" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
                
                {/* Line 12 - diagonal from bottom */}
                <path d="M100,200 L100,150 L80,130" />
                <circle cx="80" cy="130" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
              </g>
            </pattern>
          </defs>
          
          {/* Background with pattern */}
          <rect width="100%" height="100%" fill="url(#circuitPattern)" />
          
          {/* Fade out center area */}
          <rect width="100%" height="100%" fill="url(#fadeCenter)" />
        </svg>
      </div>

      {/* JS SYNAPTECH Branding - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center">
          <Image
            src="/Logo.png"
            alt="JS SYNAPTECH"
            width={96}
            height={24}
            className="h-6 w-auto"
          />
        </div>
      </div>

      {/* Admin Login Button - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => {
            console.log('Admin button clicked - navigating to /admin/login');
            router.push('/admin/login');
          }}
          className="px-4 py-2 border border-[#3488ab] text-sm font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors cursor-pointer"
        >
          Panel Admin
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* SYNAPBOT Logo */}
          <div className="text-center">
            <div className="mx-auto mb-6">
              <Image
                src="/Logobot.png"
                alt="SYNAPBOT"
                width={100}
                height={40}
                className="mx-auto"
              />
            </div>
            <h1 className="text-3xl font-bold uppercase tracking-wider text-[#90e2f8]">
              SYNAPBOT
            </h1>
            <p className="mt-2 text-[#B7C2D6] text-base">
              Bot automatizado de WhatsApp
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 border-2 border-[#3488ab] rounded-lg bg-[#000e24] text-[#B7C2D6] placeholder-[#B7C2D6] placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#3488ab] focus:border-transparent"
                  placeholder="Usuario"
                  value={formData.username}
                  onChange={handleChange}
                  style={{ backgroundColor: '#000e24' }}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 border-2 border-[#3488ab] rounded-lg bg-[#000e24] text-[#B7C2D6] placeholder-[#B7C2D6] placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#3488ab] focus:border-transparent"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ backgroundColor: '#000e24' }}
                />
              </div>
            </div>

            {error && (
              <div className={`text-sm text-center px-4 py-3 rounded-lg ${
                error === 'account_suspended'
                  ? 'text-red-300 bg-red-900/30 border border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                  : error === 'account_pending'
                  ? 'text-yellow-300 bg-yellow-900/30 border border-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                  : 'text-red-400'
              }`}>
                {error === 'account_suspended'
                  ? 'Tu cuenta ha sido suspendida, comunícate con nosotros'
                  : error === 'account_pending'
                  ? 'Tu cuenta está en revisión y obteniendo la información necesaria'
                  : error
                }
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-[#3488ab] hover:text-[#2a6c8a] text-sm font-medium transition-colors"
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}