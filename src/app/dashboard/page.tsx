'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

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
         }
         console.error('Error fetching WhatsApp numbers:', response.statusText)
       }
     } catch (error) {
       console.error('Error fetching WhatsApp numbers:', error)
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
         }
         console.error('Error fetching conversations:', response.statusText)
         setConversations([])
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
        }
        console.error('Error fetching messages:', response.statusText)
        setMessages([])
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
              {conversations.filter(c => c.pendingReply).length} mensajes sin responder
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
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 ${
                    selectedConversation === conversation.customerWaId ? 'bg-green-50 dark:bg-green-900' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.customerName || conversation.customerPhone}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(conversation.lastMessageTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.messageCount} mensajes
                        </span>
                        {conversation.pendingReply && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Responder
                          </span>
                        )}
                      </div>
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
                <div className="flex items-center">
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
                ) : (
                  // Mock messages for demo
                  <>
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                        <p className="text-gray-900 dark:text-white">¡Hola! Necesito información sobre sus servicios.</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10:30 AM</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-green-500 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                        <p className="text-white">¡Hola! Claro, ¿en qué puedo ayudarte?</p>
                        <p className="text-xs text-green-100 mt-1">10:31 AM</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                        <p className="text-gray-900 dark:text-white">Me gustaría agendar una cita para mañana.</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10:32 AM</p>
                      </div>
                    </div>
                  </>
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