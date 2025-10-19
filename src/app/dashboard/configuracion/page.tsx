'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

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
  createdAt: string
  googleEmail?: string
  isGoogleVerified?: boolean
}

export default function ConfiguracionPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [verifyingGoogle, setVerifyingGoogle] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<{isGoogleVerified: boolean; googleEmail?: string}>({
    isGoogleVerified: false,
    googleEmail: undefined
  });
  const router = useRouter()

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
    website: false
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
          fullName: userData.fullName,
          email: userData.email,
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

  // Función para obtener el estado de verificación de Google
  const fetchGoogleStatus = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      
      console.log('🔍 INICIO fetchGoogleStatus')
      console.log('📡 API URL:', apiUrl)
      console.log('🔑 Token disponible:', !!token)
      
      if (!token) {
        console.warn('❌ No hay token disponible para obtener estado de Google')
        // En caso de no tener token, mostrar el botón para permitir la verificación
        setGoogleStatus({
          isGoogleVerified: false,
          googleEmail: undefined
        })
        return
      }

      console.log('🔄 Haciendo request a /api/auth/google/status...')
      const response = await axios.get(`${apiUrl}/api/auth/google/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      console.log('✅ Respuesta completa de estado Google:', response)
      console.log('📊 Datos de respuesta:', response.data)

      if (response.data.success) {
        console.log('🎯 Google Status - Verificado:', response.data.isGoogleVerified)
        console.log('📧 Google Email:', response.data.googleEmail)
        setGoogleStatus({
          isGoogleVerified: response.data.isGoogleVerified,
          googleEmail: response.data.googleEmail
        })
      } else {
        console.log('⚠️ Respuesta no exitosa de Google status')
        // Si la respuesta no es exitosa, mostrar el botón
        setGoogleStatus({
          isGoogleVerified: false,
          googleEmail: undefined
        })
      }
    } catch (err: any) {
      console.error('❌ ERROR CRÍTICO obteniendo estado de Google:', err)
      console.error('📋 Detalles del error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      })
      // En caso de error, asumir que no está verificado para mostrar el botón
      setGoogleStatus({
        isGoogleVerified: false,
        googleEmail: undefined
      })
    } finally {
      console.log('🏁 FIN fetchGoogleStatus')
    }
  }, [])

  useEffect(() => {
    console.log('🔍 useEffect ejecutándose - Verificando autenticación...')
    if (checkAuth()) {
      console.log('✅ Usuario autenticado, cargando datos...')
      fetchUser()
      fetchGoogleStatus()
    } else {
      console.log('❌ Usuario no autenticado, redirigiendo a login')
    }
  }, [checkAuth, fetchUser, fetchGoogleStatus])

  // Efecto para manejar parámetros de URL después de la verificación de Google
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const googleVerified = urlParams.get('google_verified')
    const error = urlParams.get('error')

    if (googleVerified === 'true') {
      setSuccess('Cuenta Google verificada correctamente')
      fetchGoogleStatus()
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (error) {
      setError('Error al verificar cuenta Google. Intenta nuevamente.')
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [fetchGoogleStatus])

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
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);

      // Create image preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post(`${apiUrl}/api/auth/upload-profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.imageUrl;
      } else {
        throw new Error('Error uploading image');
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Error subiendo imagen de perfil');
    }
  };

  const updateProfileImage = async () => {
    if (!newImageFile) {
      setError('Seleccione una imagen primero');
      return;
    }

    try {
      const imageUrl = await uploadImageToCloudinary(newImageFile);

      // Update user data with new image URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!userId) {
        setError('ID de usuario no encontrado');
        return;
      }

      const updateData = { profileImageUrl: imageUrl };

      const response = await axios.patch<UpdateResponse>(
        `${apiUrl}/api/auth/user/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success && user) {
        setUser({
          ...user,
          profileImageUrl: imageUrl
        });
        setSuccess('Imagen de perfil actualizada correctamente');
        setNewImageFile(null);
        setImagePreview('');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error actualizando imagen de perfil');
    }
  };

  const removeImage = () => {
    setNewImageFile(null);
    setImagePreview('');
  };

  // Función para iniciar verificación de Google
  const verifyGoogleAccount = async () => {
    try {
      setVerifyingGoogle(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.')
        setVerifyingGoogle(false)
        return
      }

      console.log('🚀 Iniciando verificación de Google OAuth...')
      const response = await axios.get(`${apiUrl}/api/auth/google/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      console.log('✅ Respuesta de verificación Google:', response.data)

      if (response.data.success && response.data.authorizeUrl) {
        // Redirigir a Google OAuth
        console.log('🔗 Redirigiendo a:', response.data.authorizeUrl)
        window.location.href = response.data.authorizeUrl
      } else {
        setError('No se pudo obtener la URL de autorización de Google. Verifica la configuración del servidor.')
        setVerifyingGoogle(false)
      }
    } catch (err: any) {
      console.error('❌ Error iniciando verificación de Google:', err)
      
      // Mensaje de error más específico
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.')
      } else if (err.response?.status === 500) {
        setError('Error del servidor. Verifica que las credenciales de Google OAuth estén configuradas correctamente.')
      } else {
        setError('Error iniciando verificación de Google. Verifica tu conexión a internet.')
      }
      
      setVerifyingGoogle(false)
    }
  }

  // Función para revocar verificación de Google
  const revokeGoogleAccount = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      
      const response = await axios.delete(`${apiUrl}/api/auth/google/revoke`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.success) {
        setSuccess('Cuenta Google desconectada correctamente')
        setGoogleStatus({
          isGoogleVerified: false,
          googleEmail: undefined
        })
        // Actualizar usuario local si es necesario
        if (user) {
          setUser({
            ...user,
            isGoogleVerified: false,
            googleEmail: undefined
          })
        }
      }
    } catch (err) {
      setError('Error desconectando cuenta Google')
    }
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
      {/* Circuit Pattern Background with longer lines and hollow circles */}
      <div className="absolute inset-0 opacity-40">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Radial gradient for fading center */}
            <radialGradient id="fadeCenter" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#000e24" stopOpacity="0" />
              <stop offset="40%" stopColor="#000e24" stopOpacity="1" />
            </radialGradient>
            <pattern id="circuitPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              {/* Horizontal lines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="#3ea0c9" strokeWidth="0.5" strokeDasharray="2,4" />
              <line x1="0" y1="40" x2="100" y2="40" stroke="#3ea0c9" strokeWidth="0.5" strokeDasharray="2,4" />
              <line x1="0" y1="60" x2="100" y2="60" stroke="#3ea0c9" strokeWidth="0.5" strokeDasharray="2,4" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="#3ea0c9" strokeWidth="0.5" strokeDasharray="2,4" />
              
              {/* Vertical lines */}
              <line x1="20" y1="0" x2="20" y2="100" stroke="#3ea0c9" strokeWidth="0.5" strokeDasharray="2,4" />
              <line x1="40" y1="0" x2="40" y2="100" stroke="#3ea0c9" strokeWidth="0.5" strokeDasharray="2,4" />
              <line x1="60" y1="0" x2="60" y2="100" stroke="#3ea0c9" strokeWidth="0.5" strokeDasharray="2,4" />
              <line x1="80" y1="0" x2="80" y2="100" stroke="#3ea0c9" strokeWidth="0.5" strokeDasharray="2,4" />
              
              {/* Hollow circles at intersections */}
              <circle cx="20" cy="20" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="40" cy="20" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="60" cy="20" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="80" cy="20" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              
              <circle cx="20" cy="40" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="60" cy="40" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="80" cy="40" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              
              <circle cx="20" cy="60" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="40" cy="60" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="60" cy="60" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="80" cy="60" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              
              <circle cx="20" cy="80" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="40" cy="80" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="60" cy="80" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
              <circle cx="80" cy="80" r="2" fill="none" stroke="#90e2f8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fadeCenter)" />
          <rect width="100%" height="100%" fill="url(#circuitPattern)" opacity="0.3" />
        </svg>
      </div>

      <div className="relative z-10 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#B7C2D6]">Configuración</h1>
            <Link 
              href="/dashboard"
              className="bg-[#012f78] hover:bg-[#3ea0c9] text-[#B7C2D6] px-4 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </Link>
          </div>

          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-6">
                <div className="text-center">
                  <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-[#90e2f8] mb-4">
                    {user.profileImageUrl ? (
                      <Image
                        src={user.profileImageUrl}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#012f78] flex items-center justify-center">
                        <span className="text-4xl text-[#B7C2D6] font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
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
                      Cambiar Imagen
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

                {/* Navigation */}
                <div className="mt-8 space-y-2">
                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 bg-[#3ea0c9] text-[#000e24] font-medium px-4 py-3 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Perfil</span>
                  </Link>
                  
                  {/* Additional navigation options can be added here later */}
                  <div className="text-[#B7C2D6] text-sm px-4 py-2 opacity-70">
                    Más opciones próximamente...
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
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

                    <div className="flex items-center space-x-6">
                      {/* Profile Image in Main Content */}
                      <div className="flex-shrink-0">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#90e2f8]">
                          {user.profileImageUrl ? (
                            <Image
                              src={user.profileImageUrl}
                              alt="Profile"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#012f78] flex items-center justify-center">
                              <span className="text-xl text-[#B7C2D6] font-bold">
                                {user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
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
                              <div className="flex items-center space-x-2">
                                <span className="text-[#B7C2D6]">{user.email}</span>
                                {googleStatus.isGoogleVerified && (
                                  <span
                                    className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                                    title="Cuenta Google verificada"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Verificado</span>
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => toggleEditMode('email')}
                                className="text-[#90e2f8] hover:text-[#3ea0c9]"
                              >
                                <PencilIcon />
                              </button>
                              
                              {/* Botón de verificación Google al lado del email */}
                              {(() => {
                                console.log('🔍 [BOTÓN EMAIL] Evaluando condición:')
                                console.log('   - googleStatus.isGoogleVerified:', googleStatus.isGoogleVerified)
                                console.log('   - googleStatus:', googleStatus)
                                console.log('   - ¿Mostrar botón?', !googleStatus.isGoogleVerified)
                                
                                return !googleStatus.isGoogleVerified && (
                                  <button
                                    onClick={verifyGoogleAccount}
                                    disabled={verifyingGoogle}
                                    className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 disabled:opacity-50"
                                    title="Verificar con Google Calendar"
                                  >
                                    {verifyingGoogle ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        <span>Verificando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                                          <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                          <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                          <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                          <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        <span>Verificar Google</span>
                                      </>
                                    )}
                                  </button>
                                )
                              })()}
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

                  {/* Google Calendar Integration */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-[#B7C2D6] mb-4 border-b border-[#3ea0c9] pb-2">
                      Integración con Google Calendar
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[#012f78] rounded-lg border border-[#3ea0c9]">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-[#B7C2D6] font-medium">Google Calendar</h4>
                            <p className="text-[#90e2f8] text-sm">
                              {googleStatus.isGoogleVerified
                                ? `Conectado con: ${googleStatus.googleEmail}`
                                : 'Conecta tu cuenta de Google para agendar citas automáticamente'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {(() => {
                          console.log('🔍 [BOTÓN CALENDAR] Evaluando condición:')
                          console.log('   - googleStatus.isGoogleVerified:', googleStatus.isGoogleVerified)
                          console.log('   - ¿Mostrar botón conectar?', !googleStatus.isGoogleVerified)
                          
                          return !googleStatus.isGoogleVerified ? (
                            <button
                              onClick={verifyGoogleAccount}
                              disabled={verifyingGoogle}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                            >
                              {verifyingGoogle ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Conectando...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
                                  </svg>
                                  <span>Conectar Google</span>
                                </>
                              )}
                            </button>
                          ) : (
                          <button
                            onClick={revokeGoogleAccount}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            <span>Desconectar</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="text-[#90e2f8] text-sm bg-[#012f78] p-3 rounded-lg border border-[#3ea0c9]">
                        <p className="font-medium mb-1">Beneficios de conectar Google Calendar:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Agendamiento automático de citas en tu calendario personal</li>
                          <li>Sincronización en tiempo real de disponibilidad</li>
                          <li>Recordatorios automáticos para tus clientes</li>
                          <li>Evita conflictos de horarios</li>
                        </ul>
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