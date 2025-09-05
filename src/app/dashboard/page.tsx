'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface User {
  name: string;
  email: string;
  id: string;
}

interface WhatsAppNumber {
  _id: string;
  displayName: string;
  whatsappNumber: string;
  phoneNumberId: string;
  isActive: boolean;
}

interface Conversation {
  customerWaId: string;
  customerName: string;
  customerPhone: string;
  displayName: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  pendingReply: boolean;
  customerProfilePic?: string;
  unreadCount?: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [whatsAppNumbers, setWhatsAppNumbers] = useState<WhatsAppNumber[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const userId = localStorage.getItem('userId')
      const userName = localStorage.getItem('userName')
      const userEmail = localStorage.getItem('userEmail')

      if (userId && userName && userEmail) {
        setUser({
          name: userName,
          email: userEmail,
          id: userId
        })
      } else {
        router.push('/login')
        return
      }

      fetchWhatsAppNumbers()
    } catch (error) {
      console.error('Error fetching user data:', error)
      router.push('/login')
    }
  }

  const fetchWhatsAppNumbers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const userId = localStorage.getItem('userId')
      const response = await fetch(`${apiUrl}/api/admin/whatsapp-numbers/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.whatsAppNumbers) {
          setWhatsAppNumbers(data.whatsAppNumbers)
        }
      }
    } catch (error) {
      console.error('Error fetching WhatsApp numbers:', error)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: '#000e24' }}>
      {/* Circuit Pattern Background */}
      <div className="absolute inset-0 opacity-40 z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <pattern id="circuitPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <g stroke="#012f78" strokeWidth="0.8" fill="none" opacity="0.6">
              <path d="M0,40 L80,40 L100,60" />
              <circle cx="100" cy="60" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
              <path d="M40,0 L40,80 L60,100" />
              <circle cx="60" cy="100" r="1.5" stroke="#012f78" strokeWidth="0.8" fill="none" />
            </g>
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuitPattern)" />
          <rect width="100%" height="100%" fill="url(#fadeCenter)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-50 bg-[#0b1e34] shadow-sm border-b border-[#012f78] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/Logobot.png"
              alt="SYNAPBOT"
              width={100}
              height={25}
              className="h-6 w-auto"
            />
            <h1 className="text-lg font-semibold text-[#90e2f8]">
              Whatsapp Synapbot
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-[#B7C2D6]">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#0073ba] hover:bg-[#005a92] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white cursor-pointer transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Numbers Selector */}
      <div className="bg-[#0b1e34] border-b border-[#012f78] px-6 py-3 relative z-50">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-[#B7C2D6]">
            Número WhatsApp:
          </label>
          <select className="flex-1 max-w-xs px-4 py-2 text-sm border-2 border-[#3ea0c9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent bg-[#000e24] text-white cursor-pointer">
            {whatsAppNumbers.map((wa) => (
              <option key={wa._id} value={wa._id}>
                {wa.displayName} (+{wa.whatsappNumber.slice(-4)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative z-50">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-[#0b1e34] border-r border-[#012f78] flex flex-col h-full">
          <div className="p-4 border-b border-[#012f78] flex-shrink-0">
            <h2 className="text-lg font-semibold text-white">Conversaciones</h2>
            <div className="mt-2 text-sm text-[#B7C2D6]">
              {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)} mensajes sin leer
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pb-4">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-[#B7C2D6]">
                No hay conversaciones disponibles
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.customerWaId}
                  className="p-4 cursor-pointer hover:bg-[#012f78] hover:bg-opacity-50 border-b border-[#012f78] relative z-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-[#0b1e34] border-2 border-[#3ea0c9] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white truncate">
                          {conversation.customerName || conversation.customerPhone}
                        </h3>
                        <span className="text-xs text-[#B7C2D6]">
                          {new Date(conversation.lastMessageTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-[#B7C2D6] truncate flex-1 mr-2 mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex items-center justify-center h-full text-[#B7C2D6]">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">Selecciona una conversación</h3>
            <p className="text-[#B7C2D6]">Elige una conversación de la lista para ver los mensajes</p>
          </div>
        </div>
      </div>
    </div>
  )
}