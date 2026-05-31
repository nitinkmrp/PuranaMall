import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import './Resell.css';
import './Chat.css';

const Chat = () => {
  const { otherUserId, productId } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('pm-theme') || 'dark');

  useEffect(() => {
    document.body.className = `deccan-theme ${theme}-mode`;
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('pm-theme', newTheme);
  };

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  let typingTimeout = null;

  useEffect(() => {
    if (user) {
      // Request Web Notifications permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      socketRef.current = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
      socketRef.current.emit('join', user.id);

      socketRef.current.on('newMessage', (message) => {
        if (message.product_id == productId && (message.sender_id == otherUserId || message.receiver_id == otherUserId)) {
          setMessages(prev => [...prev, message]);
        }
        
        // Play premium incoming chat audio alert
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
          audio.volume = 0.4;
          audio.play();
        } catch (err) {}

        // Notify if user has the tab hidden or is viewing another window
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('✉️ New Message on PuranaMall', {
            body: message.message || 'You received a new message.',
            icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968771.png'
          });
        }
      });

      socketRef.current.on('typing', (data) => {
        if (data.senderId == otherUserId && data.productId == productId) {
          setIsTyping(true);
        }
      });

      socketRef.current.on('stopTyping', (data) => {
        if (data.senderId == otherUserId && data.productId == productId) {
          setIsTyping(false);
        }
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [user, otherUserId, productId]);

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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/messages/conversations`, {
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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/messages/chat/${otherId}/${pId}`, {
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

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socketRef.current && user && otherUserId && productId) {
      socketRef.current.emit('typing', { senderId: user.id, receiverId: otherUserId, productId });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socketRef.current.emit('stopTyping', { senderId: user.id, receiverId: otherUserId, productId });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId || !productId) return;

    if (socketRef.current && user && otherUserId && productId) {
      socketRef.current.emit('stopTyping', { senderId: user.id, receiverId: otherUserId, productId });
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/messages`, {
        receiver_id: otherUserId,
        product_id: productId,
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages(prev => [...prev, {
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
    <div className={`pm-wrapper chat-wrapper deccan-theme ${theme}-mode`}>
      {/* Background ambient lighting and grid layer for Deccan Experts feel */}
      <div className="deccan-glow-blob-1"></div>
      <div className="deccan-glow-blob-2"></div>
      <div className="deccan-grid-overlay"></div>

      <nav className="pm-navbar deccan-navbar">
        <div className="pm-brand-logo" onClick={() => navigate('/')} title="PuranaMall Home" style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 400 80" width="145" height="34" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="60" fontSize="58" fontWeight="900" fill="var(--deccan-text-main)" letterSpacing="-3">PuranaMall</text>
            <circle cx="288" cy="20" r="8" fill="var(--deccan-primary)" />
          </svg>
        </div>
        <div className="pm-nav-user-actions">
          <button className="pm-theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{ marginRight: '8px' }}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button className="pm-sell-btn" onClick={() => navigate('/')}>Back to Home</button>
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
                  {isTyping && (
                    <div className="typing-indicator" style={{ padding: '10px', color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      typing...
                    </div>
                  )}
                </div>
                
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={handleTyping}
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
