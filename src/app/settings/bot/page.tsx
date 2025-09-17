'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'

interface User {
  _id: string
  username: string
  email: string
  fullName: string
  businessName: string
  botSettings?: {
    businessHours?: {
      start: string
      end: string
    }
    workingDays?: string[]
    appointmentInterval?: number
    autoConfirmAppointments?: boolean
    reminders?: {
      enabled?: boolean
      clientReminders?: Array<{ value: number; unit: 'hours' | 'minutes' }>
      userReminders?: Array<{ value: number; unit: 'hours' | 'minutes' }>
    }
  }
}

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

export default function BotConfiguration() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  // Form states
  const [businessHours, setBusinessHours] = useState({
    start: '09:00',
    end: '18:00'
  })
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const [appointmentInterval, setAppointmentInterval] = useState(30)
  const [autoConfirmAppointments, setAutoConfirmAppointments] = useState(false)
  const [remindersEnabled, setRemindersEnabled] = useState(false)
  const [clientReminders, setClientReminders] = useState<Array<{ value: number; unit: 'hours' | 'minutes' }>>([])
  const [userReminders, setUserReminders] = useState<Array<{ value: number; unit: 'hours' | 'minutes' }>>([])

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

        // Initialize form values from user data
        if (userData.botSettings) {
          if (userData.botSettings.businessHours) {
            setBusinessHours(userData.botSettings.businessHours)
          }
          if (userData.botSettings.workingDays) {
            setWorkingDays(userData.botSettings.workingDays)
          }
          if (userData.botSettings.appointmentInterval) {
            setAppointmentInterval(userData.botSettings.appointmentInterval)
          }
          if (userData.botSettings.autoConfirmAppointments !== undefined) {
            setAutoConfirmAppointments(userData.botSettings.autoConfirmAppointments)
          }
          // Initialize reminders settings
          if (userData.botSettings.reminders) {
            setRemindersEnabled(userData.botSettings.reminders.enabled || false)
            
            // Initialize client reminders from new array format
            const clientRems: { value: number; unit: 'hours' | 'minutes' }[] =
              userData.botSettings.reminders.clientReminders?.map((rem: { value: number; unit: string }) => ({
                value: rem.value || 0,
                unit: rem.unit === 'hours' || rem.unit === 'minutes' ? rem.unit : 'hours'
              })) || []
            setClientReminders(clientRems)
            
            // Initialize user reminders from new array format
            const userRems: { value: number; unit: 'hours' | 'minutes' }[] =
              userData.botSettings.reminders.userReminders?.map((rem: { value: number; unit: string }) => ({
                value: rem.value || 24,
                unit: rem.unit === 'hours' || rem.unit === 'minutes' ? rem.unit : 'hours'
              })) || []
            setUserReminders(userRems)
          }
        }
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

  const handleWorkingDayChange = (day: string) => {
    setWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const saveSettings = async () => {
    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!userId) {
        setError('ID de usuario no encontrado')
        return
      }

      const updateData = {
        'botSettings.businessHours.start': businessHours.start,
        'botSettings.businessHours.end': businessHours.end,
        'botSettings.workingDays': workingDays,
        'botSettings.appointmentInterval': appointmentInterval,
        'botSettings.autoConfirmAppointments': autoConfirmAppointments,
        'botSettings.reminders.enabled': remindersEnabled,
        'botSettings.reminders.clientReminders': clientReminders,
        'botSettings.reminders.userReminders': userReminders
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
        setSuccess('Configuración guardada correctamente')
        setTimeout(() => setSuccess(''), 3000)
        
        // Update form values from response to ensure consistency
        if (response.data.user?.botSettings) {
          const botSettings = response.data.user.botSettings
          if (botSettings.businessHours) {
            setBusinessHours(botSettings.businessHours)
          }
          if (botSettings.workingDays) {
            setWorkingDays(botSettings.workingDays)
          }
          if (botSettings.appointmentInterval) {
            setAppointmentInterval(botSettings.appointmentInterval)
          }
          if (botSettings.autoConfirmAppointments !== undefined) {
            setAutoConfirmAppointments(botSettings.autoConfirmAppointments)
          }
        }
      } else {
        setError(response.data.message || 'Error al guardar la configuración')
      }
    } catch {
      setError('Error al guardar la configuración')
    } finally {
      setUpdating(false)
    }
  }

  const dayLabels: { [key: string]: string } = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#000e24' }}>
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90e2f8] mx-auto"></div>
          <p className="mt-4 text-[#B7C2D6]">Cargando configuración...</p>
        </div>
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#B7C2D6]">Configuración Bot</h1>
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
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl text-[#B7C2D6] font-bold">🤖</span>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-[#B7C2D6] mb-2">Configuración del Bot</h2>
                  <p className="text-[#90e2f8] text-sm mb-6">Configura el comportamiento de tu asistente</p>
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
                      className="w-full bg-[#0073ba] hover:bg-[#005a92] text-white py-2 px-4 rounded-md transition-colors cursor-pointer text-left"
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
                  <h2 className="text-xl font-semibold text-[#B7C2D6]">Configuración del Asistente</h2>
                  <p className="text-[#90e2f8] text-sm">Personaliza el comportamiento de tu bot de WhatsApp</p>
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

                  <div className="space-y-6">
                    {/* Business Hours */}
                    <div className="bg-[#012f78] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#B7C2D6] mb-3">Horario de Atención</h3>
                      <p className="text-[#90e2f8] text-sm mb-4">Define el horario en el que tu negocio atiende a clientes</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#B7C2D6] mb-2">Hora de inicio</label>
                          <input
                            type="time"
                            value={businessHours.start}
                            onChange={(e) => setBusinessHours(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full bg-[#0b1e34] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-2 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#B7C2D6] mb-2">Hora de cierre</label>
                          <input
                            type="time"
                            value={businessHours.end}
                            onChange={(e) => setBusinessHours(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full bg-[#0b1e34] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-2 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Working Days */}
                    <div className="bg-[#012f78] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#B7C2D6] mb-3">Días Laborales</h3>
                      <p className="text-[#90e2f8] text-sm mb-4">Selecciona los días en que tu negocio atiende</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(dayLabels).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={workingDays.includes(key)}
                              onChange={() => handleWorkingDayChange(key)}
                              className="w-4 h-4 text-[#90e2f8] bg-[#0b1e34] border-[#3ea0c9] rounded focus:ring-[#90e2f8]"
                            />
                            <span className="text-[#B7C2D6]">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Appointment Interval */}
                    <div className="bg-[#012f78] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#B7C2D6] mb-3">Intervalo de Tiempo por Cita</h3>
                      <p className="text-[#90e2f8] text-sm mb-4">Define la duración de cada cita en minutos</p>
                      
                      <select
                        value={appointmentInterval}
                        onChange={(e) => setAppointmentInterval(Number(e.target.value))}
                        className="w-full bg-[#0b1e34] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-2 rounded"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>60 minutos (1:00 hora)</option>
                        <option value={75}>75 minutos (1:15 horas)</option>
                        <option value={90}>90 minutos (1:30 horas)</option>
                        <option value={105}>105 minutos (1:45 horas)</option>
                        <option value={120}>120 minutos (2:00 horas)</option>
                      </select>
                    </div>

                    {/* Auto Confirm Appointments */}
                    <div className="bg-[#012f78] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#B7C2D6] mb-3">Confirmación Automática de Citas</h3>
                      <p className="text-[#90e2f8] text-sm mb-4">
                        {autoConfirmAppointments
                          ? 'Si se activa el bot podrá agendar una cita en cualquier espacio disponible en los días y fechas elegidas anteriormente, sin pedir confirmación manual'
                          : 'El bot enviará un mensaje de solicitud de confirmación al cliente'
                        }
                      </p>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoConfirmAppointments}
                          onChange={(e) => setAutoConfirmAppointments(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#0b1e34] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#90e2f8]"></div>
                        <span className="ml-3 text-sm font-medium text-[#B7C2D6]">
                          {autoConfirmAppointments ? 'Activado' : 'Desactivado'}
                        </span>
                      </label>
                    </div>

                    {/* Automatic Reminders */}
                    <div className="bg-[#012f78] p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#B7C2D6] mb-3">Recordatorios Automáticos</h3>
                      <p className="text-[#90e2f8] text-sm mb-4">
                        {remindersEnabled
                          ? 'El bot enviará recordatorios automáticos antes de las citas'
                          : 'Los recordatorios automáticos están desactivados'
                        }
                      </p>
                      
                      <div className="space-y-4">
                        {/* Enable/Disable Toggle */}
                        <label className="flex items-center space-x-3 mb-4">
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={remindersEnabled}
                              onChange={(e) => setRemindersEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#0b1e34] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#90e2f8]"></div>
                          </div>
                          <span className="text-sm font-medium text-[#B7C2D6]">
                            {remindersEnabled ? 'Activado' : 'Desactivado'}
                          </span>
                        </label>

                        {remindersEnabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Client Reminders */}
                            <div>
                              <h4 className="text-md font-semibold text-[#B7C2D6] mb-3">Recordatorios para Clientes</h4>
                              {clientReminders.map((reminder, index) => (
                                <div key={index} className="mb-3 p-3 bg-[#0b1e34] rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <input
                                      type="number"
                                      value={reminder.value}
                                      onChange={(e) => {
                                        const newReminders = [...clientReminders]
                                        newReminders[index].value = Number(e.target.value)
                                        setClientReminders(newReminders)
                                      }}
                                      min="0"
                                      max="60"
                                      className="w-20 bg-[#0b1e34] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-2 rounded"
                                    />
                                    <select
                                      value={reminder.unit}
                                      onChange={(e) => {
                                        const newReminders = [...clientReminders]
                                        newReminders[index].unit = e.target.value as 'hours' | 'minutes'
                                        setClientReminders(newReminders)
                                      }}
                                      className="bg-[#0b1e34] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-2 rounded"
                                    >
                                      <option value="hours">horas antes</option>
                                      <option value="minutes">minutos antes</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        const newReminders = clientReminders.filter((_, i) => i !== index)
                                        setClientReminders(newReminders)
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => setClientReminders([...clientReminders, { value: 24, unit: 'hours' }])}
                                className="bg-[#0073ba] hover:bg-[#005a92] text-white px-3 py-1 rounded-md text-sm"
                              >
                                + Agregar recordatorio
                              </button>
                            </div>

                            {/* User Reminders */}
                            <div>
                              <h4 className="text-md font-semibold text-[#B7C2D6] mb-3">Recordatorios para Usuario</h4>
                              {userReminders.map((reminder, index) => (
                                <div key={index} className="mb-3 p-3 bg-[#0b1e34] rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <input
                                      type="number"
                                      value={reminder.value}
                                      onChange={(e) => {
                                        const newReminders = [...userReminders]
                                        newReminders[index].value = Number(e.target.value)
                                        setUserReminders(newReminders)
                                      }}
                                      min="0"
                                      max="60"
                                      className="w-20 bg-[#0b1e34] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-2 rounded"
                                    />
                                    <select
                                      value={reminder.unit}
                                      onChange={(e) => {
                                        const newReminders = [...userReminders]
                                        newReminders[index].unit = e.target.value as 'hours' | 'minutes'
                                        setUserReminders(newReminders)
                                      }}
                                      className="bg-[#0b1e34] border border-[#3ea0c9] text-[#B7C2D6] px-3 py-2 rounded"
                                    >
                                      <option value="hours">horas antes</option>
                                      <option value="minutes">minutos antes</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        const newReminders = userReminders.filter((_, i) => i !== index)
                                        setUserReminders(newReminders)
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => setUserReminders([...userReminders, { value: 24, unit: 'hours' }])}
                                className="bg-[#0073ba] hover:bg-[#005a92] text-white px-3 py-1 rounded-md text-sm"
                              >
                                + Agregar recordatorio
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={saveSettings}
                        disabled={updating}
                        className="bg-[#0073ba] hover:bg-[#005a92] disabled:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors cursor-pointer"
                      >
                        {updating ? 'Guardando...' : 'Guardar Configuración'}
                      </button>
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