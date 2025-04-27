const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://chatapp-6k1l.onrender.com' // Your production API URL
    : 'http://localhost:8000';

export const API_URLS = {
  login: `${API_BASE_URL}/api/login/`,
  register: `${API_BASE_URL}/api/register/`,
  users: `${API_BASE_URL}/api/users/`,
  conversations: `${API_BASE_URL}/api/conversations/`,
  messages: `${API_BASE_URL}/api/messages/`,
  startConversation: `${API_BASE_URL}/api/conversations/start_conversation/`,
  markAsRead: `${API_BASE_URL}/api/messages/mark_as_read/`,
    unreadMessages: `${API_BASE_URL}/api/unread_messages/`,

};

export default API_BASE_URL;
