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
      {/* PCB Circuit Pattern Background */}
      <div className="absolute inset-0 opacity-40">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <defs>
            <pattern id="pcbPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              {/* Central processor area - kept clear */}
              <circle cx="50" cy="50" r="15" fill="none" stroke="none" />
              
              {/* PCB traces radiating from edges to center */}
              {/* Top edge traces */}
              <line x1="10" y1="10" x2="40" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="20" y1="10" x2="40" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="30" y1="10" x2="40" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="40" y1="10" x2="40" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="50" y1="10" x2="50" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="60" y1="10" x2="60" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="70" y1="10" x2="60" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="80" y1="10" x2="60" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="90" y1="10" x2="60" y2="40" stroke="#012f78" strokeWidth="1.2" />
              
              {/* Right edge traces */}
              <line x1="90" y1="20" x2="60" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="90" y1="30" x2="60" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="90" y1="40" x2="60" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="90" y1="50" x2="60" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="90" y1="60" x2="60" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="90" y1="70" x2="60" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="90" y1="80" x2="60" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="90" y1="90" x2="60" y2="60" stroke="#012f78" strokeWidth="1.2" />
              
              {/* Bottom edge traces */}
              <line x1="80" y1="90" x2="60" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="70" y1="90" x2="60" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="60" y1="90" x2="60" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="50" y1="90" x2="50" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="40" y1="90" x2="40" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="30" y1="90" x2="40" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="20" y1="90" x2="40" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="10" y1="90" x2="40" y2="60" stroke="#012f78" strokeWidth="1.2" />
              
              {/* Left edge traces */}
              <line x1="10" y1="80" x2="40" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="10" y1="70" x2="40" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="10" y1="60" x2="40" y2="60" stroke="#012f78" strokeWidth="1.2" />
              <line x1="10" y1="50" x2="40" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="10" y1="40" x2="40" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="10" y1="30" x2="40" y2="40" stroke="#012f78" strokeWidth="1.2" />
              <line x1="10" y1="20" x2="40" y2="40" stroke="#012f78" strokeWidth="1.2" />
              
              {/* Connection points/nodes */}
              <circle cx="40" cy="40" r="1.5" fill="#012f78" />
              <circle cx="50" cy="40" r="1.5" fill="#012f78" />
              <circle cx="60" cy="40" r="1.5" fill="#012f78" />
              <circle cx="40" cy="50" r="1.5" fill="#012f78" />
              <circle cx="60" cy="50" r="1.5" fill="#012f78" />
              <circle cx="40" cy="60" r="1.5" fill="#012f78" />
              <circle cx="50" cy="60" r="1.5" fill="#012f78" />
              <circle cx="60" cy="60" r="1.5" fill="#012f78" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pcbPattern)" />
        </svg>
      </div>

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