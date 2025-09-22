'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface ApiResponse {
  success: boolean
  users?: User[]
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

interface User {
  _id: string
  fullName: string
  email: string
  personalPhone: string
  businessName: string
  businessType: string
  whatsappNumber: string
  businessDescription?: string
  website?: string
  profileImageUrl?: string
  status: 'pending_verification' | 'active' | 'suspended'
  wabaId?: string
  phoneId?: string
  accessToken?: string
  createdAt: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [adminUsername, setAdminUsername] = useState('')
  const router = useRouter()

  const checkAuth = useCallback(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      router.push('/admin/login')
    }
  }, [router])

  const fetchUsers = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const adminToken = localStorage.getItem('adminToken')
      const response = await axios.get<ApiResponse>(`${apiUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      })

      if (response.data.success && response.data.users) {
        setUsers(response.data.users)
        setFilteredUsers(response.data.users)
      } else {
        setError('Error al obtener usuarios')
      }
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else {
        setError('Error al conectar con el servidor')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
    fetchUsers()
    // Get admin username from localStorage
    const username = localStorage.getItem('adminUsername')
    if (username) {
      setAdminUsername(username)
    }
  }, [checkAuth, fetchUsers])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [users, searchTerm])

  const handleApproveUser = useCallback(async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres aprobar este usuario?')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const adminToken = localStorage.getItem('adminToken')

      const response = await axios.patch<ApiResponse>(
        `${apiUrl}/api/admin/users/${userId}`,
        { status: 'active' },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      )

      if (response.data.success) {
        setUsers(users.map(u =>
          u._id === userId ? { ...u, status: 'active' } : u
        ))
        alert('Usuario aprobado correctamente')
      }
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else {
        alert('Error al aprobar usuario')
      }
    }
  }, [users, router])

  const getStatusBadge = (status: string) => {
    let bgColor = '', textColor = '', text = ''

    switch (status) {
      case 'pending_verification':
        bgColor = '#233548'
        textColor = '#76b2f2'
        text = 'Pendiente'
        break
      case 'active':
        bgColor = '#1e340b'
        textColor = '#80de2f'
        text = 'Activo'
        break
      case 'suspended':
        bgColor = '#340b1e'
        textColor = '#de2f80'
        text = 'Suspendido'
        break
      default:
        bgColor = '#1e1e34'
        textColor = '#b7c2d6'
        text = 'Desconocido'
    }

    return (
      <span 
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {text}
      </span>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUsername')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000e24' }}>
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90e2f8] mx-auto"></div>
          <p className="mt-4 text-[#B7C2D6]">Cargando usuarios...</p>
        </div>
      </div>
    )
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
        <div className="flex flex-col items-start">
          <div className="flex items-center">
            <Image
              src="/Logo.png"
              alt="JS SYNAPTECH"
              width={60}
              height={15}
              className="h-3 w-auto"
            />
          </div>
          {adminUsername && (
            <div className="mt-2 text-[#B7C2D6] text-sm font-medium">
              Admin: {adminUsername}
            </div>
          )}
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

      {/* Navigation Buttons - Top Right */}
      <div className="absolute top-6 right-6 z-50 flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              console.log('Botón Volver clickeado - redirigiendo a /login');
              router.push('/login');
            }}
            className="text-[#3488ab] hover:text-[#2a6c8a] text-sm font-medium cursor-pointer transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() => {
              console.log('Botón Admi clickeado - redirigiendo a /admin/create');
              router.push('/admin/create');
            }}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#3ea0c9] hover:bg-[#2a7ca1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors"
          >
            Admi
          </button>
          <button
            onClick={() => {
              console.log('Botón Cerrar sesión clickeado');
              handleLogout();
            }}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold uppercase tracking-wider text-[#90e2f8] mb-4">
              Dashboard de Administración
            </h1>
            <p className="text-[#B7C2D6] text-lg">
              Gestiona los usuarios registrados en la plataforma
            </p>
          </div>

          {/* Stats and Search */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-center bg-[#0b1e34] rounded-lg p-4 shadow-lg">
              <div className="text-3xl font-bold text-[#90e2f8]">{users.length}</div>
              <div className="text-sm text-[#B7C2D6]">Usuarios totales</div>
            </div>

            {/* Search Bar */}
            <div className="max-w-md">
              <label htmlFor="search" className="sr-only">Buscar usuarios</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  className="block w-full pl-10 pr-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: '#000e24' }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Users Table */}
          <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9]">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#012f78]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#B7C2D6] uppercase tracking-wider">
                      Imagen
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#B7C2D6] uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#B7C2D6] uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#B7C2D6] uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#B7C2D6] uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#B7C2D6] uppercase tracking-wider">
                      Registrado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#B7C2D6] uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#012f78]">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-[#012f78] hover:bg-opacity-30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.profileImageUrl ? (
                          <Image
                            src={user.profileImageUrl}
                            alt={`${user.fullName} avatar`}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#3ea0c9]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#0b1e34] border-2 border-[#3ea0c9] flex items-center justify-center">
                            <svg className="w-6 h-6 text-[#B7C2D6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-[#B7C2D6]">
                              {user.email}
                            </div>
                            <div className="text-sm text-[#B7C2D6]">
                              Tel: {user.personalPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {user.businessName}
                        </div>
                        <div className="text-sm text-[#B7C2D6]">
                          {user.businessType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          +{user.whatsappNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#B7C2D6]">
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {user.status === 'pending_verification' && (
                            <button
                              onClick={() => handleApproveUser(user._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer transition-colors"
                              type="button"
                            >
                              Aprobar
                            </button>
                          )}
                          <Link
                            href={`/admin/dashboard/edit/${user._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-[#3ea0c9] text-xs font-medium rounded text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-[#B7C2D6]">
                {searchTerm ? 'No se encontraron usuarios con esa búsqueda' : 'No hay usuarios registrados'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}