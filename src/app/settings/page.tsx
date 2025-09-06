'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface User {
  _id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  whatsappNumbers?: Array<{
    _id: string;
    displayName: string;
    whatsappNumber: string;
    phoneNumberId: string;
    isActive: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export default function Settings() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      
      if (!token || !userId) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch(`${apiUrl}/api/auth/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUser(data.user)
          } else {
            setError('Error al cargar los datos del usuario')
          }
        } else if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('userId')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          router.push('/login')
        } else {
          setError('Error al conectar con el servidor')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [apiUrl, router])

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000e24' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: '#000e24' }}>
      {/* Circuit Pattern Background with longer lines and hollow circles - Behind everything */}
      <div className="absolute inset-0 opacity-40 z-0">
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

      {/* Header with logo and back button */}
      <div className="relative z-50 bg-[#0b1e34] shadow-sm border-b border-[#012f78] px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left section - Logo and title */}
          <div className="flex items-center space-x-3">
            <Image
              src="/Logo.png"
              alt="SYNAPBOT"
              width={100}
              height={25}
              className="h-6 w-auto"
            />
            <h1 className="text-lg font-semibold text-[#90e2f8]">
              Whatsapp Synapbot
            </h1>
          </div>

          {/* Right section - Back button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative z-50">
        <div className="max-w-4xl mx-auto p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {user && (
            <div className="space-y-6">
              {/* Información Básica con Imagen de Perfil */}
              <div className="bg-[#0b1e34] border border-[#012f78] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[#3ea0c9] mb-4">
                  Información del Usuario
                </h2>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Imagen de Perfil */}
                  <div className="flex-shrink-0">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="Imagen de perfil"
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#3ea0c9]"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-[#0b1e34] border-4 border-[#3ea0c9] rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Información del Usuario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div>
                      <label className="block text-sm font-medium text-[#B7C2D6] mb-1">
                        Nombre
                      </label>
                      <div className="bg-[#000e24] border border-[#3ea0c9] rounded-md px-4 py-2 text-white">
                        {user.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#B7C2D6] mb-1">
                        Email
                      </label>
                      <div className="bg-[#000e24] border border-[#3ea0c9] rounded-md px-4 py-2 text-white">
                        {user.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#B7C2D6] mb-1">
                        ID de Usuario
                      </label>
                      <div className="bg-[#000e24] border border-[#3ea0c9] rounded-md px-4 py-2 text-white text-sm overflow-x-auto">
                        {user._id}
                      </div>
                    </div>
                    {user.createdAt && (
                      <div>
                        <label className="block text-sm font-medium text-[#B7C2D6] mb-1">
                          Fecha de Registro
                        </label>
                        <div className="bg-[#000e24] border border-[#3ea0c9] rounded-md px-4 py-2 text-white">
                          {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Números de WhatsApp */}
              {user.whatsappNumbers && user.whatsappNumbers.length > 0 && (
                <div className="bg-[#0b1e34] border border-[#012f78] rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-[#3ea0c9] mb-4">
                    Números de WhatsApp Configurados
                  </h2>
                  <div className="space-y-3">
                    {user.whatsappNumbers.map((wa) => (
                      <div key={wa._id} className="bg-[#000e24] border border-[#3ea0c9] rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-white">{wa.displayName}</h3>
                            <p className="text-sm text-[#B7C2D6]">+{wa.whatsappNumber}</p>
                            <p className="text-xs text-[#B7C2D6]">ID: {wa.phoneNumberId}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            wa.isActive
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {wa.isActive ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Información Adicional */}
              <div className="bg-[#0b1e34] border border-[#012f78] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[#3ea0c9] mb-4">
                  Información Adicional
                </h2>
                <div className="text-[#B7C2D6]">
                  <p>Esta es la información de tu cuenta almacenada en la base de datos.</p>
                  <p className="mt-2 text-sm">
                    Para más opciones de configuración, contacta con el administrador del sistema.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!user && !error && (
            <div className="text-center text-[#B7C2D6] py-8">
              No se encontraron datos del usuario
            </div>
          )}
        </div>
      </div>
    </div>
  )
}