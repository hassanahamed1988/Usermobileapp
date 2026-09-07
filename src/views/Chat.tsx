
import React, { useState, useRef, useEffect } from 'react';

import { Send, User, Bot, Paperclip, Smile, MoreVertical, Search, ChevronLeft, X, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { getApiUrl } from '../utils/apiUrl';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chat: React.FC = () => {
  const { language, user, setView, isNightMode, appThemeMode } = useStore();
  const isDark = isNightMode || appThemeMode !== 'light';
  const t = TRANSLATIONS[language];
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('fleetpro_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        console.error("Failed to parse messages from local storage", e);
      }
    }
    return [
      {
        id: '1',
        text: 'আসসালামু আলাইকুম! আমি মোহাম্মদ হাসান। আপনাকে কীভাবে সাহায্য করতে পারি?',
        sender: 'bot',
        timestamp: new Date(),
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('fleetpro_chat_messages', JSON.stringify(messages));
  }, [messages]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Scroll immediately, and also with a tiny timeout to ensure DOM has updated
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileMsg: Message = {
        id: Date.now().toString(),
        text: `📎 Attached file: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fileMsg]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Simulate bot acknowledging the file
      setIsTyping(true);
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `আমি আপনার ফাইলটি (${file.name}) পেয়েছি। এটি নিয়ে আমি কীভাবে সাহায্য করতে পারি?`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      text: 'আসসালামু আলাইকুম! আমি মোহাম্মদ হাসান। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
      sender: 'bot',
      timestamp: new Date(),
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = inputText;
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset height
    setIsTyping(true);

    try {
      const targetUrl = getApiUrl('/api/gemini/chat');
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          systemInstruction: `আপনার নাম মোহাম্মদ হাসান (Mohammad Hassan)। আপনি FleetPro Manager অ্যাপের একজন দক্ষ এআই অ্যাসিস্ট্যান্ট। 
এই অ্যাপের ফিচারগুলো হলো:
- ড্যাশবোর্ড (Dashboard): অ্যাপের মূল মেনু, যেখান থেকে সব ফিচারে যাওয়া যায়।
- ট্রিপস (Trips): গাড়ির ট্রিপ বা ভাড়ার হিসাব রাখা, নতুন ট্রিপ যোগ করা এবং ট্রিপের স্ট্যাটাস (Running, Completed) দেখা।
- প্রোফাইলস (Profiles): ড্রাইভার, হেলপার এবং অন্যান্য স্টাফদের প্রোফাইল ম্যানেজ করা।
- মান্থলি ফাইলস (Monthly Files): মাসের হিসাব-নিকাশ, আয়-ব্যয় এবং গাড়ির মেইনটেনেন্স রিপোর্ট।
- ফিন্যান্স (Finance): আর্থিক লেনদেন, ইনকাম এবং খরচের বিস্তারিত হিসাব।
- অ্যাডমিন (Admin): অ্যাডমিন প্যানেল, ইউজার ম্যানেজমেন্ট এবং সিস্টেম সেটিংস।
- সেটিংস (Settings): অ্যাপের থিম (Light/Dark), ভাষা (বাংলা/English), এবং লেআউট পরিবর্তন।
- সাপোর্ট (Support): কাস্টমার সাপোর্ট এবং হেল্পলাইন।
- নামাজের সময় (Prayer Times): প্রতিদিনের নামাজের সময়সূচি।
ব্যবহারকারীদের এই ফিচারগুলো সম্পর্কে পূর্ণাঙ্গ তথ্য প্রদান করবেন এবং তাদের যেকোনো প্রশ্নের উত্তর দেবেন। সবসময় বিনয়ী এবং পেশাদার আচরণ করবেন। উত্তরগুলো ছোট এবং কাজের দেওয়ার চেষ্টা করবেন।`
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${responseText.substring(0, 100)}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e: any) {
        console.error("Failed to parse chat response as JSON. Raw text:", responseText);
        throw new Error(`Invalid server response format: ${responseText.substring(0, 100)}`);
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text || "দুঃখিত, আমি আপনার অনুরোধটি বুঝতে পারিনি।",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "দুঃখিত, এআই সার্ভারের সাথে সংযোগ স্থাপনে সমস্যা হচ্ছে। অনুগ্রহ করে পরে চেষ্টা করুন।",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'tween', duration: 0,
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <div 
      
      
      
      className="flex flex-col h-full w-full bg-transparent overflow-hidden"
    >
      {/* Chat Header */}
      <div 
        className={`border-b border-white/5 z-50 transition-colors safe-top shrink-0`}
        style={{ background: 'var(--header-bg)' }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('DASHBOARD')}
              className="p-2 transition-all active:scale-90"
              style={{ color: 'var(--header-text)' }}
            >
              <ChevronLeft size={24} />
            </button>
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl border-2 ${
                isDark ? 'shadow-blue-500/20 border-white/20' : 'shadow-black/10 border-white/40'
              }`} style={{ background: 'var(--header-bg)' }}>
                <Bot size={28} />
              </div>
              <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 animate-pulse`} style={{ borderColor: 'var(--header-bg)' }} />
            </div>
            <div>
              <h2 className="font-black text-base uppercase tracking-wider leading-none" style={{ color: 'var(--header-text)' }}>Mohammad Hassan</h2>
              <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mt-1">AI Assistant • Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1 relative">
            {showSearch ? (
              <div 
                 
                 
                className="flex items-center"
              >
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search messages..." 
                  className={`border rounded-lg px-3 py-1.5 text-sm outline-none w-32 sm:w-48 transition-colors ${
                    isDark 
                      ? 'bg-white/10 border-white/20 focus:border-blue-400' 
                      : 'bg-white/20 border-white/30 focus:border-white'
                  }`}
                  style={{ color: 'var(--header-text)' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => { setShowSearch(false); setSearchQuery(''); }} 
                  className="p-2 transition-colors opacity-80 hover:opacity-100"
                  style={{ color: 'var(--header-text)' }}
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowSearch(true)} 
                className="p-2.5 hover:bg-white/10 rounded-xl transition-colors opacity-80 hover:opacity-100"
                style={{ color: 'var(--header-text)' }}
              >
                <Search size={20} />
              </button>
            )}
            
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors opacity-80 hover:opacity-100"
              style={{ color: 'var(--header-text)' }}
            >
              <MoreVertical size={20} />
            </button>

            {/* Dropdown Menu */}
            <>
              {showMenu && (
                <div 
                  
                  
                  
                  className={`absolute top-full right-0 mt-2 w-48 border rounded-xl shadow-2xl overflow-hidden z-50 ${
                    isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'
                  }`}
                >
                  <button 
                    onClick={clearChat} 
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Clear Chat
                  </button>
                </div>
              )}
            </>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6 space-y-6">
          <>
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 w-full ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-lg`} style={{ background: msg.sender === 'user' ? 'var(--primary)' : 'var(--header-bg)' }}>
                    {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className={`p-4 rounded-xl shadow-xl backdrop-blur-sm flex-1 ${
                    msg.sender === 'user' 
                      ? 'text-white rounded-tr-none border border-white/20' 
                      : 'bg-card-bg text-text-main border border-white/5 rounded-tl-none'
                  }`} style={msg.sender === 'user' ? { background: 'var(--primary)' } : {}}>
                    <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-2 opacity-40 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[9px] font-bold uppercase ${
                        msg.sender === 'user' ? 'text-white' : 'text-text-main'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div
                
                
                className="flex justify-start"
              >
                <div className={`flex gap-3 items-center rounded-xl p-4 border ${
                  isDark ? 'bg-white/10 border-white/10' : 'bg-card-bg border-gray-200'
                }`}>
                  <div className="flex gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce`} style={{ background: 'var(--primary)', animationDelay: '0ms' }} />
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce`} style={{ background: 'var(--primary)', animationDelay: '150ms' }} />
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce`} style={{ background: 'var(--primary)', animationDelay: '300ms' }} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest`} style={{ color: 'var(--primary)' }}>Hassan is thinking...</span>
                </div>
              </div>
            )}
          </>
        </div>
      </div>

      {/* Input Area */}
      <div 
        className={`border-t border-white/5 safe-bottom transition-colors rounded-t-[12px] shrink-0 ${
          isDark 
            ? 'bg-gradient-to-r from-slate-900 via-[#1e1b4b] to-slate-900' 
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-3 pb-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
              <button 
                onClick={handleAttachmentClick}
                className="p-2 flex items-center justify-center rounded-lg transition-all active:scale-90 hover:bg-white/10 text-white/80"
              >
                <Paperclip size={20} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 flex items-center justify-center rounded-lg transition-all active:scale-90 hover:bg-white/10 text-white/80"
                >
                  <Smile size={20} />
                </button>
                
                <>
                  {showEmojiPicker && (
                    <div 
                      
                      
                      
                      className={`absolute bottom-full left-0 mb-2 border rounded-xl shadow-2xl p-2 flex gap-1 z-50 ${
                        isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'
                      }`}
                    >
                      {['😀', '😂', '❤️', '👍', '🙏', '🔥'].map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={() => handleEmojiClick(emoji)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-xl transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              </div>
            </div>
            <div className="w-full flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                placeholder="Send message"
                className={`flex-1 border border-transparent focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none rounded-[12px] text-[16px] px-4 py-3 resize-none overflow-y-auto min-h-[44px] max-h-[120px] transition-all ${
                  isDark 
                    ? 'bg-white/5 text-white placeholder:text-white/40' 
                    : 'bg-white/20 text-white placeholder:text-white/60'
                }`}
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className={`group w-11 h-11 mb-0.5 flex items-center justify-center rounded-[12px] active:scale-90 shrink-0 ${
                  inputText.trim() && !isTyping
                    ? 'bg-white text-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                <Send 
                  size={20} 
                  className={`transition-transform  ${
                    inputText.trim() && !isTyping 
                      ? 'translate-x-0.5 group-hover:translate-x-1 group-hover:-translate-y-0.5' 
                      : 'translate-x-0'
                  }`} 
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
