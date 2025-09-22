'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import Image from 'next/image'
import { ConversationsProvider, useConversations } from '@/contexts/ConversationsContext'

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


interface Message {
    _id: string;
    content: {
      body: string;
      mediaUrl?: string;
      mediaType?: string;
      caption?: string;
    };
    timestamp: string;
    from: 'customer' | 'business';
    type: string;
    messageId: string;
    customerWaId: string;
    whatsAppNumberId: string;
    customerProfilePic?: string;
    status?: 'sent' | 'delivered' | 'read' | 'failed';
  }
 

 type PresenceStatus = 'online' | 'typing' | 'offline'

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [whatsAppNumbers, setWhatsAppNumbers] = useState<WhatsAppNumber[]>([])
  const [selectedWhatsAppNumber, setSelectedWhatsAppNumber] = useState<string | null>(null)
  const { state: { conversations, loading }, dispatch } = useConversations()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const router = useRouter()
  const [presence, setPresence] = useState<PresenceStatus>('offline')
  const [isMobile, setIsMobile] = useState(false)
  const [currentView, setCurrentView] = useState<'conversations' | 'chat'>('conversations')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Refs para valores actuales de estado en event handlers de Socket.IO
  const selectedConversationRef = useRef<string | null>(null)
  const selectedWhatsAppNumberRef = useRef<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const presenceTimerRef = useRef<number | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const fetchWhatsAppNumbers = useCallback(async () => {
     try {
       const token = localStorage.getItem('token')
       if (!token) return

       const userId = localStorage.getItem('userId')
       if (!userId) {
         router.push('/login')
         return
       }

       const response = await fetch(`${apiUrl}/api/auth/whatsapp-numbers/user/${userId}`, {
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
         }
       })

       if (response.ok) {
         const data = await response.json()
         if (data.success && data.whatsAppNumbers) {
           setWhatsAppNumbers(data.whatsAppNumbers)

           if (data.whatsAppNumbers.length > 0) {
             setSelectedWhatsAppNumber(data.whatsAppNumbers[0]._id)
           }
         }
       } else {
         if (response.status === 401) {
           // Token inválido, redirigir al login
           localStorage.removeItem('token')
           localStorage.removeItem('userId')
           localStorage.removeItem('userName')
           localStorage.removeItem('userEmail')
           router.push('/login')
           return
         } else if (response.status === 304) {
           setWhatsAppNumbers([])
         } else {
           console.error('Error fetching WhatsApp numbers:', response.statusText)
         }
       }
     } catch (error) {
       console.error('Error fetching WhatsApp numbers:', error)
     } finally {
       dispatch({ type: 'SET_LOADING', payload: false })
     }
   }, [apiUrl, router])

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Obtener datos del usuario desde localStorage
      const userId = localStorage.getItem('userId')
      const userName = localStorage.getItem('userName')
      const userEmail = localStorage.getItem('userEmail')

      if (userId && userName && userEmail) {
        setUser({
          name: userName,
          email: userEmail,
          id: userId
        })
        // Obtener WhatsApp Numbers del usuario
        fetchWhatsAppNumbers()
      } else {
        // Si no hay datos en localStorage, redirigir al login
        localStorage.removeItem('token')
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      localStorage.removeItem('token')
      router.push('/login')
    }
  }, [router, fetchWhatsAppNumbers])

  const fetchConversations = useCallback(async () => {
     try {
       dispatch({ type: 'SET_LOADING', payload: true })
       const token = localStorage.getItem('token')
       if (!token) return

       const userId = localStorage.getItem('userId')
       if (!userId) {
         console.error('User ID not found')
         return
       }
       const response = await fetch(`${apiUrl}/api/messages/conversations/${userId}`, {
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         }
       })

       if (response.ok) {
         const data = await response.json()
         if (data.success && data.conversations) {
           dispatch({ type: 'SET_CONVERSATIONS', payload: data.conversations })
         }
       } else {
         if (response.status === 401) {
           localStorage.removeItem('token')
           localStorage.removeItem('userId')
           localStorage.removeItem('userName')
           localStorage.removeItem('userEmail')
           router.push('/login')
           return
         } else if (response.status === 304) {
           dispatch({ type: 'SET_CONVERSATIONS', payload: [] })
           dispatch({ type: 'SET_LOADING', payload: false })
         } else {
           console.error('Error fetching conversations:', response.statusText)
           dispatch({ type: 'SET_CONVERSATIONS', payload: [] })
         }
       }
     } catch (error) {
       console.error('Error fetching conversations:', error)
       dispatch({ type: 'SET_CONVERSATIONS', payload: [] })
     } finally {
       dispatch({ type: 'SET_LOADING', payload: false })
     }
   }, [apiUrl, router])

  const fetchMessages = useCallback(async (customerWaId: string, whatsAppNumberId: string) => {
    try {
      setChatLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${apiUrl}/api/messages/conversation/${customerWaId}/${whatsAppNumberId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.conversation) {
          setMessages(data.conversation)
        }
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('userId')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          router.push('/login')
          return
        } else if (response.status === 304) {
          setMessages([])
          setChatLoading(false)
        } else {
          console.error('Error fetching messages:', response.statusText)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setChatLoading(false)
    }
  }, [apiUrl, router])

  const sendMessage = useCallback(async () => {
    const currentSelectedConversation = selectedConversationRef.current
    const currentSelectedWhatsAppNumber = selectedWhatsAppNumberRef.current
    if (!newMessage.trim() || !currentSelectedConversation || !currentSelectedWhatsAppNumber) return

    const token = localStorage.getItem('token')
    if (!token) return

    const optimisticId = `optimistic-${Date.now()}`

    // Crear mensaje optimista
    const optimisticMessage: Message = {
      _id: optimisticId,
      content: {
        body: newMessage.trim()
      },
      timestamp: new Date().toISOString(),
      from: 'business',
      type: 'text',
      messageId: optimisticId,
      customerWaId: currentSelectedConversation,
      whatsAppNumberId: currentSelectedWhatsAppNumber,
      status: 'sent'
    }

    setMessages(prevMessages => [...prevMessages, optimisticMessage])
    
    // Actualizar la conversación en el estado global con mensaje enviado
    if (currentSelectedConversation) {
      dispatch({ type: 'UPDATE_CONVERSATION_STATUS', payload: { customerWaId: currentSelectedConversation, status: 'sent' } })
      
      // Actualizar también el último mensaje en la lista de conversaciones
      dispatch({
        type: 'UPDATE_CONVERSATION_LAST_MESSAGE',
        payload: {
          customerWaId: currentSelectedConversation,
          lastMessage: newMessage.trim(),
          lastMessageTime: new Date().toISOString(),
          lastMessageFrom: 'business',
          lastMessageStatus: 'sent'
        }
      })
    }

    setNewMessage('')

    try {
      const response = await fetch(`${apiUrl}/api/messages/send-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsAppNumberId: currentSelectedWhatsAppNumber,
          customerWaId: currentSelectedConversation,
          message: optimisticMessage.content.body
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (!data.success) {
          console.error('Error en respuesta:', data.message)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error HTTP:', response.status, errorData.message || response.statusText)
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
    }
  }, [newMessage, apiUrl])

  // Actualizar refs cuando el estado cambia
  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  useEffect(() => {
    selectedWhatsAppNumberRef.current = selectedWhatsAppNumber
  }, [selectedWhatsAppNumber])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Effect to handle mobile responsiveness
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile() // initial check
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (presenceTimerRef.current) {
        clearTimeout(presenceTimerRef.current)
      }
    }
  }, [])

  // Auto-scroll to bottom when messages change or conversation changes
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      try {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      } catch (error) {
        console.warn('Error al hacer scroll:', error)
      }
    }
  }, [messages, selectedConversation])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  useEffect(() => {
    if (selectedWhatsAppNumber) {
      fetchConversations()
    }
  }, [selectedWhatsAppNumber, fetchConversations])

  // Configuración de Socket.IO para mensajes en tiempo real - Conexión estable
  useEffect(() => {
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling']
    })

    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('✅ Conectado al servidor Socket.IO')
    })

    newSocket.on('new-message', (newMessage: Message) => {
      console.log('📨 Nuevo mensaje recibido via Socket.IO:', newMessage)
      
      // Validar que el mensaje tenga los campos necesarios
      if (!newMessage.customerWaId || !newMessage.whatsAppNumberId) {
        console.warn('Mensaje recibido sin customerWaId o whatsAppNumberId:', newMessage)
        return
      }

      // Presencia: si el cliente envía un mensaje en la conversación seleccionada, marcar "En línea" temporalmente
      if (newMessage.from === 'customer' &&
          selectedConversationRef.current === newMessage.customerWaId &&
          selectedWhatsAppNumberRef.current === newMessage.whatsAppNumberId) {
        setPresence('online')
        if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current)
        presenceTimerRef.current = window.setTimeout(() => setPresence('offline'), 20000)
      }

      // Remover mensajes optimistas para evitar duplicados
      setMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg =>
          !(msg.messageId?.startsWith('optimistic-') &&
            msg.from === 'business' &&
            msg.customerWaId === newMessage.customerWaId)
        )
        if (selectedConversationRef.current === newMessage.customerWaId &&
            selectedWhatsAppNumberRef.current === newMessage.whatsAppNumberId) {
          return [...filteredMessages, newMessage]
        }
        return filteredMessages
      })

      // Actualizar la conversación en la lista con el último mensaje
      dispatch({
        type: 'UPDATE_CONVERSATION_LAST_MESSAGE',
        payload: {
          customerWaId: newMessage.customerWaId,
          lastMessage: newMessage.content.body,
          lastMessageTime: newMessage.timestamp,
          lastMessageFrom: newMessage.from,
          lastMessageStatus: newMessage.status
        }
      })

      if (newMessage.from === 'customer' && newMessage.whatsAppNumberId === selectedWhatsAppNumberRef.current) {
        // Incrementar contador de no leídos para esta conversación
        dispatch({ type: 'INCREMENT_UNREAD_COUNT', payload: newMessage.customerWaId })
      }
    })

    // Escuchar eventos de cambio de estado de mensajes
    newSocket.on('message-status-update', (statusData: { messageId: string; status: 'sent'|'delivered'|'read'|'failed'; timestamp: string; customerWaId?: string; whatsAppNumberId?: string }) => {
      console.log('📊 Estado de mensaje actualizado:', statusData)
      
      // Validar datos del evento
      if (!statusData.messageId) {
        console.warn('Evento message-status-update sin messageId:', statusData)
        return
      }

      // Actualizar estado en mensajes del chat
      setMessages(prevMessages => prevMessages.map(message =>
        message.messageId === statusData.messageId
          ? { ...message, status: statusData.status }
          : message
      ))

      // Actualizar estado en la conversación usando el contexto global
      if (statusData.customerWaId) {
        dispatch({
          type: 'UPDATE_CONVERSATION_STATUS',
          payload: { customerWaId: statusData.customerWaId, status: statusData.status }
        })
      } else {
        console.warn('Evento message-status-update sin customerWaId:', statusData)
      }
    })

    // Opcional: escuchar evento de typing si se habilita en backend
    newSocket.on('customer-typing', (data: { customerWaId: string; whatsAppNumberId: string; typing: boolean }) => {
      if (data.customerWaId === selectedConversationRef.current &&
          data.whatsAppNumberId === selectedWhatsAppNumberRef.current) {
        if (data.typing) {
          setPresence('typing')
        } else {
          setPresence('online')
          if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current)
          presenceTimerRef.current = window.setTimeout(() => setPresence('offline'), 15000)
        }
      }
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor Socket.IO')
    })

    return () => {
      newSocket.disconnect()
    }
  }, [apiUrl])

  // Unirse a la sala de conversación cuando se selecciona una conversación
  useEffect(() => {
    if (socket && selectedConversation && selectedWhatsAppNumber && user) {
      const roomData = {
        userId: user.id,
        customerWaId: selectedConversation,
        whatsAppNumberId: selectedWhatsAppNumber
      }
      socket.emit('join-conversation', roomData)
      console.log('👥 Uniéndose a sala:', roomData)
      setPresence('offline')
    }

    return () => {
      if (socket && selectedConversation && selectedWhatsAppNumber && user) {
        const roomData = {
          userId: user.id,
          customerWaId: selectedConversation,
          whatsAppNumberId: selectedWhatsAppNumber
        }
        socket.emit('leave-conversation', roomData)
        console.log('👋 Saliendo de sala:', roomData)
      }
    }
  }, [socket, selectedConversation, selectedWhatsAppNumber, user])

  // Efecto para unirse a la sala del usuario cuando el usuario o el socket cambian
  useEffect(() => {
    if (socket && user) {
      socket.emit('join-user-room', { userId: user.id });
      console.log('👤 Uniéndose a sala de usuario:', user.id);
    }
  }, [socket, user])


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

  const renderPresence = () => {
    if (presence === 'typing') return <span className="text-xs text-[#90e2f8]">Escribiendo…</span>
    if (presence === 'online') return <span className="text-xs text-[#90e2f8]">En línea</span>
    return <span className="text-xs text-[#B7C2D6]">Esperando respuesta...</span>
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: '#000e24' }}>
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

      {/* Header with integrated logo, title, and buttons - Compact layout */}
      <div className="relative z-50 bg-[#0b1e34] shadow-sm border-b border-[#012f78] px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left section - Logo, hamburger menu, and title */}
          <div className="flex items-center space-x-3">
            {/* Hamburger menu for mobile - Only show in chat view */}
            {isMobile && currentView === 'chat' && (
              <button
                onClick={() => setCurrentView('conversations')}
                className="md:hidden hamburger-menu p-2"
              >
                <div className="w-5 h-0.5 bg-[#B7C2D6] mb-1.5" />
                <div className="w-5 h-0.5 bg-[#B7C2D6] mb-1.5" />
                <div className="w-5 h-0.5 bg-[#B7C2D6]" />
              </button>
            )}
            
            <Image
              src="/Logobot.png"
              alt="SYNAPBOT"
              width={50}
              height={13}
              className="h-6 w-auto"
            />
            <h1 className="text-lg font-semibold text-[#90e2f8]">
              Whatsapp Synapbot
            </h1>
          </div>

          {/* Right section - User info and logout button */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-[#B7C2D6] hidden md:block">
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

      {/* Selector de WhatsApp Numbers y Botón Configuración */}
      <div className="bg-[#0b1e34] border-b border-[#012f78] px-6 py-3 relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-[#B7C2D6]">
              Número WhatsApp:
            </label>
            <select
              value={selectedWhatsAppNumber || ''}
              onChange={(e) => setSelectedWhatsAppNumber(e.target.value)}
              className="flex-1 max-w-xs px-4 py-2 text-sm border-2 border-[#3ea0c9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent bg-[#000e24] text-white cursor-pointer"
            >
              {whatsAppNumbers.map((wa) => (
                <option key={wa._id} value={wa._id}>
                  {wa.displayName} (+{wa.whatsappNumber.slice(-4)})
                </option>
              ))}
            </select>
          </div>
    <button
      onClick={() => router.push('/settings')}
      className="px-4 py-2 bg-[#0073ba] hover:bg-[#005a92] text-white rounded-md transition-colors cursor-pointer"
    >
      <span className="md:hidden">⚙️</span>
      <span className="hidden md:inline">Configuración</span>
    </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Main Content - WhatsApp Layout */}
      <div className="flex flex-1 overflow-hidden relative z-50">
        {/* Conversations Sidebar */}
        <div className={`
          ${isMobile ? (currentView === 'chat' ? 'hidden' : 'fixed left-0 top-0 h-full w-72 z-50') : 'md:static'}
          md:w-1/3 lg:w-1/4 bg-[#0b1e34] border-r border-[#012f78] transition-transform duration-300 ease-in-out
        `}>
          {/* Close button for mobile */}
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              setCurrentView('chat')
            }}
            className="md:hidden absolute top-3 right-3 text-[#B7C2D6] hover:text-[#90e2f8] text-xl z-50"
          >
            ×
          </button>
          <div className="p-4 border-b border-[#012f78]">
            <h2 className="text-lg font-semibold text-white">
              Conversaciones
            </h2>
            <div className="mt-2 text-sm text-[#B7C2D6]">
              {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)} mensajes sin leer
            </div>
          </div>

          <div className="overflow-y-auto h-full pb-4">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90e2f8] mx-auto"></div>
                <p className="text-[#B7C2D6] mt-2">Cargando conversaciones...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-[#B7C2D6] opacity-70 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-[#3ea0c9] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">Aún no hay conversaciones</p>
                  <p className="text-sm">Aquí se mostrarán tus conversaciones de WhatsApp</p>
                  <p className="text-xs mt-2 opacity-80">Puedes modificar la configuración de tu cuenta y bot en el botón de configuración</p>
                </div>
                <button
                  onClick={() => router.push('/settings')}
                  className="px-4 py-2 bg-[#0073ba] hover:bg-[#005a92] text-white rounded-md transition-colors cursor-pointer text-sm"
                >
                  Ir a Configuración
                </button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.customerWaId}
                  onClick={() => {
                    console.log('Conversación seleccionada:', conversation.customerWaId);
                    setSelectedConversation(conversation.customerWaId)
                    if (selectedWhatsAppNumber) {
                      fetchMessages(conversation.customerWaId, selectedWhatsAppNumber)
                    }
                    if ((conversation.unreadCount || 0) > 0) {
                      dispatch({ type: 'RESET_UNREAD_COUNT', payload: conversation.customerWaId })
                    }
                    // On mobile, switch to chat view and close mobile menu
                    if (isMobile) {
                      setCurrentView('chat')
                      setMobileMenuOpen(false)
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-[#012f78] hover:bg-opacity-50 border-b border-[#012f78] relative z-40 transition-colors ${
                    selectedConversation === conversation.customerWaId ? 'bg-[#012f78] bg-opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {conversation.customerProfilePic ? (
                        <Image
                          src={conversation.customerProfilePic || ''}
                          alt={conversation.customerName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#3ea0c9]"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#0b1e34] border-2 border-[#3ea0c9] rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white truncate">
                          {conversation.customerName || conversation.customerPhone}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${(conversation.unreadCount || 0) > 0 ? 'text-[#90e2f8] font-medium' : 'text-[#B7C2D6]'}`}>
                            {new Date(conversation.lastMessageTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {(conversation.unreadCount || 0) > 0 && (
                            <div className="bg-[#90e2f8] text-[#000e24] text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center font-medium">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-[#B7C2D6] truncate flex-1 mr-2">
                          {conversation.lastMessage}
                        </p>
                        {conversation.lastMessageFrom === 'business' && conversation.lastMessageStatus && (
                          <div className="flex-shrink-0 flex items-center space-x-1">
                            {conversation.lastMessageStatus === 'sent' && (
                              <svg className="w-6 h-6 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {conversation.lastMessageStatus === 'delivered' && (
                              <>
                                <svg className="w-6 h-6 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <svg className="w-6 h-6 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </>
                            )}
                            {conversation.lastMessageStatus === 'read' && (
                              <>
                                <svg className="w-6 h-6 text-[#007bff]" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <svg className="w-6 h-6 text-[#007bff]" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </>
                            )}
                            {conversation.lastMessageStatus === 'failed' && (
                              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11h2v5h-2V7zm0 6h2v2h-2v-2z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area - Hidden on mobile when in conversations view */}
        <div className={`${isMobile ? (currentView === 'chat' ? 'block' : 'hidden') : 'block'} flex-1 flex flex-col`}>
          {selectedConversation ? (
            <div className="flex flex-col h-full relative">
              {/* Chat Header */}
              <div className="bg-[#0b1e34] border-b border-[#012f78] px-6 py-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {(() => {
                      const selectedConv = conversations.find(c => c.customerWaId === selectedConversation)
                      return selectedConv?.customerProfilePic ? (
                        <Image
                          src={selectedConv.customerProfilePic || ''}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#3ea0c9]"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#0b1e34] border-2 border-[#3ea0c9] rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )
                    })()}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {(() => {
                        const selectedConv = conversations.find(c => c.customerWaId === selectedConversation)
                        return selectedConv?.customerName || selectedConv?.customerPhone || 'Cliente'
                      })()}
                    </h3>
                    <p className="text-xs">
                      {renderPresence()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Container - Show all messages with bottom margin for input */}
              <div className="flex-1 flex flex-col">
                {/* Messages Area - Scrollable container with hidden scrollbar and fixed height */}
                <div
                  ref={messagesContainerRef}
                  className="p-4 overflow-y-auto"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    maxHeight: 'calc(100vh - 240px)',
                    height: '100%',
                    paddingBottom: '80px' // Space to ensure last message is visible above input
                  }}
                >
                  <style>{`
                    .overflow-y-auto::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {chatLoading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90e2f8]"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-[#B7C2D6] py-8">
                      No hay mensajes en esta conversación
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.from === 'business' ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
                          message.from === 'business'
                            ? 'bg-[#0073ba] text-white'
                            : 'bg-[#1e272a] text-white'
                        }`} style={{ wordBreak: 'break-word' }}>
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content.body}</p>
                          <div className="flex items-center justify-end mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {message.from === 'business' && message.status && (
                              <div className="ml-1 flex items-center space-x-0.5">
                                {message.status === 'sent' && (
                                  <svg className="w-5 h-5 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {message.status === 'delivered' && (
                                  <>
                                    <svg className="w-5 h-5 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <svg className="w-5 h-5 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </>
                                )}
                                {message.status === 'read' && (
                                  <>
                                    <svg className="w-5 h-5 text-[#007bff]" fill="currentColor" viewBox="0 1 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <svg className="w-5 h-5 text-[#007bff]" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </>
                                )}
                                {message.status === 'failed' && (
                                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11h2v5h-2V7zm0 6h2v2h-2v-2z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Message Input - Absolute positioned at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#0b1e34] border-t border-[#012f78] p-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage()
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 text-sm border-2 border-[#3ea0c9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent bg-[#000e24] text-white"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-[#0073ba] hover:bg-[#005a92] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-[#B7C2D6]">
                <svg className="w-16 h-16 mx-auto mb-4 text-[#3ea0c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Selecciona una conversación para empezar a chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
 return (
   <ConversationsProvider>
     <DashboardContent />
   </ConversationsProvider>
 )
}
