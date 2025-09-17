'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface ApiResponse {
  success: boolean
  message?: string
}

interface AxiosError {
  response?: {
    status: number
    data?: {
      message?: string
    }
  }
}

export default function AdminCreate() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    token: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validaciones básicas
    if (!formData.username || !formData.password || !formData.confirmPassword || !formData.token) {
      setError('Todos los campos son obligatorios')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const adminToken = localStorage.getItem('adminToken')
      
      const response = await axios.post<ApiResponse>(
        `${apiUrl}/api/admin/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      )

      if (response.data.success) {
        setSuccess('Administrador creado exitosamente')
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          token: ''
        })
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 2000)
      }
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 401 && axiosErr.response.data?.message === 'Token inválido') {
        setError('Token de administración inválido')
      } else if (axiosErr.response?.status === 401) {
        setError('No autorizado. Por favor inicia sesión nuevamente.')
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else if (axiosErr.response?.status === 400) {
        setError(axiosErr.response.data?.message || 'Error en los datos enviados')
      } else {
        setError('Error al crear administrador. Intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/admin/dashboard')
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
            width={60}
            height={15}
            className="h-3 w-auto"
          />
        </div>
      </div>

      {/* SYNAPBOT Logo - Top Center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <Image
          src="/Logobot.png"
          alt="SYNAPBOT"
          width={80}
          height={32}
          className="h-4 w-auto"
        />
      </div>

      {/* Back Button - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={handleBack}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-[#90e2f8] mb-4">
              Crear Administrador
            </h1>
            <p className="text-[#B7C2D6]">
              Ingresa los datos para crear una nueva cuenta de administrador
            </p>
          </div>

          {/* Form */}
          <div className="bg-[#0b1e34] shadow-xl rounded-xl p-8 border-2 border-[#3ea0c9]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded text-sm">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#B7C2D6] mb-2">
                  Nombre de usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                  placeholder="Ingresa el nombre de usuario"
                  style={{ backgroundColor: '#000e24' }}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#B7C2D6] mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  style={{ backgroundColor: '#000e24' }}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#B7C2D6] mb-2">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                  placeholder="Repite la contraseña"
                  style={{ backgroundColor: '#000e24' }}
                />
                {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">Las contraseñas no coinciden</p>
                )}
              </div>

              <div>
                <label htmlFor="token" className="block text-sm font-medium text-[#B7C2D6] mb-2">
                  Token de administración
                </label>
                <input
                  id="token"
                  name="token"
                  type="password"
                  required
                  value={formData.token}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                  placeholder="Ingresa el token de administración"
                  style={{ backgroundColor: '#000e24' }}
                />
                <p className="mt-1 text-xs text-[#B7C2D6] opacity-70">
                  Token requerido para crear cuentas de administrador
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || formData.password !== formData.confirmPassword}
                  className="w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {loading ? 'Creando administrador...' : 'Crear Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}