'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
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
    lastMessageStatus?: 'sent' | 'delivered' | 'read' | 'failed';
    lastMessageFrom?: 'customer' | 'business';
    messageCount: number;
    pendingReply: boolean;
    customerProfilePic?: string;
    unreadCount?: number;
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
 
 interface UpdatedConversation {
   customerWaId: string;
   customerName: string;
   lastMessage: string;
   lastMessageTime: string;
   pendingReply: boolean;
   unreadCount?: number;
 }

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [whatsAppNumbers, setWhatsAppNumbers] = useState<WhatsAppNumber[]>([])
  const [selectedWhatsAppNumber, setSelectedWhatsAppNumber] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
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
      } else {
        // Si no hay datos en localStorage, redirigir al login
        router.push('/login')
        return
      }

      // Obtener WhatsApp Numbers del usuario
      fetchWhatsAppNumbers()
    } catch (error) {
      console.error('Error fetching user data:', error)
      router.push('/login')
    }
  }, [router])

  const fetchWhatsAppNumbers = useCallback(async () => {
     try {
       const token = localStorage.getItem('token')
       if (!token) return

       const userId = localStorage.getItem('userId') || '1';
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
             // fetchConversations(data.whatsAppNumbers[0]._id)
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
           // Not Modified - usar datos en caché o array vacío
           setWhatsAppNumbers([])
         } else {
           console.error('Error fetching WhatsApp numbers:', response.statusText)
         }
       }
     } catch (error) {
       console.error('Error fetching WhatsApp numbers:', error)
     } finally {
       setLoading(false)
     }
   }, [apiUrl])

  const fetchConversations = useCallback(async (whatsAppNumberId: string) => {
     try {
       setLoading(true)
       const token = localStorage.getItem('token')
       if (!token) return

       // Obtener conversaciones filtradas por WhatsAppNumberId y userId
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
           setConversations(data.conversations)
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
           // Not Modified - usar datos en caché o array vacío
           setConversations([])
           setLoading(false)
         } else {
           console.error('Error fetching conversations:', response.statusText)
           setConversations([])
         }
       }
     } catch (error) {
       console.error('Error fetching conversations:', error)
       setConversations([])
     } finally {
       setLoading(false)
     }
   }, [apiUrl])

  const fetchMessages = useCallback(async (customerWaId: string, whatsAppNumberId: string) => {
    try {
      setChatLoading(true)
      // Obtener mensajes de una conversación específica
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
          // Token inválido, redirigir al login
          localStorage.removeItem('token')
          localStorage.removeItem('userId')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
          router.push('/login')
          return
        } else if (response.status === 304) {
          // Not Modified - usar datos en caché o array vacío
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
    if (!newMessage.trim() || !selectedConversation || !selectedWhatsAppNumber) return

    const token = localStorage.getItem('token')
    if (!token) return

    // Crear mensaje optimista
    const optimisticMessage: Message = {
      _id: `optimistic-${Date.now()}`,
      content: {
        body: newMessage.trim()
      },
      timestamp: new Date().toISOString(),
      from: 'business',
      type: 'text',
      messageId: `optimistic-${Date.now()}`,
      customerWaId: selectedConversation,
      whatsAppNumberId: selectedWhatsAppNumber,
      status: 'sent' // Estado inicial
    }

    // Agregar mensaje optimista al estado local de mensajes
    setMessages(prevMessages => [...prevMessages, optimisticMessage])
    
    // Actualizar la lista de conversaciones con el nuevo mensaje
    setConversations(prevConversations => {
      return prevConversations.map(conversation => {
        if (conversation.customerWaId === selectedConversation) {
          return {
            ...conversation,
            lastMessage: newMessage.trim(),
            lastMessageTime: new Date().toISOString(),
            lastMessageStatus: 'sent',
            lastMessageFrom: 'business',
            messageCount: conversation.messageCount + 1
          }
        }
        return conversation
      })
    })

    setNewMessage('') // Limpiar el campo de mensaje inmediatamente

    try {
      const response = await fetch(`${apiUrl}/api/messages/send-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsAppNumberId: selectedWhatsAppNumber,
          customerWaId: selectedConversation,
          message: newMessage.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // El mensaje real llegará via Socket.IO, así que no necesitamos hacer nada aquí
          console.log('✅ Mensaje enviado exitosamente')
        } else {
          console.error('Error en respuesta:', data.message)
          // Si hay error, podríamos mostrar una notificación al usuario
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error HTTP:', response.status, errorData.message || response.statusText)
        // Podríamos mostrar un error al usuario aquí
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      // Podríamos mostrar un error al usuario aquí
    }
  }, [newMessage, selectedConversation, selectedWhatsAppNumber, apiUrl])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  useEffect(() => {
    if (selectedWhatsAppNumber) {
      fetchConversations(selectedWhatsAppNumber)
    }
  }, [selectedWhatsAppNumber, fetchConversations])

  // Configuración de Socket.IO para mensajes en tiempo real
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
      // Remover mensajes optimistas para evitar duplicados
      setMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg =>
          !(msg.messageId.startsWith('optimistic-') &&
            msg.from === 'business' &&
            msg.customerWaId === newMessage.customerWaId)
        )
        // Solo agregar el mensaje si pertenece a la conversación actual
        if (selectedConversation === newMessage.customerWaId &&
            selectedWhatsAppNumber === newMessage.whatsAppNumberId) {
          return [...filteredMessages, newMessage]
        }
        return filteredMessages
      })

      if (newMessage.from === 'customer' && newMessage.whatsAppNumberId === selectedWhatsAppNumber) {
        // Si es un mensaje de cliente en una conversación diferente, incrementar contador de no leídos
        setConversations(prevConversations => {
          return prevConversations.map(conv => {
            if (conv.customerWaId === newMessage.customerWaId) {
              return {
                ...conv,
                unreadCount: (conv.unreadCount || 0) + 1,
                lastMessage: newMessage.content.body,
                lastMessageTime: newMessage.timestamp
              }
            }
            return conv
          })
        })
      }
    })

    // Escuchar eventos de cambio de estado de mensajes
    newSocket.on('message-status-update', (statusData: { messageId: string; status: string; timestamp: string }) => {
      console.log('📊 Estado de mensaje actualizado:', statusData)
      
      // Actualizar estado en mensajes del chat
      setMessages(prevMessages => {
        return prevMessages.map(message => {
          if (message.messageId === statusData.messageId) {
            return { ...message, status: statusData.status as 'sent' | 'delivered' | 'read' | 'failed' }
          }
          return message
        })
      })

      // Actualizar estado en la lista de conversaciones si es el último mensaje
      setConversations(prevConversations => {
        return prevConversations.map(conversation => {
          // Verificar si este mensaje es el último mensaje de la conversación
          const updatedMessages = messages.map(msg =>
            msg.messageId === statusData.messageId
              ? { ...msg, status: statusData.status as 'sent' | 'delivered' | 'read' | 'failed' }
              : msg
          )
          
          // Encontrar el último mensaje de negocio en la conversación actualizada
          const lastBusinessMessage = updatedMessages
            .filter(msg => msg.from === 'business')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

          if (lastBusinessMessage && lastBusinessMessage.messageId === statusData.messageId) {
            return {
              ...conversation,
              lastMessageStatus: statusData.status as 'sent' | 'delivered' | 'read' | 'failed'
            }
          }
          return conversation
        })
      })
    })

    // Escuchar eventos de actualización de conversaciones
    newSocket.on('conversation-updated', (updatedConversation: any) => {
      console.log('🔄 Conversación actualizada:', updatedConversation)
      setConversations(prevConversations => {
        // Buscar si la conversación ya existe
        const existingConvIndex = prevConversations.findIndex(
          conv => conv.customerWaId === updatedConversation.customerWaId
        )

        if (existingConvIndex >= 0) {
          // Actualizar conversación existente
          const updatedConvs = [...prevConversations]
          const currentUnreadCount = updatedConvs[existingConvIndex].unreadCount || 0
          
          // Determinar si debemos mostrar palomitas (solo para mensajes de negocio)
          const shouldShowCheckmarks = updatedConversation.lastMessageFrom === 'business' &&
                                     updatedConversation.lastMessageStatus;
          
          updatedConvs[existingConvIndex] = {
            ...updatedConvs[existingConvIndex],
            lastMessage: updatedConversation.lastMessage,
            lastMessageTime: updatedConversation.lastMessageTime,
            messageCount: updatedConvs[existingConvIndex].messageCount + 1,
            pendingReply: updatedConversation.pendingReply,
            unreadCount: updatedConversation.pendingReply ? currentUnreadCount + 1 : currentUnreadCount,
            // Solo mantener lastMessageStatus y lastMessageFrom para mensajes de negocio
            lastMessageStatus: shouldShowCheckmarks ? updatedConversation.lastMessageStatus : undefined,
            lastMessageFrom: shouldShowCheckmarks ? updatedConversation.lastMessageFrom : undefined
          }
          return updatedConvs
        } else {
          // Agregar nueva conversación si no existe
          const shouldShowCheckmarks = updatedConversation.lastMessageFrom === 'business' &&
                                     updatedConversation.lastMessageStatus;
          
          return [
            {
              customerWaId: updatedConversation.customerWaId,
              customerName: updatedConversation.customerName,
              customerPhone: updatedConversation.customerWaId,
              displayName: 'Nueva Conversación',
              lastMessage: updatedConversation.lastMessage,
              lastMessageTime: updatedConversation.lastMessageTime,
              lastMessageStatus: shouldShowCheckmarks ? updatedConversation.lastMessageStatus : undefined,
              lastMessageFrom: shouldShowCheckmarks ? updatedConversation.lastMessageFrom : undefined,
              messageCount: 1,
              pendingReply: updatedConversation.pendingReply,
              unreadCount: updatedConversation.pendingReply ? 1 : 0
            },
            ...prevConversations
          ]
        }
      })
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor Socket.IO')
    })

    return () => {
      newSocket.disconnect()
    }
  }, [apiUrl, selectedConversation, selectedWhatsAppNumber])

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
  }, [socket, selectedConversation, selectedWhatsAppNumber, user?.id])

  // Efecto para unirse a la sala del usuario cuando el usuario o el socket cambian
  useEffect(() => {
    if (socket && user) {
      socket.emit('join-user-room', { userId: user.id });
      console.log('👤 Uniéndose a sala de usuario:', user.id);
    }
  }, [socket, user?.id])

  // Auto-scroll al fondo del chat cuando cambian los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, selectedConversation])

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
          {/* Left section - Logo and title */}
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

          {/* Right section - User info and logout button */}
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

      {/* Selector de WhatsApp Numbers */}
      <div className="bg-[#0b1e34] border-b border-[#012f78] px-6 py-3 relative z-50">
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
      </div>

      {/* Main Content - WhatsApp Layout */}
      <div className="flex flex-1 overflow-hidden relative z-50">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-[#0b1e34] border-r border-[#012f78] flex flex-col h-full">
          <div className="p-4 border-b border-[#012f78] flex-shrink-0">
            <h2 className="text-lg font-semibold text-white">
              Conversaciones
            </h2>
            <div className="mt-2 text-sm text-[#B7C2D6]">
              {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)} mensajes sin leer
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pb-4">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90e2f8] mx-auto"></div>
                <p className="text-[#B7C2D6] mt-2">Cargando conversaciones...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-[#B7C2D6]">
                No hay conversaciones disponibles
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
                    // Marcar mensajes como leídos
                    if ((conversation.unreadCount || 0) > 0) {
                      setConversations(prevConversations => {
                        return prevConversations.map(conv => {
                          if (conv.customerWaId === conversation.customerWaId) {
                            return { ...conv, unreadCount: 0 }
                          }
                          return conv
                        })
                      })
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-[#012f78] hover:bg-opacity-50 border-b border-[#012f78] relative z-50 transition-colors ${
                    selectedConversation === conversation.customerWaId ? 'bg-[#012f78] bg-opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {conversation.customerProfilePic ? (
                        <img
                          src={conversation.customerProfilePic}
                          alt={conversation.customerName}
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
                             <svg className="w-5 h-5 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                             </svg>
                           )}
                           {conversation.lastMessageStatus === 'delivered' && (
                             <>
                               <svg className="w-5 h-5 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                               </svg>
                               <svg className="w-5 h-5 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                               </svg>
                             </>
                           )}
                           {conversation.lastMessageStatus === 'read' && (
                             <>
                               <svg className="w-5 h-5 text-[#90e2f8]" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                               </svg>
                               <svg className="w-5 h-5 text-[#90e2f8]" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                               </svg>
                             </>
                           )}
                           {conversation.lastMessageStatus === 'failed' && (
                             <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
            {/* Elemento invisible para auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#000e24] relative z-50 h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-[#0b1e34] border-b border-[#012f78] px-4 py-3 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const currentConversation = conversations.find(c => c.customerWaId === selectedConversation);
                    return currentConversation?.customerProfilePic ? (
                      <img
                        src={currentConversation.customerProfilePic}
                        alt={currentConversation.customerName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#3ea0c9]"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#0b1e34] border-2 border-[#3ea0c9] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white">
                      {conversations.find(c => c.customerWaId === selectedConversation)?.customerName ||
                       conversations.find(c => c.customerWaId === selectedConversation)?.customerPhone}
                    </h2>
                    <p className="text-sm text-[#B7C2D6]">
                      En línea
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-[#B7C2D6] hover:text-white">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-6.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-full">
                {chatLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#90e2f8] mx-auto"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-[#B7C2D6] py-8">
                    <p>No hay mensajes en esta conversación</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.from === 'business' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${
                        message.from === 'business'
                          ? 'bg-[#045d57] text-white'
                          : 'bg-[#1f272a] text-white'
                      }`}>
                        <p>{message.content.body}</p>
                        <div className={`text-xs mt-1 ${message.from === 'business' ? 'flex items-center justify-end gap-1 text-[#B7C2D6]' : 'text-[#B7C2D6]'}`}>
                          {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.from === 'business' && (
                            <div className="flex items-center">
                              {message.status === 'sent' && (
                                <>
                                  <svg className="w-4 h-4 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </>
                              )}
                              {message.status === 'delivered' && (
                                <>
                                  <svg className="w-4 h-4 text-[#B7C2D6] mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <svg className="w-4 h-4 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </>
                              )}
                              {message.status === 'read' && (
                                <>
                                  <svg className="w-4 h-4 text-[#90e2f8] mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <svg className="w-4 h-4 text-[#90e2f8]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </>
                              )}
                              {message.status === 'failed' && (
                                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                              {/* Elemento invisible para auto-scroll */}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="bg-[#0b1e34] border-t border-[#012f78] px-4 py-3 relative z-50 flex-shrink-0">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="w-full px-4 py-2 border border-[#3ea0c9] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#3ea0c9] focus:border-transparent bg-[#000e24] text-white"
                      rows={1}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    className="bg-[#0073ba] hover:bg-[#005a92] text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center"
                    disabled={!newMessage.trim() || chatLoading}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-[#0b1e34] border-2 border-[#3ea0c9] rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-[#B7C2D6]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-[#B7C2D6]">
                  Elige una conversación del panel lateral para ver los mensajes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}