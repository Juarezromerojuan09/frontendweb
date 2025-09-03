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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0A2540' }}>
      {/* Circuit Pattern Background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuitPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="#1E90FF" opacity="0.3" />
              <circle cx="50" cy="10" r="2" fill="#1E90FF" opacity="0.3" />
              <circle cx="90" cy="10" r="2" fill="#1E90FF" opacity="0.3" />
              <circle cx="10" cy="50" r="2" fill="#1E90FF" opacity="0.3" />
              <circle cx="50" cy="50" r="2" fill="#1E90FF" opacity="0.3" />
              <circle cx="90" cy="50" r="2" fill="#1E90FF" opacity="0.3" />
              <circle cx="10" cy="90" r="2" fill="#1E90FF" opacity="0.3" />
              <circle cx="50" cy="90" r="2" fill="#1E90FF" opacity="0.3" />
              <circle cx="90" cy="90" r="2" fill="#1E90FF" opacity="0.3" />
              <line x1="10" y1="10" x2="90" y2="10" stroke="#1E90FF" strokeWidth="1" opacity="0.2" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="#1E90FF" strokeWidth="1" opacity="0.2" />
              <line x1="10" y1="90" x2="90" y2="90" stroke="#1E90FF" strokeWidth="1" opacity="0.2" />
              <line x1="10" y1="10" x2="10" y2="90" stroke="#1E90FF" strokeWidth="1" opacity="0.2" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="#1E90FF" strokeWidth="1" opacity="0.2" />
              <line x1="90" y1="10" x2="90" y2="90" stroke="#1E90FF" strokeWidth="1" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuitPattern)" />
        </svg>
      </div>

      {/* JS SYNAPTECH Branding - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center">
          <Image 
            src="/Logo.png" 
            alt="JS SYNAPTECH" 
            width={120} 
            height={30}
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Admin Login Button - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => router.push('/admin/login')}
          className="px-4 py-2 border border-[#1E90FF] text-sm font-medium rounded-md text-[#B7C2D6] bg-transparent hover:bg-[#1E90FF] hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E90FF] transition-colors"
        >
          Panel Admin
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-0 flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
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
            <h1 className="text-3xl font-bold uppercase tracking-wider text-[#1E90FF]">
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
                  className="w-full px-4 py-3 border-2 border-[#1E90FF] rounded-lg bg-[#0A2540] text-[#B7C2D6] placeholder-[#B7C2D6] placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent"
                  placeholder="Usuario"
                  value={formData.username}
                  onChange={handleChange}
                  style={{ backgroundColor: '#0A2540' }}
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
                  className="w-full px-4 py-3 border-2 border-[#1E90FF] rounded-lg bg-[#0A2540] text-[#B7C2D6] placeholder-[#B7C2D6] placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ backgroundColor: '#0A2540' }}
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
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#00FFAB] hover:bg-[#00E69C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00FFAB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-[#00FFAB] hover:text-[#00E69C] text-sm font-medium transition-colors"
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