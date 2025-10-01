'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

interface ApiResponse {
  success: boolean
  users?: User[]
  message?: string
}

interface UpdateResponse {
  success: boolean
  message?: string
  user?: User
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
  address?: string
  whatsappNumber: string
  whatsappDisplayName: string
  businessCategory: string
  businessDescription?: string
  website?: string
  profileImageUrl?: string
  status: 'pending_verification' | 'active' | 'suspended'
  wabaId?: string
  phoneId?: string
  accessToken?: string
  createdAt: string
}

export default function EditUserPage() {
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    status: '',
    wabaId: '',
    phoneId: '',
    accessToken: ''
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  // Edit mode states for individual fields
  const [editModes, setEditModes] = useState({
    fullName: false,
    email: false,
    personalPhone: false,
    businessName: false,
    businessType: false,
    address: false,
    whatsappNumber: false,
    whatsappDisplayName: false,
    businessCategory: false,
    businessDescription: false,
    website: false,
    wabaId: false,
    phoneId: false,
    accessToken: false
  })

  // Temporary edit values
  const [editValues, setEditValues] = useState({
    fullName: '',
    email: '',
    personalPhone: '',
    businessName: '',
    businessType: '',
    address: '',
    whatsappNumber: '',
    whatsappDisplayName: '',
    businessCategory: '',
    businessDescription: '',
    website: '',
    wabaId: '',
    phoneId: '',
    accessToken: ''
  })

  const checkAuth = useCallback(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      router.push('/admin/login')
      return false
    }
    return true
  }, [router])

  const fetchUser = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const adminToken = localStorage.getItem('adminToken')
      const response = await axios.get<ApiResponse>(`${apiUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      })

      if (response.data.success && response.data.users) {
        const foundUser = response.data.users.find((u: User) => u._id === userId)
        if (foundUser) {
          setUser(foundUser)
          setFormData({
            status: foundUser.status,
            wabaId: foundUser.wabaId || '',
            phoneId: foundUser.phoneId || '',
            accessToken: foundUser.accessToken || ''
          })

          // Initialize edit values
          setEditValues({
            fullName: foundUser.fullName,
            email: foundUser.email,
            personalPhone: foundUser.personalPhone,
            businessName: foundUser.businessName,
            businessType: foundUser.businessType,
            address: foundUser.address || '',
            whatsappNumber: foundUser.whatsappNumber,
            whatsappDisplayName: foundUser.whatsappDisplayName,
            businessCategory: foundUser.businessCategory,
            businessDescription: foundUser.businessDescription || '',
            website: foundUser.website || '',
            wabaId: foundUser.wabaId || '',
            phoneId: foundUser.phoneId || '',
            accessToken: foundUser.accessToken || ''
          })
        } else {
          setError('Usuario no encontrado')
        }
      }
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else {
        setError('Error al obtener usuario')
      }
    } finally {
      setLoading(false)
    }
  }, [userId, router])

  useEffect(() => {
    if (userId) {
      checkAuth()
      fetchUser()
    }
  }, [checkAuth, fetchUser, userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditChange = (field: string, value: string) => {
    setEditValues({
      ...editValues,
      [field]: value
    })
  }

  const toggleEditMode = (field: string) => {
    setEditModes({
      ...editModes,
      [field]: !editModes[field as keyof typeof editModes]
    })
  }

  const saveField = async (field: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const adminToken = localStorage.getItem('adminToken')

      const updateData: Record<string, string> = {
        [field]: editValues[field as keyof typeof editValues] as string
      }

      const response = await axios.patch<UpdateResponse>(
        `${apiUrl}/api/admin/users/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      )

      if (response.data.success) {
        // Update the user state
        if (user) {
          setUser({
            ...user,
            [field]: editValues[field as keyof typeof editValues]
          })
        }
        setSuccess(`Campo ${field} actualizado correctamente`)
        setTimeout(() => setSuccess(''), 3000)
      }

      // Exit edit mode
      toggleEditMode(field)
    } catch {
      setError(`Error al actualizar ${field}`)
    }
  }

  const cancelEdit = (field: string) => {
    // Reset to original value
    if (user) {
      setEditValues({
        ...editValues,
        [field]: user[field as keyof User] as string || ''
      })
    }
    toggleEditMode(field)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const adminToken = localStorage.getItem('adminToken')

      const updateData: Record<string, string> = {
        status: formData.status,
      }

      // Only add optional fields if they have values
      if (formData.wabaId.trim()) updateData.wabaId = formData.wabaId
      if (formData.phoneId.trim()) updateData.phoneId = formData.phoneId
      if (formData.accessToken.trim()) updateData.accessToken = formData.accessToken

      const response = await axios.patch<UpdateResponse>(
        `${apiUrl}/api/admin/users/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      )

      if (response.data.success) {
        setSuccess('Usuario actualizado correctamente')
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 2000)
      }
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else {
        setError('Error al actualizar usuario')
      }
    } finally {
      setUpdating(false)
    }
  }

  const getStatusOptions = () => [
    { value: 'pending_verification', label: 'Pendiente de Verificación' },
    { value: 'active', label: 'Activo' },
    { value: 'suspended', label: 'Suspendido' }
  ]

  const getBusinessCategoryOptions = () => [
    { value: 'salud', label: 'Salud' },
    { value: 'belleza', label: 'Belleza' },
    { value: 'educación', label: 'Educación' },
    { value: 'negocio', label: 'Negocio' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'entretenimiento', label: 'Entretenimiento' },
    { value: 'viajes', label: 'Viajes' },
    { value: 'finanzas', label: 'Finanzas' },
    { value: 'tecnología', label: 'Tecnología' },
    { value: 'otro', label: 'Otro' }
  ]

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

  const PencilIcon = ({ className }: { className?: string }) => (
    <svg className={`w-4 h-4 ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000e24' }}>
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90e2f8] mx-auto"></div>
          <p className="mt-4 text-[#B7C2D6]">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000e24' }}>
        <div className="text-[#B7C2D6] z-10">Usuario no encontrado</div>
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

      {/* JS SYNAPTECH Branding - Centered Small Logo */}
      <div className="absolute top-6 left-0 right-0 z-10 flex justify-center">
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

      {/* Navigation Buttons - Top Right */}
      <div className="absolute top-6 right-6 z-50 flex items-center space-x-4">
        <button
          onClick={() => {
            console.log('Botón Volver clickeado - redirigiendo a /admin/dashboard');
            router.push('/admin/dashboard');
          }}
          className="text-[#3488ab] hover:text-[#2a6c8a] text-sm font-medium cursor-pointer transition-colors"
        >
          ← Volver
        </button>
        <button
          onClick={() => {
            console.log('Botón Cerrar sesión clickeado');
            localStorage.removeItem('adminToken');
            router.push('/admin/login');
          }}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-[#90e2f8] mb-2">
              Editar Usuario: {user.fullName}
            </h1>
            <p className="text-[#B7C2D6]">
              {user.businessName} - {user.email}
            </p>
            <div className="mt-2">
              {getStatusBadge(user.status)}
            </div>
          </div>

          <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9]">
            <div className="px-6 py-4 border-b border-[#012f78]">
              <h3 className="text-lg font-medium text-white">
                Información del Usuario
              </h3>
            </div>

            <div className="p-6">
              {/* Información Personal */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-[#3ea0c9] mb-4">
                  Información Personal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">
                      Nombre Completo
                    </label>
                    {editModes.fullName ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={editValues.fullName}
                          onChange={(e) => handleEditChange('fullName', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        />
                        <button
                          onClick={() => saveField('fullName')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('fullName')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.fullName}
                        </div>
                        <button
                          onClick={() => toggleEditMode('fullName')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar nombre"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">
                      Correo Electrónico
                    </label>
                    {editModes.email ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="email"
                          value={editValues.email}
                          onChange={(e) => handleEditChange('email', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        />
                        <button
                          onClick={() => saveField('email')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('email')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.email}
                        </div>
                        <button
                          onClick={() => toggleEditMode('email')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar email"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">
                      Teléfono Personal
                    </label>
                    {editModes.personalPhone ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="tel"
                          value={editValues.personalPhone}
                          onChange={(e) => handleEditChange('personalPhone', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        />
                        <button
                          onClick={() => saveField('personalPhone')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('personalPhone')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.personalPhone}
                        </div>
                        <button
                          onClick={() => toggleEditMode('personalPhone')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar teléfono"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Imagen de Perfil */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-[#3ea0c9] mb-4">
                  Imagen de Perfil
                </h4>
                <div className="flex items-center space-x-6">
                  {/* Image Display */}
                  <div className="relative">
                    {user?.profileImageUrl ? (
                      <div className="relative group">
                        <Image
                          src={user.profileImageUrl}
                          alt={`${user.fullName} current profile`}
                          width={96}
                          height={96}
                          className="w-24 h-24 rounded-full object-cover border-2 border-[#3ea0c9] group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black bg-opacity-50 rounded-full p-2">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#0b1e34] border-2 border-[#3ea0c9] flex items-center justify-center">
                        <svg className="w-10 h-10 text-[#B7C2D6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Download Controls */}
                  <div className="space-y-3">
                    {user?.profileImageUrl ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            // Create a temporary link to download the image
                            const link = document.createElement('a');
                            link.href = user.profileImageUrl!;
                            link.download = `perfil-${user.fullName.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="inline-flex items-center px-4 py-2 border-2 border-[#3ea0c9] rounded-md text-sm font-medium text-white bg-transparent hover:bg-[#3ea0c9] hover:bg-opacity-20 cursor-pointer transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Descargar Imagen
                        </button>
                        <button
                          onClick={() => window.open(user.profileImageUrl!, '_blank')}
                          className="inline-flex items-center px-4 py-2 border-2 border-[#90e2f8] rounded-md text-sm font-medium text-white bg-transparent hover:bg-[#90e2f8] hover:bg-opacity-20 cursor-pointer transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver en Nueva Pestaña
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-[#B7C2D6] mb-2">El usuario no ha subido una imagen de perfil</p>
                        <p className="text-xs text-[#B7C2D6]">No hay imagen disponible para descargar</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-[#B7C2D6]">
                    <strong>Estado:</strong> {user?.profileImageUrl ? 'Imagen disponible para descargar' : 'Sin imagen de perfil'}
                  </p>
                  <p className="text-xs text-[#B7C2D6] mt-1">
                    Descarga esta imagen para subirla manualmente a Facebook Business Manager
                  </p>
                  {user?.profileImageUrl && (
                    <p className="text-xs text-[#3ea0c9] mt-1">
                      <strong>URL de la imagen:</strong> <span className="break-all">{user.profileImageUrl}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Información de Empresa */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-[#3ea0c9] mb-4">
                  Información de Empresa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">
                      Nombre de Empresa
                    </label>
                    {editModes.businessName ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={editValues.businessName}
                          onChange={(e) => handleEditChange('businessName', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        />
                        <button
                          onClick={() => saveField('businessName')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('businessName')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.businessName}
                        </div>
                        <button
                          onClick={() => toggleEditMode('businessName')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar nombre empresa"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">
                      Tipo de Negocio
                    </label>
                    {editModes.businessType ? (
                      <div className="mt-1 flex space-x-2">
                        <select
                          value={editValues.businessType}
                          onChange={(e) => handleEditChange('businessType', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        >
                          <option value="barbería">Barbería</option>
                          <option value="clínica">Clínica</option>
                          <option value="tienda online">Tienda Online</option>
                          <option value="restaurante">Restaurante</option>
                          <option value="gimnasio">Gimnasio</option>
                          <option value="escuela">Escuela</option>
                          <option value="consultoría">Consultoría</option>
                          <option value="agencia">Agencia</option>
                          <option value="otro">Otro</option>
                        </select>
                        <button
                          onClick={() => saveField('businessType')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('businessType')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.businessType}
                        </div>
                        <button
                          onClick={() => toggleEditMode('businessType')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar tipo negocio"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative col-span-full">
                    <label className="block text-sm font-medium text-white mb-2">
                      Dirección o Link de Ubicación
                    </label>
                    {editModes.address ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={editValues.address}
                          onChange={(e) => handleEditChange('address', e.target.value)}
                          placeholder="Dirección física o link de Google Maps"
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        />
                        <button
                          onClick={() => saveField('address')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('address')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.address || 'No especificado'}
                        </div>
                        <button
                          onClick={() => toggleEditMode('address')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar dirección"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuración de WhatsApp */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-[#3ea0c9] mb-4">
                  Configuración de WhatsApp Business
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">
                      Número de WhatsApp
                    </label>
                    {editModes.whatsappNumber ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="tel"
                          value={editValues.whatsappNumber}
                          onChange={(e) => handleEditChange('whatsappNumber', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        />
                        <button
                          onClick={() => saveField('whatsappNumber')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('whatsappNumber')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          +{user.whatsappNumber}
                        </div>
                        <button
                          onClick={() => toggleEditMode('whatsappNumber')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar WhatsApp"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">
                      Nombre de Visualización
                    </label>
                    {editModes.whatsappDisplayName ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={editValues.whatsappDisplayName}
                          onChange={(e) => handleEditChange('whatsappDisplayName', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        />
                        <button
                          onClick={() => saveField('whatsappDisplayName')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('whatsappDisplayName')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.whatsappDisplayName}
                        </div>
                        <button
                          onClick={() => toggleEditMode('whatsappDisplayName')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar nombre display"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative col-span-full">
                    <label className="block text-sm font-medium text-white mb-2">
                      Categoría del Negocio
                    </label>
                    {editModes.businessCategory ? (
                      <div className="mt-1 flex space-x-2">
                        <select
                          value={editValues.businessCategory}
                          onChange={(e) => handleEditChange('businessCategory', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                        >
                          {getBusinessCategoryOptions().map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => saveField('businessCategory')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('businessCategory')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.businessCategory}
                        </div>
                        <button
                          onClick={() => toggleEditMode('businessCategory')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar categoría"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Descripción de Empresa */}
                  <div className="relative col-span-full">
                    <label className="block text-sm font-medium text-white mb-2">
                      Descripción de Empresa
                    </label>
                    {editModes.businessDescription ? (
                      <div className="mt-1 flex space-x-2">
                        <textarea
                          value={editValues.businessDescription}
                          onChange={(e) => handleEditChange('businessDescription', e.target.value)}
                          rows={3}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                          placeholder="Describe brevemente tu empresa y servicios..."
                        />
                        <button
                          onClick={() => saveField('businessDescription')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('businessDescription')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.businessDescription || 'No especificada'}
                        </div>
                        <button
                          onClick={() => toggleEditMode('businessDescription')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar descripción"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-[#B7C2D6]">
                      Esta descripción aparecerá en Facebook Business
                    </p>
                  </div>

                  {/* Sitio Web */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-white mb-2">
                      Sitio Web
                    </label>
                    {editModes.website ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="url"
                          value={editValues.website}
                          onChange={(e) => handleEditChange('website', e.target.value)}
                          className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                          style={{ backgroundColor: '#000e24' }}
                          placeholder="https://www.tu-empresa.com"
                        />
                        <button
                          onClick={() => saveField('website')}
                          className="w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('website')}
                          className="w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border-2 border-[#3ea0c9] bg-[#000e24] text-white rounded-lg flex-1">
                          {user.website || 'No especificado'}
                        </div>
                        <button
                          onClick={() => toggleEditMode('website')}
                          className="ml-2 p-2 text-[#B7C2D6] hover:text-white cursor-pointer transition-colors"
                          title="Editar sitio web"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Estado del Usuario */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-white mb-2">
                      Estado del Usuario
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                      style={{ backgroundColor: '#000e24' }}
                    >
                      {getStatusOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* WhatsApp Business API Configuration - Editable fields */}
                  <div className="relative">
                    <label htmlFor="wabaId" className="block text-sm font-medium text-white mb-2">
                      WhatsApp Business Account ID (WABA ID)
                    </label>
                    <div className="mt-1 flex items-center justify-between">
                      <input
                        id="wabaId"
                        name="wabaId"
                        type="text"
                        value={formData.wabaId}
                        onChange={handleChange}
                        placeholder="Ingrese WABA ID"
                        className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                        style={{ backgroundColor: '#000e24' }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#B7C2D6]">
                      ID único asignado por Meta al WABA
                    </p>
                  </div>

                  <div className="relative">
                    <label htmlFor="phoneId" className="block text-sm font-medium text-white mb-2">
                      Phone Number ID
                    </label>
                    <div className="mt-1 flex items-center justify-between">
                      <input
                        id="phoneId"
                        name="phoneId"
                        type="text"
                        value={formData.phoneId}
                        onChange={handleChange}
                        placeholder="Ingrese Phone ID"
                        className="block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                        style={{ backgroundColor: '#000e24' }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#B7C2D6]">
                      ID del número dentro del WABA
                    </p>
                  </div>

                  <div className="relative">
                    <label htmlFor="accessToken" className="block text-sm font-medium text-white mb-2">
                      Access Token
                    </label>
                    <textarea
                      id="accessToken"
                      name="accessToken"
                      value={formData.accessToken}
                      onChange={handleChange}
                      placeholder="Token de Meta"
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                      style={{ backgroundColor: '#000e24' }}
                    />
                    <p className="mt-1 text-xs text-[#B7C2D6]">
                      Token de acceso generado por Facebook Business Manager
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-6 bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded">
                    {success}
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/dashboard')}
                    className="px-4 py-2 border-2 border-[#3ea0c9] rounded-md text-sm font-medium text-white bg-transparent hover:bg-[#3ea0c9] hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3ea0c9] cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    {updating ? 'Actualizando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}