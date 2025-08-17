import api from './api';

export async function listConversations({ page = 1, limit = 20, status } = {}) {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (status) params.status = status;
  const { data } = await api.get('/chat/conversations', { params });
  return data; // { data: [...], pagination: {...} }
}

export async function getMessages(conversationId) {
  const { data } = await api.get(`/chat/conversations/${conversationId}/messages`);
  return data; // array de mensajes
}

export async function sendMessageApi({ conversationId, text }) {
  const { data } = await api.post('/chat/send', { conversationId, text });
  return data; // mensaje creado
}

export async function updateConversationMode(conversationId, mode) {
  const { data } = await api.patch(`/chat/conversations/${conversationId}/mode`, { mode });
  return data; // conversación actualizada
}
