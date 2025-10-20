'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'

interface ApiResponse {
  success: boolean
  user?: User
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

interface GoogleCredentials {
  client_id?: string
  client_secret?: string
  refresh_token?: string
  access_token?: string
  token_expiry?: string
}

interface User {
  _id: string
  username: string
  email: string
  fullName: string
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
  googleCredentials?: GoogleCredentials
  createdAt: string
  updatedAt?: string
}

export default function Settings() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  // Edit mode states for individual fields
  const [editModes, setEditModes] = useState({
    username: false,
    email: false,
    fullName: false,
    personalPhone: false,
    businessName: false,
    businessType: false,
    address: false,
    whatsappNumber: false,
    whatsappDisplayName: false,
    businessCategory: false,
    businessDescription: false,
    website: false
  })

  // Temporary edit values
  const [editValues, setEditValues] = useState({
    username: '',
    email: '',
    fullName: '',
    personalPhone: '',
    businessName: '',
    businessType: '',
    address: '',
    whatsappNumber: '',
    whatsappDisplayName: '',
    businessCategory: '',
    businessDescription: '',
    website: ''
  })

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return false
    }
    return true
  }, [router])

  const fetchUser = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      
      if (!userId) {
        setError('ID de usuario no encontrado')
        return
      }

      const response = await axios.get<ApiResponse>(`${apiUrl}/api/auth/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.success && response.data.user) {
        const userData = response.data.user
        setUser(userData)

        // Initialize edit values
        setEditValues({
          username: userData.username,
          email: userData.email,
          fullName: userData.fullName,
          personalPhone: userData.personalPhone,
          businessName: userData.businessName,
          businessType: userData.businessType,
          address: userData.address || '',
          whatsappNumber: userData.whatsappNumber,
          whatsappDisplayName: userData.whatsappDisplayName,
          businessCategory: userData.businessCategory,
          businessDescription: userData.businessDescription || '',
          website: userData.website || ''
        })
      }
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        router.push('/login')
      } else {
        setError('Error al obtener información del usuario')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (checkAuth()) {
      fetchUser()
    }
  }, [checkAuth, fetchUser])

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
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!userId) {
        setError('ID de usuario no encontrado')
        return
      }

      const updateData: Record<string, string> = {
        [field]: editValues[field as keyof typeof editValues] as string
      }

      const response = await axios.patch<UpdateResponse>(
        `${apiUrl}/api/auth/user/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewImageFile(file)

      // Create image preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('profileImage', file)

      const response = await axios.post(`${apiUrl}/api/auth/upload-profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.success) {
        return response.data.imageUrl
      } else {
        throw new Error('Error uploading image')
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      throw new Error('Error subiendo imagen de perfil')
    }
  }

  const updateProfileImage = async () => {
    if (!newImageFile) {
      setError('Seleccione una imagen primero')
      return
    }

    try {
      const imageUrl = await uploadImageToCloudinary(newImageFile)

      // Update user data with new image URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!userId) {
        setError('ID de usuario no encontrado')
        return
      }

      const updateData = { profileImageUrl: imageUrl }

      const response = await axios.patch<UpdateResponse>(
        `${apiUrl}/api/auth/user/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success && user) {
        setUser({
          ...user,
          profileImageUrl: imageUrl
        })
        setSuccess('Imagen de perfil actualizada correctamente')
        setNewImageFile(null)
        setImagePreview('')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Error actualizando imagen de perfil')
    }
  }

  const removeImage = () => {
    setNewImageFile(null)
    setImagePreview('')
  }

  const PencilIcon = ({ className }: { className?: string }) => (
    <svg className={`w-4 h-4 ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )

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

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000e24' }}>
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90e2f8] mx-auto"></div>
          <p className="mt-4 text-[#B7C2D6]">Cargando información...</p>
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

      <div className="relative z-50 pt-4 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
            <div className="flex items-center space-x-3 lg:space-x-6">
              <Image
                src="/Logo.png"
                alt="SYNAPBOT"
                width={75}
                height={19}
                className="h-4 sm:h-5 lg:h-6 w-auto"
                priority
              />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#B7C2D6]">Configuración</h1>
            </div>
            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden hamburger-menu p-2"
              >
                <div className={`w-5 h-0.5 bg-[#B7C2D6] mb-1.5 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <div className={`w-5 h-0.5 bg-[#B7C2D6] mb-1.5 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <div className={`w-5 h-0.5 bg-[#B7C2D6] transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-[#012f78] hover:bg-[#3ea0c9] text-[#B7C2D6] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm lg:text-base whitespace-nowrap"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}
            
            {/* Sidebar */}
            <div className={`
              ${mobileMenuOpen ? 'fixed left-0 top-0 h-full w-72 sm:w-80 z-50 transform translate-x-0' : 'fixed -translate-x-full lg:translate-x-0'}
              lg:static lg:w-72 xl:w-80 flex-shrink-0 bg-[#0b1e34] shadow-xl rounded-xl border-2 border-[#3ea0c9] p-4 sm:p-6 transition-transform duration-300 ease-in-out
            `}>
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden absolute top-3 right-3 sm:top-4 sm:right-4 text-[#B7C2D6] hover:text-[#90e2f8] text-xl"
              >
                ×
              </button>
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-6">
                <div className="text-center">
                  <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-[#90e2f8] mb-4 bg-[#012f78]">
                    {user.profileImageUrl ? (
                      <Image
                        src={user.profileImageUrl}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.profile-fallback') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${user.profileImageUrl ? 'profile-fallback hidden' : ''}`}>
                      <span className="text-4xl text-[#B7C2D6] font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-[#B7C2D6] mb-2">{user.fullName}</h2>
                  <p className="text-[#90e2f8] text-sm mb-6">{user.businessName}</p>

                  {/* Profile Image Upload */}
                  <div className="space-y-4">
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="profileImage"
                      className="block w-full bg-[#012f78] hover:bg-[#3ea0c9] text-[#B7C2D6] text-center py-2 px-4 rounded-lg cursor-pointer transition-colors"
                    >
                      Cambiar foto de perfil
                    </label>

                    {imagePreview && (
                      <div className="space-y-2">
                        <div className="relative mx-auto w-20 h-20 rounded-full overflow-hidden border-2 border-[#90e2f8]">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={updateProfileImage}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={removeImage}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Menu */}
                <div className="mt-6 bg-[#012f78] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-4">
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/settings')}
                      className="w-full bg-[#0073ba] hover:bg-[#005a92] text-white py-2 px-4 rounded-md transition-colors cursor-pointer text-left"
                    >
                      Perfil
                    </button>
                    <button
                      onClick={() => router.push('/settings/bot')}
                      className="w-full bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] py-2 px-4 rounded-md transition-colors cursor-pointer text-left"
                    >
                      Configuración Bot
                    </button>
                    <button
                      onClick={() => router.push('/settings/bot-flow')}
                      className="w-full bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] py-2 px-4 rounded-md transition-colors cursor-pointer text-left"
                    >
                      Flujo del Bot
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9]">
                {/* Header */}
                <div className="bg-[#012f78] px-6 py-4 border-b border-[#3ea0c9]">
                  <h2 className="text-xl font-semibold text-[#B7C2D6]">Información del Perfil</h2>
                  <p className="text-[#90e2f8] text-sm">Actualiza tu información personal y de negocio</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Success/Error Messages */}
                  {success && (
                    <div className="bg-green-600 text-white px-4 py-2 rounded mb-4">
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-600 text-white px-4 py-2 rounded mb-4">
                      {error}
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-[#B7C2D6] mb-4 border-b border-[#3ea0c9] pb-2">
                      Información Personal
                    </h3>

                    <div className="space-y-4">
                      {/* Username */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Username:</label>
                        {editModes.username ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValues.username}
                              onChange={(e) => handleEditChange('username', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            />
                            <button
                              onClick={() => saveField('username')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('username')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">{user.username}</span>
                            <button
                              onClick={() => toggleEditMode('username')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Email:</label>
                        {editModes.email ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="email"
                              value={editValues.email}
                              onChange={(e) => handleEditChange('email', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            />
                            <button
                              onClick={() => saveField('email')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('email')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">{user.email}</span>
                            <button
                              onClick={() => toggleEditMode('email')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                            {/* Botón Verificar - Solo visible si las credenciales de Google están vacías o no existen */}
                            {(!user.googleCredentials ||
                              !user.googleCredentials.client_id ||
                              !user.googleCredentials.client_secret ||
                              !user.googleCredentials.refresh_token) && (
                              <button
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                                    const token = localStorage.getItem('token');
                                    
                                    if (!token) {
                                      setError('No estás autenticado. Por favor, inicia sesión nuevamente.');
                                      return;
                                    }

                                    // Redirigir directamente al endpoint de Google OAuth
                                    // El backend manejará la autenticación y redirección a Google
                                    window.location.href = `${apiUrl}/api/auth/google`;
                                  } catch (error) {
                                    console.error('Error al iniciar autenticación de Google:', error);
                                    setError('Error al conectar con Google. Intenta nuevamente.');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                disabled={loading}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm ml-2 disabled:opacity-50"
                              >
                                {loading ? 'Cargando...' : 'Verificar'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Full Name */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Nombre Completo:</label>
                        {editModes.fullName ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValues.fullName}
                              onChange={(e) => handleEditChange('fullName', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            />
                            <button
                              onClick={() => saveField('fullName')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('fullName')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">{user.fullName}</span>
                            <button
                              onClick={() => toggleEditMode('fullName')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Personal Phone */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Teléfono Personal:</label>
                        {editModes.personalPhone ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="tel"
                              value={editValues.personalPhone}
                              onChange={(e) => handleEditChange('personalPhone', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            />
                            <button
                              onClick={() => saveField('personalPhone')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('personalPhone')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">{user.personalPhone}</span>
                            <button
                              onClick={() => toggleEditMode('personalPhone')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-[#B7C2D6] mb-4 border-b border-[#3ea0c9] pb-2">
                      Información del Negocio
                    </h3>

                    <div className="space-y-4">
                      {/* Business Name */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Nombre del Negocio:</label>
                        {editModes.businessName ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValues.businessName}
                              onChange={(e) => handleEditChange('businessName', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            />
                            <button
                              onClick={() => saveField('businessName')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('businessName')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">{user.businessName}</span>
                            <button
                              onClick={() => toggleEditMode('businessName')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Business Type */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Tipo de Negocio:</label>
                        {editModes.businessType ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <select
                              value={editValues.businessType}
                              onChange={(e) => handleEditChange('businessType', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            >
                              <option value="individual">Individual</option>
                              <option value="empresa">Empresa</option>
                              <option value="organización">Organización</option>
                              <option value="clínica">Clínica</option>
                            </select>
                            <button
                              onClick={() => saveField('businessType')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('businessType')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6] capitalize">{user.businessType}</span>
                            <button
                              onClick={() => toggleEditMode('businessType')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Dirección:</label>
                        {editModes.address ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValues.address}
                              onChange={(e) => handleEditChange('address', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            />
                            <button
                              onClick={() => saveField('address')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('address')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">{user.address || 'No especificada'}</span>
                            <button
                              onClick={() => toggleEditMode('address')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Business Category */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Categoría:</label>
                        {editModes.businessCategory ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <select
                              value={editValues.businessCategory}
                              onChange={(e) => handleEditChange('businessCategory', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            >
                              {getBusinessCategoryOptions().map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => saveField('businessCategory')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('businessCategory')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6] capitalize">
                              {getBusinessCategoryOptions().find(opt => opt.value === user.businessCategory)?.label || user.businessCategory}
                            </span>
                            <button
                              onClick={() => toggleEditMode('businessCategory')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Business Description */}
                      <div className="flex items-start space-x-3">
                        <label className="text-[#B7C2D6] w-32 pt-2">Descripción:</label>
                        {editModes.businessDescription ? (
                          <div className="flex-1 flex flex-col space-y-2">
                            <textarea
                              value={editValues.businessDescription}
                              onChange={(e) => handleEditChange('businessDescription', e.target.value)}
                              rows={3}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1 resize-none"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => saveField('businessDescription')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => cancelEdit('businessDescription')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-start space-x-2">
                            <span className="text-[#B7C2D6] flex-1">
                              {user.businessDescription || 'No hay descripción'}
                            </span>
                            <button
                              onClick={() => toggleEditMode('businessDescription')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9] mt-1"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Website */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Sitio Web:</label>
                        {editModes.website ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="url"
                              value={editValues.website}
                              onChange={(e) => handleEditChange('website', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                              placeholder="https://"
                            />
                            <button
                              onClick={() => saveField('website')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('website')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">
                              {user.website || 'No especificado'}
                            </span>
                            <button
                              onClick={() => toggleEditMode('website')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Information */}
                  <div>
                    <h3 className="text-lg font-medium text-[#B7C2D6] mb-4 border-b border-[#3ea0c9] pb-2">
                      Información de WhatsApp
                    </h3>

                    <div className="space-y-4">
                      {/* WhatsApp Number */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Número WhatsApp:</label>
                        {editModes.whatsappNumber ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="tel"
                              value={editValues.whatsappNumber}
                              onChange={(e) => handleEditChange('whatsappNumber', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                              placeholder="+521234567890"
                            />
                            <button
                              onClick={() => saveField('whatsappNumber')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('whatsappNumber')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">{user.whatsappNumber}</span>
                            <button
                              onClick={() => toggleEditMode('whatsappNumber')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* WhatsApp Display Name */}
                      <div className="flex items-center space-x-3">
                        <label className="text-[#B7C2D6] w-32">Nombre en WhatsApp:</label>
                        {editModes.whatsappDisplayName ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValues.whatsappDisplayName}
                              onChange={(e) => handleEditChange('whatsappDisplayName', e.target.value)}
                              className="bg-[#012f78] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-1 rounded flex-1"
                            />
                            <button
                              onClick={() => saveField('whatsappDisplayName')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => cancelEdit('whatsappDisplayName')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <span className="text-[#B7C2D6]">{user.whatsappDisplayName}</span>
                            <button
                              onClick={() => toggleEditMode('whatsappDisplayName')}
                              className="text-[#90e2f8] hover:text-[#3ea0c9]"
                            >
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}