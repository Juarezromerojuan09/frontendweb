'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'

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
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setChatLoading(true)
      const token = localStorage.getItem('token')
      if (!token) return

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
          // Limpiar el campo de mensaje
          setNewMessage('')
          // Opcional: refrescar los mensajes para ver el nuevo mensaje
          if (selectedConversation && selectedWhatsAppNumber) {
            fetchMessages(selectedConversation, selectedWhatsAppNumber)
          }
        } else {
          console.error('Error en respuesta:', data.message)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error HTTP:', response.status, errorData.message || response.statusText)
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
    } finally {
      setChatLoading(false)
    }
  }, [newMessage, selectedConversation, selectedWhatsAppNumber, apiUrl, fetchMessages])

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
      // Solo agregar el mensaje si pertenece a la conversación actual
      if (selectedConversation === newMessage.customerWaId &&
          selectedWhatsAppNumber === newMessage.whatsAppNumberId) {
        setMessages(prevMessages => [...prevMessages, newMessage])
      } else if (newMessage.from === 'customer' && newMessage.whatsAppNumberId === selectedWhatsAppNumber) {
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
      setMessages(prevMessages => {
        return prevMessages.map(message => {
          if (message.messageId === statusData.messageId) {
            return { ...message, status: statusData.status as 'sent' | 'delivered' | 'read' | 'failed' }
          }
          return message
        })
      })
    })

    // Escuchar eventos de actualización de conversaciones
    newSocket.on('conversation-updated', (updatedConversation: UpdatedConversation) => {
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
          updatedConvs[existingConvIndex] = {
            ...updatedConvs[existingConvIndex],
            lastMessage: updatedConversation.lastMessage,
            lastMessageTime: updatedConversation.lastMessageTime,
            messageCount: updatedConvs[existingConvIndex].messageCount + 1,
            pendingReply: updatedConversation.pendingReply,
            unreadCount: updatedConversation.pendingReply ? currentUnreadCount + 1 : currentUnreadCount
          }
          return updatedConvs
        } else {
          // Agregar nueva conversación si no existe
          return [
            {
              customerWaId: updatedConversation.customerWaId,
              customerName: updatedConversation.customerName,
              customerPhone: updatedConversation.customerWaId, // Usar WA ID como teléfono por defecto
              displayName: 'Nueva Conversación', // Esto debería venir del backend
              lastMessage: updatedConversation.lastMessage,
              lastMessageTime: updatedConversation.lastMessageTime,
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
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            WhatsApp Business
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Selector de WhatsApp Numbers */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-2">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Número WhatsApp:
          </label>
          <select
            value={selectedWhatsAppNumber || ''}
            onChange={(e) => setSelectedWhatsAppNumber(e.target.value)}
            className="flex-1 max-w-xs px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversaciones
            </h2>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)} mensajes sin leer
            </div>
          </div>

          <div className="overflow-y-auto h-full pb-4">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando conversaciones...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No hay conversaciones disponibles
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.customerWaId}
                  onClick={() => {
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
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 ${
                    selectedConversation === conversation.customerWaId ? 'bg-green-50 dark:bg-green-900' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {conversation.customerProfilePic ? (
                        <img
                          src={conversation.customerProfilePic}
                          alt={conversation.customerName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.customerName || conversation.customerPhone}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${(conversation.unreadCount || 0) > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                            {new Date(conversation.lastMessageTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {(conversation.unreadCount || 0) > 0 && (
                            <div className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center font-medium">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
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
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const currentConversation = conversations.find(c => c.customerWaId === selectedConversation);
                    return currentConversation?.customerProfilePic ? (
                      <img
                        src={currentConversation.customerProfilePic}
                        alt={currentConversation.customerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {conversations.find(c => c.customerWaId === selectedConversation)?.customerName ||
                       conversations.find(c => c.customerWaId === selectedConversation)?.customerPhone}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      En línea
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-6.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
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
                          ? 'bg-green-500 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p>{message.content.body}</p>
                        <div className={`text-xs mt-1 ${message.from === 'business' ? 'flex items-center justify-end gap-1' : 'text-gray-500 dark:text-gray-400'}`}>
                          {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.from === 'business' && (
                            <div className="flex items-center">
                              {message.status === 'sent' && (
                                <>
                                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </>
                              )}
                              {message.status === 'delivered' && (
                                <>
                                  <svg className="w-3 h-3 text-gray-400 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </>
                              )}
                              {message.status === 'read' && (
                                <>
                                  <svg className="w-3 h-3 text-blue-500 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </>
                              )}
                              {message.status === 'failed' && (
                                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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

              {/* Message Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newMessage.trim() || chatLoading}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-6.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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