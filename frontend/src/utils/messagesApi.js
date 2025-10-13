export const fetchConversations = async (token) => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/conversations`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
import axios from "axios";

export const fetchMessages = async (userId, recipientId, token) => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/messages`,
    {
      params: { userId, recipientId },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const sendMessageApi = async (sender, recipient, text, token) => {
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/messages`,
    { sender, recipient, text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
