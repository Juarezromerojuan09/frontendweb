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
  businessName: string
  businessType: string
  whatsappNumber: string
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre Completo
                  </label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed">
                    {user.fullName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo Electrónico
                  </label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed">
                    {user.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre de Empresa
                  </label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed">
                    {user.businessName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Número de WhatsApp
                  </label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded-md sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed">
                    +{user.whatsappNumber}
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

                  {/* WhatsApp Business API Configuration */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      Configuración de WhatsApp Business API
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="wabaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          WhatsApp Business Account ID (WABA ID)
                        </label>
                        <input
                          id="wabaId"
                          name="wabaId"
                          type="text"
                          value={formData.wabaId}
                          onChange={handleChange}
                          placeholder="Ingrese WABA ID"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          ID único asignado por Meta al WABA
                        </p>
                      </div>

                      <div>
                        <label htmlFor="phoneId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone Number ID
                        </label>
                        <input
                          id="phoneId"
                          name="phoneId"
                          type="text"
                          value={formData.phoneId}
                          onChange={handleChange}
                          placeholder="Ingrese Phone ID"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          ID del número dentro del WABA
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Access Token
                      </label>
                      <textarea
                        id="accessToken"
                        name="accessToken"
                        value={formData.accessToken}
                        onChange={handleChange}
                        placeholder="Además el Access Token generado por Meta para este WABA..."
                        rows={4}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Token de acceso generado por Facebook Business Manager
                      </p>
                    </div>
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