import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Resell.css';
import './Chat.css';

const Chat = () => {
  const { otherUserId, productId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    fetchConversations();
    if (otherUserId && productId) {
      fetchMessages(otherUserId, productId);
    } else {
      setLoading(false);
    }
  }, [otherUserId, productId, navigate]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherId, pId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/messages/chat/${otherId}/${pId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId || !productId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/messages', {
        receiver_id: otherUserId,
        product_id: productId,
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages([...messages, {
          ...response.data.message,
          sender_id: user.id,
          sender_name: user.name
        }]);
        setNewMessage('');
        fetchConversations(); // refresh sidebar
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="olx-wrapper chat-wrapper">
      <nav className="olx-navbar">
        <div className="olx-logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>PuranaMall</div>
        <div className="olx-nav-actions">
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </nav>

      <main className="chat-main">
        <div className="chat-container">
          {/* Sidebar */}
          <div className="chat-sidebar">
            <h2 className="chat-header">Messages</h2>
            {conversations.length === 0 ? (
              <p className="no-chats">No conversations yet.</p>
            ) : (
              <div className="conversation-list">
                {conversations.map(conv => (
                  <div 
                    key={`${conv.product_id}-${conv.other_user_id}`}
                    className={`conversation-item ${otherUserId == conv.other_user_id && productId == conv.product_id ? 'active' : ''}`}
                    onClick={() => navigate(`/chat/${conv.other_user_id}/${conv.product_id}`)}
                  >
                    <img src={conv.product_image || 'https://via.placeholder.com/50'} alt="product" className="conv-img" />
                    <div className="conv-info">
                      <h4>{conv.other_user_name}</h4>
                      <p>{conv.product_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            {(!otherUserId || !productId) ? (
              <div className="empty-chat">
                <h3>Select a conversation to start chatting</h3>
              </div>
            ) : loading ? (
              <div className="loading-chat">Loading messages...</div>
            ) : (
              <>
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="no-messages">Send a message to start the conversation!</div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`message-bubble-wrapper ${isMe ? 'sent' : 'received'}`}>
                          <div className={`message-bubble ${isMe ? 'my-message' : 'their-message'}`}>
                            {msg.message}
                          </div>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" disabled={!newMessage.trim()}>Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
