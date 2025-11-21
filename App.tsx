import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Chat } from '@google/genai';
import { v4 as uuidv4 } from 'uuid'; 

import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { QuickActions } from './components/QuickActions';
import { Message, Sender } from './types';
import { createChatSession, sendMessageStream } from './services/geminiService';
import { INITIAL_SUGGESTIONS } from './constants';

// Simple ID generator to avoid external dependencies for this demo
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: Sender.Bot,
      text: "Namaste! Welcome to TechSanju Support. I'm Sanju. How can I assist you with your electronics today?",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // We use a ref for the chat session to persist it across renders without triggering re-renders itself
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat on mount
  useEffect(() => {
    startNewSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewSession = () => {
    try {
      chatSessionRef.current = createChatSession();
      setMessages([{
        id: generateId(),
        sender: Sender.Bot,
        text: "Namaste! Welcome to TechSanju Support. I'm Sanju. How can I assist you with your electronics today?",
        timestamp: new Date(),
      }]);
      setInputText('');
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to initialize chat:", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !chatSessionRef.current) return;

    const userMsgId = generateId();
    const botMsgId = generateId();

    // 1. Add User Message
    const userMessage: Message = {
      id: userMsgId,
      sender: Sender.User,
      text: text,
      timestamp: new Date(),
    };

    // 2. Add Placeholder Bot Message (Typing state)
    const botPlaceholder: Message = {
      id: botMsgId,
      sender: Sender.Bot,
      text: '',
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages(prev => [...prev, userMessage, botPlaceholder]);
    setInputText('');
    setIsLoading(true);

    try {
      let fullResponse = "";
      const stream = sendMessageStream(chatSessionRef.current, text);

      // 3. Stream response
      for await (const chunk of stream) {
        fullResponse += chunk;
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, text: fullResponse, isTyping: false } 
            : msg
        ));
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId 
          ? { ...msg, text: "I'm having trouble connecting to the server right now. Please try again momentarily.", isTyping: false } 
          : msg
      ));
    } finally {
      setIsLoading(false);
      // Focus back on input for better UX on desktop
      if (window.innerWidth > 768) {
        inputRef.current?.focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white shadow-2xl overflow-hidden md:rounded-xl md:my-8 md:h-[90vh] md:border border-slate-200">
      
      <Header onReset={startNewSession} />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {!isLoading && (
        <div className="bg-slate-50 border-t border-slate-100">
           <QuickActions 
             actions={INITIAL_SUGGESTIONS} 
             onSelect={(query) => handleSendMessage(query)} 
             disabled={isLoading}
           />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form 
          onSubmit={handleSubmit}
          className="flex items-center bg-slate-100 rounded-full px-2 py-2 border border-transparent focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all"
        >
          <button 
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full"
            title="Attach file (Demo only)"
          >
            <Paperclip size={20} />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none focus:ring-0 px-2 text-slate-800 placeholder-slate-400 outline-none"
          />
          
          <button 
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-2 rounded-full transition-all duration-200 ${
              inputText.trim() && !isLoading
                ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md transform hover:scale-105' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} className={isLoading ? 'opacity-0' : 'opacity-100'} />
            {isLoading && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               </div>
            )}
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-slate-400">
            Sanju can make mistakes. Please verify important info.
          </p>
        </div>
      </div>

    </div>
  );
};

export default App;