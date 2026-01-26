
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: number;
}

interface ChatScreenProps {
  otherName: string;
  otherAvatar: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ otherName, otherAvatar, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: `Hi, I've booked a seat for the ride to ${otherName === 'Arjun' ? 'Kollam' : 'Thrissur'}.`, sender: 'me', timestamp: Date.now() - 3600000 },
    { id: '2', text: `Got it! I'm starting at the scheduled time. See you at the pickup point.`, sender: 'other', timestamp: Date.now() - 3500000 }
  ]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    "I'm at the pickup point",
    "On my way!",
    "Running 5 mins late",
    "Wait for me!"
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const content = text || inputText;
    if (!content.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: content,
      sender: 'me',
      timestamp: Date.now()
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate response
    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Ok, noted. Safe travels!",
        sender: 'other',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-surface-alt animate-in slide-in-from-right-8">
      {/* Header */}
      <header className="px-6 py-6 bg-surface border-b border-subtle flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-muted hover:text-main">
          <Icons.Plus className="w-5 h-5 rotate-45" />
        </button>
        <div className="relative">
          <img src={otherAvatar} className="w-10 h-10 rounded-xl border-2 border-[var(--color-primary)]/20" alt={otherName} />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase text-main tracking-tight">{otherName}</h3>
          <p className="text-[8px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Active Now</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
              msg.sender === 'me' 
                ? 'bg-[var(--color-primary)] text-white rounded-tr-none' 
                : 'bg-surface text-main rounded-tl-none border border-subtle'
            }`}>
              {msg.text}
              <div className={`text-[8px] mt-1 opacity-50 font-bold uppercase ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-surface border-t border-subtle space-y-4">
        {/* Quick Replies */}
        <div className="flex gap-2 overflow-x-auto pb-2 scroll-hide">
          {quickReplies.map(reply => (
            <button 
              key={reply}
              onClick={() => handleSend(reply)}
              className="whitespace-nowrap px-4 py-2 bg-surface-alt border border-subtle rounded-full text-[9px] font-black uppercase tracking-widest text-muted hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
            >
              {reply}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface-alt rounded-2xl border border-subtle p-1 flex items-center focus-within:border-[var(--color-primary)] transition-all">
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message..." 
              className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-main outline-none placeholder:text-muted/50"
            />
          </div>
          <button 
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${inputText.trim() ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' : 'bg-surface-alt text-muted'}`}
          >
            <Icons.Plus className="w-5 h-5 rotate-[135deg]" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
