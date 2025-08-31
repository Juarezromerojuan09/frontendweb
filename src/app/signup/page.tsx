'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    businessName: '',
    businessType: '',
    address: '',
    fullName: '',
    personalPhone: '',
    whatsappNumber: '',
    whatsappDisplayName: '',
    businessCategory: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const businessCategories = [
    'salud', 'belleza', 'educación', 'negocio', 'servicios', 'entretenimiento', 'viajes', 'finanzas', 'tecnología', 'otro'
  ]

  const businessTypes = [
    'barbería', 'clínica', 'tienda online', 'restaurante', 'gimnasio', 'escuela', 'consultoría', 'agencia', 'otro'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await axios.post(`${apiUrl}/api/auth/register`, formData)

      if (response.data.success) {
        setSuccess('Registro exitoso. Tu cuenta está pendiente de verificación. Te contactaremos pronto.')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError('Error en el registro')
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error de registro')
      } else {
        setError('Error de registro')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Registro de Usuario
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Crea una nueva cuenta para tu negocio
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Información de la empresa */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información de la Empresa</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del negocio
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="Ej. Mi Empresa S.A."
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de negocio
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  value={formData.businessType}
                  onChange={handleChange}
                >
                  <option value="">Selecciona tipo de negocio</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dirección o link de ubicación (opcional)
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="Ej. Calle Principal 123 o https://maps.google.com/..."
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Datos de contacto del dueño */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Datos de Contacto</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre completo
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="Juan Pérez"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="tu@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="personalPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teléfono personal
                </label>
                <input
                  id="personalPhone"
                  name="personalPhone"
                  type="tel"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="+521234567890"
                  value={formData.personalPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Datos del número de WhatsApp */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Configuración de WhatsApp Business</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de teléfono para el bot
                </label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="+521234567890"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-gray-500">Asegúrate de que no esté vinculado a WhatsApp normal</p>
              </div>
              <div>
                <label htmlFor="whatsappDisplayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre de visualización en WhatsApp
                </label>
                <input
                  id="whatsappDisplayName"
                  name="whatsappDisplayName"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="Mi Empresa Atención"
                  value={formData.whatsappDisplayName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="businessCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoría del negocio
                </label>
                <select
                  id="businessCategory"
                  name="businessCategory"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  value={formData.businessCategory}
                  onChange={handleChange}
                >
                  <option value="">Selecciona categoría</option>
                  {businessCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Credenciales de acceso */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Credenciales de Acceso</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="tuusuario"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md"
                  placeholder="Contraseña segura"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-sm text-center">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-indigo-600 hover:text-indigo-500 text-sm"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  )
}