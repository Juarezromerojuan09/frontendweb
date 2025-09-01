'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Clear any existing authentication data on component mount
  useEffect(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await axios.post(`${apiUrl}/api/auth/login`, formData)

      if (response.data.token && response.data.user) {
        // Guardar token de autenticación y datos del usuario
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userId', response.data.user.id)
        localStorage.setItem('userName', response.data.user.username)
        localStorage.setItem('userEmail', response.data.user.email)
        router.push('/dashboard')
      } else {
        setError('Respuesta inválida del servidor')
      }
    } catch (err: unknown) {
      // Clear localStorage on error to ensure clean state
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      localStorage.removeItem('userEmail')
      
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 'Error de autenticación'
        setError(errorMessage)
        
        // Log detailed error for debugging
        console.error('Login error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: errorMessage
        })
      } else {
        setError('Error de autenticación')
        console.error('Unknown login error:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Admin Login Button - Top Right Corner */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => router.push('/admin/login')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Panel Admin
        </button>
      </div>

      <div className="flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
         <div>
           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
             Iniciar Sesión
           </h2>
           <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
             Accede a tu cuenta personalizada
           </p>
         </div>

         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
           <div className="rounded-md shadow-sm -space-y-px">
             <div>
               <label htmlFor="username" className="sr-only">
                 Usuario
               </label>
               <input
                 id="username"
                 name="username"
                 type="text"
                 required
                 className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                 placeholder="Usuario"
                 value={formData.username}
                 onChange={handleChange}
               />
             </div>
             <div>
               <label htmlFor="password" className="sr-only">
                 Contraseña
               </label>
               <input
                 id="password"
                 name="password"
                 type="password"
                 required
                 className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                 placeholder="Contraseña"
                 value={formData.password}
                 onChange={handleChange}
               />
             </div>
           </div>

           {error && (
             <div className="text-red-500 text-sm text-center">
               {error}
             </div>
           )}

           <div>
             <button
               type="submit"
               disabled={loading}
               className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
             </button>
           </div>
         <div className="text-center">
           <button
             onClick={() => router.push('/signup')}
             className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
           >
             Registrarse
           </button>
         </div>
       </form>
       </div>
      </div>
    </div>
  )
}