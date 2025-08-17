import api from './api';

export async function loginService({ username, password }) {
  const { data } = await api.post('/auth/login', { username, password });
  if (data?.token) {
    localStorage.setItem('token', data.token);
  }
  return data?.user;
}

export function logoutService() {
  localStorage.removeItem('token');
}
