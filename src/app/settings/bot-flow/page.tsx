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

interface AxiosError {
  response?: {
    status: number
    data?: {
      message?: string
    }
  }
}

interface BotSettings {
  template: string
  greeting: string
  menuItems: Array<{
    id: string
    label: string
    type: string
    actionKey: string
    fixed?: boolean
    meta?: {
      table?: {
        columns: string[]
        rows: string[][]
      }
      list?: {
        options: string[]
      }
      location?: {
        address: string
      }
    }
  }>
  formFields: Array<{
    key: string
    label: string
    type: string
    required: boolean
  }>
  messages: {
    scheduleConfirmation: string
    orderAcknowledgement: string
    finalClose: string
  }
  reminders: {
    enabled: boolean
    time1Before: number
    time2Before: number
  }
  version: number
  businessHours?: {
    start: string
    end: string
  }
  workingDays?: string[]
  appointmentInterval?: number
  autoConfirmAppointments?: boolean
  scheduleMessage?: string
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
  createdAt: string
  updatedAt?: string
  botSettings?: BotSettings
}

export default function BotFlowSettings() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [botSettings, setBotSettings] = useState<BotSettings>({
    template: 'custom',
    greeting: 'Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
    menuItems: [],
    formFields: [],
    messages: {
      scheduleConfirmation: 'Tu cita ha sido agendada.',
      orderAcknowledgement: 'Gracias. En breve un encargado le responderá.',
      finalClose: '✅ Su pedido se está preparando. Gracias por elegirnos.'
    },
    reminders: {
      enabled: false,
      time1Before: 3,
      time2Before: 24
    },
    version: 1,
    businessHours: {
      start: '09:00',
      end: '18:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    appointmentInterval: 30,
    autoConfirmAppointments: false,
    scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
  })
  const [activeTab, setActiveTab] = useState('template')
  const [greetingEdit, setGreetingEdit] = useState('')
  const [scheduleMessageEdit, setScheduleMessageEdit] = useState("Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')")
  const [menuItemsEdit, setMenuItemsEdit] = useState<Array<{
    id: string
    label: string
    type: string
    actionKey: string
    fixed?: boolean
    meta?: {
      table?: {
        columns: string[]
        rows: string[][]
      }
      list?: {
        options: string[]
      }
      location?: {
        address: string
      }
    }
  }>>([])
  const [formFieldsEdit, setFormFieldsEdit] = useState<Array<{key: string, label: string, type: string, required: boolean}>>([])
  const router = useRouter()

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
        setUser(response.data.user)
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

  useEffect(() => {
    if (user?.botSettings) {
      setBotSettings(user.botSettings)
      setGreetingEdit(user.botSettings.greeting || '')
      setScheduleMessageEdit(user.botSettings.scheduleMessage || "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')")
      
      // Asegurar que los elementos fijos tengan la propiedad fixed al cargar
      let menuItems = user.botSettings.menuItems || []
      if (user.botSettings.template === 'consultorio' || user.botSettings.template === 'barberia') {
        menuItems = menuItems.map((item, index) => {
          // Para las dos primeras opciones en consultorio/barberia, forzar fixed: true
          if (index === 0 && (item.label === 'Agendar cita' || item.id === 'agendar-cita-fixed')) {
            return { ...item, fixed: true, label: 'Agendar cita' }
          }
          if (index === 1 && (item.label.includes('Modificar') || item.label.includes('cancelar') || item.id === 'modificar-cita-fixed')) {
            return { ...item, fixed: true, label: 'Modificar/cancelar cita' }
          }
          return item
        })
      }
      
      setMenuItemsEdit(menuItems)
      setFormFieldsEdit(user.botSettings.formFields || [])
    }
  }, [user])

  const handleTemplateSelect = (template: string) => {
    const templates = {
      consultorio: {
        greeting: `Hola, soy el asistente virtual de ${user?.businessName}. ¿En qué puedo ayudarte hoy?`,
        menuItems: [
          {
            id: 'agendar-cita-fixed',
            label: 'Agendar cita',
            type: 'action',
            actionKey: 'schedule',
            fixed: true
          },
          {
            id: 'modificar-cita-fixed',
            label: 'Modificar/cancelar cita',
            type: 'action',
            actionKey: 'modify',
            fixed: true
          },
          { id: '3', label: 'Información de servicios', type: 'action', actionKey: 'prices' },
          { id: '4', label: 'Ubicación y horarios', type: 'action', actionKey: 'location' }
        ],
        formFields: [
          { key: 'name', label: 'Nombre completo', type: 'text', required: true },
          { key: 'phone', label: 'Teléfono', type: 'tel', required: true },
          { key: 'date', label: 'Fecha preferida', type: 'date', required: true }
        ],
        scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
      },
      barberia: {
        greeting: `¡Hola! Bienvenido a ${user?.businessName}. ¿Qué servicio necesitas hoy?`,
        menuItems: [
          {
            id: 'agendar-cita-fixed',
            label: 'Agendar cita',
            type: 'action',
            actionKey: 'schedule',
            fixed: true
          },
          {
            id: 'modificar-cita-fixed',
            label: 'Modificar/cancelar cita',
            type: 'action',
            actionKey: 'modify',
            fixed: true
          },
          { id: '3', label: 'Corte de cabello', type: 'action', actionKey: 'schedule' },
          { id: '4', label: 'Barba y bigote', type: 'action', actionKey: 'schedule' },
          { id: '5', label: 'Paquetes completos', type: 'action', actionKey: 'prices' }
        ],
        formFields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true },
          { key: 'phone', label: 'Teléfono', type: 'tel', required: true },
          { key: 'service', label: 'Servicio', type: 'select', required: true }
        ],
        scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
      },
      servicios: {
        greeting: `Hola, soy el asistente de ${user?.businessName}. ¿Cómo puedo ayudarte?`,
        menuItems: [
          { id: '1', label: 'Solicitar servicio', type: 'action', actionKey: 'schedule' },
          { id: '2', label: 'Cotización', type: 'action', actionKey: 'prices' },
          { id: '3', label: 'Soporte técnico', type: 'action', actionKey: 'custom' }
        ],
        formFields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true },
          { key: 'phone', label: 'Teléfono', type: 'tel', required: true },
          { key: 'description', label: 'Descripción del servicio', type: 'textarea', required: true }
        ],
        scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
      },
      custom: {
        greeting: 'Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
        menuItems: [],
        formFields: [],
        scheduleMessage: "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')"
      }
    }

    const selectedTemplate = templates[template as keyof typeof templates] || templates.custom
    setBotSettings(prev => ({
      ...prev,
      template,
      greeting: selectedTemplate.greeting,
      menuItems: selectedTemplate.menuItems,
      formFields: selectedTemplate.formFields,
      scheduleMessage: selectedTemplate.scheduleMessage
    }))
    setGreetingEdit(selectedTemplate.greeting)
    setScheduleMessageEdit(selectedTemplate.scheduleMessage)
    setMenuItemsEdit(selectedTemplate.menuItems)
    setFormFieldsEdit(selectedTemplate.formFields)
  }

  const addMenuItem = () => {
    if (menuItemsEdit.length >= 5) {
      setError('Máximo 5 opciones de menú permitidas')
      return
    }
    const newItem = {
      id: Date.now().toString(),
      label: '',
      type: 'action',
      actionKey: 'custom'
    }
    setMenuItemsEdit([...menuItemsEdit, newItem])
  }

  const isItemFixed = (item: any) => {
    if (!item) return false
    if (item.fixed) return true
    if (botSettings.template === 'consultorio' || botSettings.template === 'barberia') {
      if (item.label === 'Agendar cita' || item.label === 'Modificar/cancelar cita') {
        return true
      }
    }
    return false
  }

  const removeMenuItem = (id: string) => {
    const item = menuItemsEdit.find(item => item.id === id)
    if (isItemFixed(item)) {
      return // Don't remove fixed items
    }
    setMenuItemsEdit(menuItemsEdit.filter(item => item.id !== id))
  }

  const updateMenuItem = (id: string, field: string, value: string) => {
    const item = menuItemsEdit.find(item => item.id === id)
    if (isItemFixed(item)) {
      return // Don't update fixed items
    }
    setMenuItemsEdit(menuItemsEdit.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const addFormField = () => {
    if (formFieldsEdit.length >= 6) {
      setError('Máximo 6 campos de formulario permitidos')
      return
    }
    const newField = {
      key: Date.now().toString(),
      label: '',
      type: 'text',
      required: false
    }
    setFormFieldsEdit([...formFieldsEdit, newField])
  }

  const removeFormField = (key: string) => {
    setFormFieldsEdit(formFieldsEdit.filter(field => field.key !== key))
  }

  const updateFormField = (key: string, field: string, value: string | boolean) => {
    setFormFieldsEdit(formFieldsEdit.map(item =>
      item.key === key ? { ...item, [field]: value } : item
    ))
  }

  const saveBotSettings = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!userId) {
        setError('ID de usuario no encontrado')
        setSaving(false)
        return
      }

      // Validar que todos los campos requeridos tengan valores
      const validatedMenuItems = menuItemsEdit.map(item => ({
        id: item.id || Date.now().toString(),
        label: item.label || '',
        type: item.type || 'action',
        actionKey: item.actionKey || 'custom',
        meta: item.meta || undefined,
        fixed: item.fixed // Preservar la propiedad fixed
      }))

      const validatedFormFields = formFieldsEdit.map(field => ({
        key: field.key || `field_${Date.now()}`,
        label: field.label || '',
        type: field.type || 'text',
        required: field.required || false
      }))

      const updatedSettings = {
        ...botSettings,
        greeting: greetingEdit || 'Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
        scheduleMessage: scheduleMessageEdit || "Por favor ingresa la fecha y hora en la cual deseas agendar con nosotros (ejemplo: '15 de julio a las 3pm')",
        menuItems: validatedMenuItems,
        formFields: validatedFormFields
      }

      console.log('Enviando configuración:', JSON.stringify(updatedSettings, null, 2))

      const response = await axios.patch<ApiResponse>(
        `${apiUrl}/api/auth/user/${userId}`,
        { botSettings: updatedSettings },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setSuccess('Configuración guardada exitosamente')
        setBotSettings(updatedSettings)
        
        // Actualizar también los estados de edición con los datos validados
        setMenuItemsEdit(validatedMenuItems)
        setFormFieldsEdit(validatedFormFields)
      } else {
        setError(response.data.message || 'Error al guardar la configuración')
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
        console.error('Error detallado:', axiosErr.response?.data || err)
        setError(axiosErr.response?.data?.message || 'Error al guardar la configuración')
      }
    } finally {
      setSaving(false)
    }
  }

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

      <div className="relative z-50 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-6">
              <Image
                src="/Logo.png"
                alt="SYNAPBOT"
                width={150}
                height={38}
                className="h-9 w-auto"
              />
              <h1 className="text-3xl font-bold text-[#B7C2D6]">Configuración</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#012f78] hover:bg-[#3ea0c9] text-[#B7C2D6] px-4 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>

          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-6">
                <div className="text-center">
                  <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-[#90e2f8] mb-4 bg-[#012f78]">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="Profile"
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
                </div>

                {/* Navigation Menu */}
                <div className="mt-6 bg-[#012f78] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9] p-4">
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/settings')}
                      className="w-full bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] py-2 px-4 rounded-md transition-colors cursor-pointer text-left"
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
                      className="w-full bg-[#0073ba] hover:bg-[#005a92] text-white py-2 px-4 rounded-md transition-colors cursor-pointer text-left"
                    >
                      Flujo del Bot
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9]">
                {/* Header */}
                <div className="bg-[#012f78] px-6 py-4 border-b border-[#3ea0c9]">
                  <h2 className="text-xl font-semibold text-[#B7C2D6]">Flujo del Bot</h2>
                  <p className="text-[#90e2f8] text-sm">Configura el flujo de conversación de tu bot</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-600 text-white px-4 py-2 rounded mb-4">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="bg-green-600 text-white px-4 py-2 rounded mb-4">
                      {success}
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-600 text-white px-4 py-2 rounded mb-4">
                      {error}
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex border-b border-[#3ea0c9] mb-6">
                    {['template', 'saludo', 'menu', 'formulario', 'preview'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium transition-colors ${
                          activeTab === tab
                            ? 'bg-[#0073ba] text-white border-b-2 border-[#90e2f8]'
                            : 'bg-[#012f78] text-[#B7C2D6] hover:bg-[#005a92]'
                        }`}
                      >
                        {tab === 'template' && 'Plantilla'}
                        {tab === 'saludo' && 'Saludo'}
                        {tab === 'menu' && 'Menú'}
                        {tab === 'formulario' && 'Formulario'}
                        {tab === 'preview' && 'Vista Previa'}
                      </button>
                    ))}
                  </div>

                  {/* Template Selection */}
                  {activeTab === 'template' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[#B7C2D6]">Selecciona una plantilla</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                          onClick={() => handleTemplateSelect('consultorio')}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            botSettings.template === 'consultorio'
                              ? 'border-[#90e2f8] bg-[#012f78]'
                              : 'border-[#3ea0c9] bg-[#0b1e34] hover:bg-[#012f78]'
                          }`}
                        >
                          <h4 className="text-[#B7C2D6] font-semibold">Consultorio</h4>
                          <p className="text-[#90e2f8] text-sm">Para salud, educación y finanzas</p>
                        </div>
                        <div
                          onClick={() => handleTemplateSelect('barberia')}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            botSettings.template === 'barberia'
                              ? 'border-[#90e2f8] bg-[#012f78]'
                              : 'border-[#3ea0c9] bg-[#0b1e34] hover:bg-[#012f78]'
                          }`}
                        >
                          <h4 className="text-[#B7C2D6] font-semibold">Barbería/Estética</h4>
                          <p className="text-[#90e2f8] text-sm">Para belleza y cuidado personal</p>
                        </div>
                        <div
                          onClick={() => handleTemplateSelect('servicios')}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            botSettings.template === 'servicios'
                              ? 'border-[#90e2f8] bg-[#012f78]'
                              : 'border-[#3ea0c9] bg-[#0b1e34] hover:bg-[#012f78]'
                          }`}
                        >
                          <h4 className="text-[#B7C2D6] font-semibold">Servicios</h4>
                          <p className="text-[#90e2f8] text-sm">Para servicios generales y negocios</p>
                        </div>
                        <div
                          onClick={() => handleTemplateSelect('custom')}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            botSettings.template === 'custom'
                              ? 'border-[#90e2f8] bg-[#012f78]'
                              : 'border-[#3ea0c9] bg-[#0b1e34] hover:bg-[#012f78]'
                          }`}
                        >
                          <h4 className="text-[#B7C2D6] font-semibold">Personalizado</h4>
                          <p className="text-[#90e2f8] text-sm">Configuración manual completa</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Greeting Editor */}
                  {activeTab === 'saludo' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#B7C2D6]">Mensaje de Saludo</h3>
                      <textarea
                        value={greetingEdit}
                        onChange={(e) => setGreetingEdit(e.target.value)}
                        placeholder="Escribe el mensaje de saludo que enviará el bot"
                        className="w-full p-3 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none"
                        rows={4}
                        maxLength={320}
                      />
                      <div className="text-sm text-[#90e2f8]">
                        {greetingEdit.length}/320 caracteres
                      </div>
                      <div className="bg-[#012f78] p-4 rounded border border-[#3ea0c9]">
                        <h4 className="text-[#B7C2D6] font-semibold mb-2">Vista previa:</h4>
                        <p className="text-[#90e2f8]">{greetingEdit}</p>
                      </div>
                    </div>
                  )}

                  {/* Menu Editor */}
                  {activeTab === 'menu' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-[#B7C2D6]">Opciones de Menú</h3>
                        <button
                          onClick={addMenuItem}
                          disabled={menuItemsEdit.length >= 5}
                          className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + Añadir Opción
                        </button>
                      </div>
                      <p className="text-sm text-[#90e2f8]">Máximo 5 opciones de menú</p>
                      
                      {menuItemsEdit.length === 0 ? (
                        <p className="text-[#B7C2D6]">No hay opciones de menú configuradas.</p>
                      ) : (
                        <div className="space-y-3">
                          {menuItemsEdit.map((item, index) => (
                            <div key={item.id} className="bg-[#0b1e34] p-4 rounded border border-[#3ea0c9]">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <span className="text-[#90e2f8]">Opción {index + 1}</span>
                                  {item.fixed && <span className="ml-2 text-green-400 text-sm">Fijo</span>}
                                </div>
                                {!item.fixed && (
                                  <button
                                    onClick={() => removeMenuItem(item.id)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                                  placeholder="Etiqueta de la opción"
                                  className="w-full p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isItemFixed(item)}
                                />
                                <select
                                  value={item.type}
                                  onChange={(e) => updateMenuItem(item.id, 'type', e.target.value)}
                                  className="w-full p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isItemFixed(item)}
                                >
                                  <option value="action">Acción</option>
                                  <option value="table">Tabla</option>
                                  <option value="list">Lista</option>
                                  <option value="location">Ubicación</option>
                                  <option value="handoff">Transferencia</option>
                                </select>
                                <select
                                  value={item.actionKey}
                                  onChange={(e) => updateMenuItem(item.id, 'actionKey', e.target.value)}
                                  className="w-full p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isItemFixed(item)}
                                >
                                  <option value="schedule">Agendar</option>
                                  <option value="modify">Modificar</option>
                                  <option value="prices">Precios/Información</option>
                                  <option value="location">Ubicación</option>
                                  <option value="custom">Personalizado</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Editor */}
                  {activeTab === 'formulario' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-[#B7C2D6]">Campos del Formulario</h3>
                        <button
                          onClick={addFormField}
                          disabled={formFieldsEdit.length >= 6}
                          className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + Añadir Campo
                        </button>
                      </div>
                      <p className="text-sm text-[#90e2f8]">Máximo 6 campos de formulario</p>
                      
                      {formFieldsEdit.length === 0 ? (
                        <p className="text-[#B7C2D6]">No hay campos de formulario configurados.</p>
                      ) : (
                        <div className="space-y-3">
                          {formFieldsEdit.map((field, index) => (
                            <div key={field.key} className="bg-[#0b1e34] p-4 rounded border border-[#3ea0c9]">
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-[#90e2f8]">Campo {index + 1}</span>
                                <button
                                  onClick={() => removeFormField(field.key)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <select
                                  value={field.type}
                                  onChange={(e) => updateFormField(field.key, 'type', e.target.value)}
                                  className="p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none"
                                >
                                  <option value="text">Texto</option>
                                  <option value="tel">Teléfono</option>
                                  <option value="email">Email</option>
                                  <option value="date">Fecha</option>
                                  <option value="select">Selección</option>
                                  <option value="textarea">Texto Largo</option>
                                </select>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateFormField(field.key, 'required', e.target.checked)}
                                    className="mr-2"
                                  />
                                  <span className="text-[#B7C2D6]">Requerido</span>
                                </div>
                              </div>
                              <div className="space-y-2 mt-3">
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateFormField(field.key, 'label', e.target.value)}
                                  placeholder="Etiqueta del campo"
                                  className="w-full p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none"
                                />
                                <div className="w-full p-2 bg-[#012f78] border border-[#3ea0c9] rounded text-[#90e2f8] text-sm">
                                  Key: {field.key}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview */}
                  {activeTab === 'preview' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-[#B7C2D6]">Vista Previa del Bot</h3>
                      
                      {/* Chat Simulation */}
                      <div className="bg-[#0b1e34] rounded-lg border border-[#3ea0c9] p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-[#012f78] rounded-full flex items-center justify-center">
                            <span className="text-[#90e2f8]">🤖</span>
                          </div>
                          <div>
                            <h4 className="text-[#B7C2D6] font-semibold">Bot de WhatsApp</h4>
                            <p className="text-[#90e2f8] text-sm">En línea</p>
                          </div>
                        </div>

                        {/* Greeting Message */}
                        <div className="bg-[#012f78] rounded-lg p-3 mb-3 max-w-xs">
                          <p className="text-[#B7C2D6]">{greetingEdit}</p>
                        </div>

                        {/* Menu Options */}
                        {menuItemsEdit.length > 0 && (
                          <div className="bg-[#012f78] rounded-lg p-3 mb-3 max-w-xs">
                            <p className="text-[#B7C2D6] font-semibold mb-2">Opciones:</p>
                            {menuItemsEdit.map((item) => (
                              <div key={item.id} className="mb-2 last:mb-0">
                                <p className="text-[#90e2f8] font-medium">• {item.label}</p>
                                <p className="text-[#B7C2D6] text-sm">Tipo: {item.type} | Acción: {item.actionKey}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Form Preview */}
                        {formFieldsEdit.length > 0 && (
                          <div className="bg-[#012f78] rounded-lg p-3 mb-3 max-w-xs">
                            <p className="text-[#B7C2D6] font-semibold mb-2">Por favor completa:</p>
                            {formFieldsEdit.map((field) => (
                              <div key={field.key} className="mb-3 last:mb-0">
                                <label className="block text-[#90e2f8] text-sm mb-1">
                                  {field.label} {field.required && '*'}
                                </label>
                                {field.type === 'textarea' ? (
                                  <textarea
                                    placeholder={`Ingrese ${field.label.toLowerCase()}`}
                                    className="w-full p-2 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none"
                                    rows={3}
                                  />
                                ) : (
                                  <input
                                    type={field.type}
                                    placeholder={`Ingrese ${field.label.toLowerCase()}`}
                                    className="w-full p-2 bg-[#0b1e34] border border-[#3ea0c9] rounded text-[#B7C2D6] focus:border-[#90e2f8] focus:outline-none"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={saveBotSettings}
                      disabled={saving}
                      className="bg-[#012f78] hover:bg-[#0073ba] text-[#B7C2D6] px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
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