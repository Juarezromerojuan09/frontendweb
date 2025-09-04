'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const userToken = localStorage.getItem('userToken')
    if (!userToken) {
      router.push('/login')
    }

    // Load sample messages for demonstration
    setMessages([
      {
        id: 1,
        text: '¡Hola! Soy Synapbot, tu asistente de WhatsApp Business. ¿En qué puedo ayudarte hoy?',
        sender: 'bot',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: 2,
        text: 'Me gustaría información sobre tus servicios',
        sender: 'user',
        timestamp: new Date(Date.now() - 1800000)
      },
      {
        id: 3,
        text: 'Claro, tenemos servicios de automatización de WhatsApp, respuestas automáticas, gestión de contactos y más. ¿Te interesa algún servicio en particular?',
        sender: 'bot',
        timestamp: new Date(Date.now() - 1200000)
      }
    ])
  }, [router])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setLoading(true)
    
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')

    // Simulate bot response after a delay
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: 'Gracias por tu mensaje. Estoy procesando tu solicitud y te responderé en breve.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setLoading(false)
    }, 1500)
  }

  const handleLogout = () => {
    console.log('Botón Salir clickeado')
    localStorage.removeItem('userToken')
    router.push('/login')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
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

      {/* Header Section */}
      <div className="relative z-50">
        {/* SYNAPBOT Logo - Centered */}
        <div className="absolute top-6 left-0 right-0 flex justify-center z-50">
          <Image 
            src="/Logobot.png" 
            alt="SYNAPBOT" 
            width={160}
            height={40}
            className="h-10 w-auto"
          />
        </div>

        {/* Navigation Button - Top Right */}
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors"
          >
            Salir
          </button>
        </div>

        {/* Title */}
        <div className="pt-24 pb-6 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-wider text-[#90e2f8]">
            WhatsApp Synapbot
          </h1>
          <p className="text-[#B7C2D6] mt-2">
            Conectando tu negocio con tus clientes
          </p>
        </div>
      </div>

      {/* Main Chat Content */}
      <div className="relative z-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Chat Container */}
          <div className="bg-[#0b1e34] shadow-xl rounded-xl overflow-hidden border-2 border-[#3ea0c9]">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-[#012f78] bg-[#012f78]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-white font-medium">Chat en tiempo real</span>
                </div>
                <span className="text-[#B7C2D6] text-sm">En línea</span>
              </div>
            </div>

            {/* Messages Container */}
            <div className="p-4 h-96 overflow-y-auto bg-[#0a1729]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-[#0073ba] text-white'
                          : 'bg-[#012f78] text-[#B7C2D6]'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[#012f78] text-[#B7C2D6] px-4 py-2 rounded-lg">
                      <div className="flex items-center">
                        <div className="animate-pulse mr-2">●</div>
                        <span className="text-sm">Synapbot está escribiendo...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 border-t border-[#012f78] bg-[#0b1e34]">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 px-3 py-2 border-2 border-[#3ea0c9] rounded-lg bg-[#000e24] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent"
                  style={{ backgroundColor: '#000e24' }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="px-4 py-2 bg-[#0073ba] text-white rounded-lg hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-[#B7C2D6] text-sm">
            <p>Los mensajes se envían a través de WhatsApp Business API</p>
            <p className="mt-1">Respuestas automáticas activas 24/7</p>
          </div>
        </div>
      </div>
    </div>
  )
}