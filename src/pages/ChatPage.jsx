import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { mockDb } from '../services/firebase';

export default function ChatPage() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const ChatMark = () => (
    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold leading-none w-6 h-6">
      C
    </span>
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // For guest users, admin ID is fixed
  const ADMIN_ID = 'admin_system';
  const ADMIN_NAME = 'Admin Support';

  // Initialize current user type
  useEffect(() => {
    if (user) {
      if (role === 'admin' || role === 'manager') {
        setCurrentUser({ id: 'admin_system', name: 'Admin', type: 'admin' });
      } else {
        setCurrentUser({ id: user.email || user.id, name: user.name, type: 'guest' });
      }
    }
  }, [user, role]);

  // Load conversations for admin
  useEffect(() => {
    if (currentUser?.type === 'admin') {
      const convs = mockDb.getConversations(ADMIN_ID);
      setConversations(convs);
    }
  }, [currentUser]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation && currentUser) {
      const unsub = mockDb.listenMessages(currentUser.id, selectedConversation.userId, (msgs) => {
        setMessages(msgs);
        // Mark as read
        setTimeout(() => scrollToBottom(), 100);
      });
      return () => unsub();
    }
  }, [selectedConversation, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    mockDb.sendMessage(
      currentUser.id,
      currentUser.name,
      selectedConversation.userId,
      selectedConversation.userName,
      newMessage
    );

    setNewMessage('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Guest view - always chat with admin
  if (currentUser.type === 'guest') {
    return (
      <div className="min-h-screen bg-white pt-20 pb-4 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex flex-col h-[calc(100vh-100px)]">
          {/* Header */}
          <div className="bg-white rounded-t-2xl border-b border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChatMark />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Chat with Admin</h2>
                <p className="text-xs text-slate-600">Guest Support</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Messages Area */}
          <div className="bg-white flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ChatMark />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${
                      msg.senderId === currentUser.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm font-medium">{msg.senderName}</p>
                    <p className="text-sm mt-1">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-blue-100' : 'text-slate-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white rounded-b-2xl border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 border-2 border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin view - manage conversations with all users
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Chat Management</h1>
            <p className="text-slate-400">Admin Support Portal</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-150px)]">
          {/* Conversations List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 font-bold">
              Conversations ({conversations.length})
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <ChatMark />
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedConversation?.userId === conv.userId ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{conv.userName}</p>
                        <p className="text-sm text-slate-600 truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-1">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(conv.lastTimestamp).toLocaleTimeString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {!selectedConversation ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg h-full flex flex-col items-center justify-center text-slate-500">
                <ChatMark />
                <p className="text-lg font-semibold">Select a conversation to start</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg h-full flex flex-col">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center gap-3 rounded-t-2xl">
                  <User className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold">{selectedConversation.userName}</h3>
                    <p className="text-sm text-blue-100">Guest</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-3 rounded-lg ${
                            msg.senderId === currentUser.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm font-medium">{msg.senderName}</p>
                          <p className="text-sm mt-1">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-blue-100' : 'text-slate-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-slate-200 p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 border-2 border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
