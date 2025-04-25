const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://chatapp-production-f43f.up.railway.app/' // Your production API URL
    : 'http://localhost:8000';

export const API_URLS = {
  login: `${API_BASE_URL}/api/login/`,
  register: `${API_BASE_URL}/api/register/`,
  users: `${API_BASE_URL}/api/users/`,
  conversations: `${API_BASE_URL}/api/conversations/`,
  messages: `${API_BASE_URL}/api/messages/`,
  startConversation: `${API_BASE_URL}/api/conversations/start_conversation/`,
  markAsRead: `${API_BASE_URL}/api/messages/mark_as_read/`,
};

export default API_BASE_URL;
