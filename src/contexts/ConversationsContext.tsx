'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'

export interface Conversation {
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

interface ConversationsState {
  conversations: Conversation[];
  loading: boolean;
}

type ConversationsAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_CONVERSATION_STATUS'; payload: { customerWaId: string; status: 'sent' | 'delivered' | 'read' | 'failed' } }
  | { type: 'INCREMENT_UNREAD_COUNT'; payload: string }
  | { type: 'RESET_UNREAD_COUNT'; payload: string }
  | { type: 'UPDATE_CONVERSATION_LAST_MESSAGE'; payload: { customerWaId: string; lastMessage: string; lastMessageTime: string; lastMessageFrom: 'customer' | 'business'; lastMessageStatus?: 'sent' | 'delivered' | 'read' | 'failed' } }

interface ConversationsContextType {
  state: ConversationsState;
  dispatch: React.Dispatch<ConversationsAction>;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined)

function conversationsReducer(state: ConversationsState, action: ConversationsAction): ConversationsState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'UPDATE_CONVERSATION_STATUS':
      return {
        ...state,
        conversations: state.conversations.map(conversation =>
          conversation.customerWaId === action.payload.customerWaId
            ? { ...conversation, lastMessageStatus: action.payload.status, lastMessageFrom: 'business' }
            : conversation
        )
      }
    case 'INCREMENT_UNREAD_COUNT':
      return {
        ...state,
        conversations: state.conversations.map(conversation =>
          conversation.customerWaId === action.payload
            ? { ...conversation, unreadCount: (conversation.unreadCount || 0) + 1 }
            : conversation
        )
      }
    case 'RESET_UNREAD_COUNT':
      return {
        ...state,
        conversations: state.conversations.map(conversation =>
          conversation.customerWaId === action.payload
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      }
    case 'UPDATE_CONVERSATION_LAST_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conversation =>
          conversation.customerWaId === action.payload.customerWaId
            ? {
                ...conversation,
                lastMessage: action.payload.lastMessage,
                lastMessageTime: action.payload.lastMessageTime,
                lastMessageFrom: action.payload.lastMessageFrom,
                lastMessageStatus: action.payload.lastMessageStatus
              }
            : conversation
        )
      }
    default:
      return state
  }
}

interface ConversationsProviderProps {
  children: ReactNode;
}

export function ConversationsProvider({ children }: ConversationsProviderProps) {
  const [state, dispatch] = useReducer(conversationsReducer, {
    conversations: [],
    loading: false
  })

  return (
    <ConversationsContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationsContext.Provider>
  )
}

export function useConversations() {
  const context = useContext(ConversationsContext)
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationsProvider')
  }
  return context
}