'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  _id: string
  fullName: string
  email: string
  personalPhone: string
  businessName: string
  businessType: string
  whatsappNumber: string
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
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchUsers()
  }, [])

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

  const checkAuth = () => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      router.push('/admin/login')
    }
  }

  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const adminToken = localStorage.getItem('adminToken')
      const response = await axios.get(`${apiUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      })

      if (response.data.success) {
        setUsers(response.data.users)
        setFilteredUsers(response.data.users)
      } else {
        setError('Error al obtener usuarios')
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else {
        setError('Error al conectar con el servidor')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres aprobar este usuario?')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const adminToken = localStorage.getItem('adminToken')

      const response = await axios.patch(
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
    } catch (err: any) {
      alert('Error al aprobar usuario')
    }
  }

  const getStatusBadge = (status: string) => {
    let bgColor = '', text = ''

    switch (status) {
      case 'pending_verification':
        bgColor = 'bg-yellow-100 text-yellow-800'
        text = 'Pendiente'
        break
      case 'active':
        bgColor = 'bg-green-100 text-green-800'
        text = 'Activo'
        break
      case 'suspended':
        bgColor = 'bg-red-100 text-red-800'
        text = 'Suspendido'
        break
      default:
        bgColor = 'bg-gray-100 text-gray-800'
        text = 'Desconocido'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {text}
      </span>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
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
                onClick={() => router.push('/login')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ← Volver al sitio
              </button>
              <button
                onClick={handleLogout}
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Administración</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Gestiona los usuarios registrados en la plataforma
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{users.length}</div>
              <div className="text-sm text-gray-500">Usuarios totales</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Registrado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Tel: {user.personalPhone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.businessName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.businessType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          +{user.whatsappNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {user.status === 'pending_verification' && (
                            <button
                              onClick={() => handleApproveUser(user._id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Aprobar
                            </button>
                          )}
                          <Link
                            href={`/admin/dashboard/edit/${user._id}`}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
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
              <div className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No se encontraron usuarios con esa búsqueda' : 'No hay usuarios registrados'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}