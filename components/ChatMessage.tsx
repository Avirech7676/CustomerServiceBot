import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { Message, Sender } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === Sender.Bot;

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${
          isBot ? 'bg-blue-600 text-white mr-3' : 'bg-slate-200 text-slate-600 ml-3'
        }`}>
          {isBot ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Bubble */}
        <div className={`relative px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isBot 
            ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
            : 'bg-blue-600 text-white rounded-tr-none'
        }`}>
          {message.isTyping ? (
            <div className="flex space-x-1 h-5 items-center">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            <div className="markdown-container">
               <ReactMarkdown 
                  components={{
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    a: ({node, ...props}) => <a className="underline hover:text-blue-200" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  }}
               >
                 {message.text}
               </ReactMarkdown>
            </div>
          )}
          
          <div className={`text-[10px] mt-1 opacity-70 ${isBot ? 'text-slate-400' : 'text-blue-100 text-right'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};
