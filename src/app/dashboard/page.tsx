'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  name: string;
  email: string;
  id: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/login')
      return
    }

    // Aquí se verificaría el token con el backend
    // Por ahora, simulamos un usuario autenticado
    setUser({
      name: 'Usuario Demo',
      email: 'usuario@demo.com',
      id: 1
    })
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            ¡Bienvenido a tu página personalizada!
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Información del Usuario
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p><strong>Nombre:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>ID:</strong> {user?.id}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Contenido Personalizado
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Este es tu espacio personalizado. Aquí puedes agregar contenido específico
              para este usuario registrado.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}