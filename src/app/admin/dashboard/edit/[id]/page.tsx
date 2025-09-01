'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useRouter, useParams } from 'next/navigation'

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

  const PencilIcon = ({ className }: { className?: string }) => (
    <svg className={`w-4 h-4 ${className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuario...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Usuario no encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">Synaptech Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ← Volver al Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken')
                  router.push('/admin/login')
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Editar Usuario: {user.fullName}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {user.businessName} - {user.email}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Información del Usuario
              </h3>
            </div>

            <div className="p-6">
              {/* Información Personal */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Información Personal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre Completo
                    </label>
                    {editModes.fullName ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={editValues.fullName}
                          onChange={(e) => handleEditChange('fullName', e.target.value)}
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={() => saveField('fullName')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('fullName')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          {user.fullName}
                        </div>
                        <button
                          onClick={() => toggleEditMode('fullName')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Editar nombre"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo Electrónico
                    </label>
                    {editModes.email ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="email"
                          value={editValues.email}
                          onChange={(e) => handleEditChange('email', e.target.value)}
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={() => saveField('email')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('email')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          {user.email}
                        </div>
                        <button
                          onClick={() => toggleEditMode('email')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Editar email"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Teléfono Personal
                    </label>
                    {editModes.personalPhone ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="tel"
                          value={editValues.personalPhone}
                          onChange={(e) => handleEditChange('personalPhone', e.target.value)}
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={() => saveField('personalPhone')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('personalPhone')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          {user.personalPhone}
                        </div>
                        <button
                          onClick={() => toggleEditMode('personalPhone')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Editar teléfono"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de Empresa */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Información de Empresa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre de Empresa
                    </label>
                    {editModes.businessName ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={editValues.businessName}
                          onChange={(e) => handleEditChange('businessName', e.target.value)}
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={() => saveField('businessName')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('businessName')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          {user.businessName}
                        </div>
                        <button
                          onClick={() => toggleEditMode('businessName')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Editar nombre empresa"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo de Negocio
                    </label>
                    {editModes.businessType ? (
                      <div className="mt-1 flex space-x-2">
                        <select
                          value={editValues.businessType}
                          onChange={(e) => handleEditChange('businessType', e.target.value)}
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('businessType')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          {user.businessType}
                        </div>
                        <button
                          onClick={() => toggleEditMode('businessType')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Editar tipo negocio"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative col-span-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dirección o Link de Ubicación
                    </label>
                    {editModes.address ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={editValues.address}
                          onChange={(e) => handleEditChange('address', e.target.value)}
                          placeholder="Dirección física o link de Google Maps"
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={() => saveField('address')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('address')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          {user.address || 'No especificado'}
                        </div>
                        <button
                          onClick={() => toggleEditMode('address')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Configuración de WhatsApp Business
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Número de WhatsApp
                    </label>
                    {editModes.whatsappNumber ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="tel"
                          value={editValues.whatsappNumber}
                          onChange={(e) => handleEditChange('whatsappNumber', e.target.value)}
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={() => saveField('whatsappNumber')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('whatsappNumber')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          +{user.whatsappNumber}
                        </div>
                        <button
                          onClick={() => toggleEditMode('whatsappNumber')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Editar WhatsApp"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre de Visualización
                    </label>
                    {editModes.whatsappDisplayName ? (
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="text"
                          value={editValues.whatsappDisplayName}
                          onChange={(e) => handleEditChange('whatsappDisplayName', e.target.value)}
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={() => saveField('whatsappDisplayName')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('whatsappDisplayName')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          {user.whatsappDisplayName}
                        </div>
                        <button
                          onClick={() => toggleEditMode('whatsappDisplayName')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Editar nombre display"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative col-span-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Categoría del Negocio
                    </label>
                    {editModes.businessCategory ? (
                      <div className="mt-1 flex space-x-2">
                        <select
                          value={editValues.businessCategory}
                          onChange={(e) => handleEditChange('businessCategory', e.target.value)}
                          className="block w-full px-3 py-2 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          {getBusinessCategoryOptions().map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => saveField('businessCategory')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => cancelEdit('businessCategory')}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <div className="px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                          {user.businessCategory}
                        </div>
                        <button
                          onClick={() => toggleEditMode('businessCategory')}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Editar categoría"
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
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estado del Usuario
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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
                    <label htmlFor="wabaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      ID único asignado por Meta al WABA
                    </p>
                  </div>

                  <div className="relative">
                    <label htmlFor="phoneId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      ID del número dentro del WABA
                    </p>
                  </div>

                  <div className="relative">
                    <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Access Token
                    </label>
                    <textarea
                      id="accessToken"
                      name="accessToken"
                      value={formData.accessToken}
                      onChange={handleChange}
                      placeholder="Token de Meta"
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Token de acceso generado por Facebook Business Manager
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {success}
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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