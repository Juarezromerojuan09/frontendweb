'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
    businessCategory: '',
    businessDescription: '',
    website: '',
    profileImageUrl: ''
  })
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);

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

  const uploadImageToCloudinary = async (file: File, token: string): Promise<string> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post(`${apiUrl}/api/auth/upload-profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const registrationData = {
        ...formData,
        profileImageUrl: '', // Inicialmente vacío
        whatsappNumber: formData.whatsappNumber,
        whatsappDisplayName: formData.whatsappDisplayName
      };

      // 1. Primero hacer el registro
      const response = await axios.post(`${apiUrl}/api/auth/register`, registrationData);

      if (response.data.success) {
        const { token, user } = response.data;
        
        // 2. Si hay imagen, subirla después del registro usando el token
        let profileImageUrl = '';
        if (profileImage) {
          try {
            profileImageUrl = await uploadImageToCloudinary(profileImage, token);
            
            // 3. Actualizar el usuario con la URL de la imagen
            await axios.patch(`${apiUrl}/api/auth/user/${user.id}`, {
              profileImageUrl
            }, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (imageError) {
            console.error('Error subiendo imagen, pero usuario registrado:', imageError);
            // No fallar el registro completo si hay error en la imagen
          }
        }

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
        <div className="flex items-center">
          <Image
            src="/Logo.png"
            alt="JS SYNAPTECH"
            width={96}
            height={24}
            className="h-6 w-auto"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-8">
          {/* SYNAPBOT Logo */}
          <div className="text-center">
            <div className="mx-auto mb-4">
              <Image
                src="/Logobot.png"
                alt="SYNAPBOT"
                width={96}
                height={24}
                className="mx-auto h-6 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold uppercase tracking-wider text-[#90e2f8]">
              Registro de Usuario
            </h1>
            <p className="mt-2 text-[#90ecf8] text-base">
              Crea una nueva cuenta para tu negocio
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Información de la empresa */}
            <div>
              <h3 className="text-lg font-medium text-[#3ea0c9] mb-4">Información de la Empresa</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-white">
                    Nombre del negocio
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="Ej. Mi Empresa S.A."
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-white">
                    Tipo de negocio
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
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
                  <label htmlFor="address" className="block text-sm font-medium text-white">
                    Dirección o link de ubicación (opcional)
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="Ej. Calle Principal 123 o https://maps.google.com/..."
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Datos de contacto del dueño */}
            <div>
              <h3 className="text-lg font-medium text-[#3ea0c9] mb-4">Datos de Contacto</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-white">
                    Nombre completo
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="Juan Pérez"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Debe ser un correo Gmail para la conexión con Google Calendar
                  </p>
                </div>
                <div>
                  <label htmlFor="personalPhone" className="block text-sm font-medium text-white">
                    Teléfono personal
                  </label>
                  <input
                    id="personalPhone"
                    name="personalPhone"
                    type="tel"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="+521234567890"
                    value={formData.personalPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Datos del número de WhatsApp */}
            <div>
              <h3 className="text-lg font-medium text-[#3ea0c9] mb-4">Configuración de WhatsApp Business</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="whatsappNumber" className="block text-sm font-medium text-white">
                    Número de teléfono para el bot
                  </label>
                  <input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    type="tel"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="+521234567890"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-400">Asegúrate de que no esté vinculado a WhatsApp normal</p>
                </div>
                <div>
                  <label htmlFor="whatsappDisplayName" className="block text-sm font-medium text-white">
                    Nombre de visualización en WhatsApp
                  </label>
                  <input
                    id="whatsappDisplayName"
                    name="whatsappDisplayName"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="Mi Empresa Atención"
                    value={formData.whatsappDisplayName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="businessCategory" className="block text-sm font-medium text-white">
                    Categoría del negocio
                  </label>
                  <select
                    id="businessCategory"
                    name="businessCategory"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    value={formData.businessCategory}
                    onChange={handleChange}
                  >
                    <option value="">Selecciona categoría</option>
                    {businessCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="businessDescription" className="block text-sm font-medium text-white">
                    Descripción de la empresa (opcional)
                  </label>
                  <textarea
                    id="businessDescription"
                    name="businessDescription"
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="Describe brevemente tu empresa y servicios..."
                    value={formData.businessDescription}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-400">Esta descripción aparecerá en Facebook Business</p>
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-white">
                    Sitio web (opcional)
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="https://www.tu-empresa.com"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Credenciales de acceso */}
            <div>
              <h3 className="text-lg font-medium text-[#3ea0c9] mb-4">Credenciales de Acceso</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white">
                    Usuario
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="tuusuario"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="mt-1 block w-full px-3 py-2 border-2 border-[#3ea0c9] placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent sm:text-sm rounded-md"
                    style={{ backgroundColor: '#000e24' }}
                    placeholder="Contraseña segura"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Imagen de Perfil */}
            <div>
              <h3 className="text-lg font-medium text-[#3ea0c9] mb-4">Imagen de Perfil (Opcional)</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-6">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#3ea0c9]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileImage(null);
                          setImagePreview('');
                        }}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0b1e34' }}>
                      <svg className="w-9 h-9" fill="#90e2f8" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="profileImage"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <label
                      htmlFor="profileImage"
                      className="inline-flex items-center px-4 py-2 border-2 border-[#3ea0c9] rounded-md shadow-sm text-sm font-medium text-white bg-transparent hover:bg-[#3ea0c9] hover:bg-opacity-20 cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Subir Imagen
                    </label>
                    <p className="mt-1 text-xs text-gray-400">
                      JPG o PNG. Tamaño máximo: 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm text-center">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
              >
                {loading ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </form>

          <div className="text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-[#3ea0c9] hover:text-[#2a6c8a] text-sm font-medium transition-colors"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}