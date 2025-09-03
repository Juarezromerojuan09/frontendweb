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
        const errorMessage = err.response?.data?.message || 'Error de autenticación'
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
      {/* PCB Background SVG */}
      <svg 
        className="pcb-bg fixed inset-0 z-0 pointer-events-none" 
        viewBox="0 0 160 160" 
        preserveAspectRatio="xMidYMid slice" 
        aria-hidden="true"
      >
        <defs>
          {/* Tile del patrón */}
          <pattern id="pcb-tile" width="160" height="160" patternUnits="userSpaceOnUse">
            {/* Líneas/"trazas" */}
            <g stroke="#022352" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6">
              <path d="M10 20 H70 A8 8 0 0 1 78 28 V120 H140" />
              <path d="M20 80 H60 A10 10 0 0 0 70 90 V150" />
              <path d="M5 130 H90 A8 8 0 0 1 98 138 V155" />
              <path d="M150 10 V70 A10 10 0 0 1 140 80 H100" />
              <path d="M120 40 H80 A8 8 0 0 0 72 48 V100 H30" />
              <path d="M30 30 V50 A8 8 0 0 0 38 58 H110" />
              <path d="M130 120 H100 A8 8 0 0 0 92 128 V155" />
            </g>
            {/* Nodos ("vias"/pads) */}
            <g fill="#022352" opacity="0.85">
              <circle cx="78" cy="28" r="3" />
              <circle cx="70" cy="90" r="3" />
              <circle cx="98" cy="138" r="3" />
              <circle cx="140" cy="80" r="3" />
              <circle cx="72" cy="48" r="3" />
              <circle cx="38" cy="58" r="3" />
              <circle cx="100" cy="120" r="3" />
            </g>
          </pattern>

          {/* Vignette suave para que no distraiga */}
          <radialGradient id="soft-fade">
            <stop offset="60%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
          <mask id="fade-mask">
            <rect width="100%" height="100%" fill="url(#soft-fade)"/>
          </mask>
        </defs>

        {/* Fondo sólido */}
        <rect width="100%" height="100%" fill="#000e24"/>
        {/* Patrón repetido con máscara suave */}
        <rect width="100%" height="100%" fill="url(#pcb-tile)" mask="url(#fade-mask)"/>
      </svg>

      {/* JS SYNAPTECH Branding - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center">
          <Image 
            src="/Logo.png" 
            alt="JS SYNAPTECH" 
            width={192} 
            height={48}
            className="h-12 w-auto"
          />
        </div>
      </div>

      {/* Admin Login Button - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => router.push('/admin/login')}
          className="px-4 py-2 border border-[#3488ab] text-sm font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3488ab] transition-colors"
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
                width={200} 
                height={80}
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
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0073ba] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
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