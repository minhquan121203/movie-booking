'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

interface ChatContent {
  text: string;
  type: string;
  data: any;
}

interface ChatMessage {
  role: string;
  content: ChatContent;
}

export default function ChatBot() {
  const router = useRouter();

  const pathname = usePathname();
  const role = useUserStore((state: any) => state.role);
  const _hasHydrated = useUserStore((state: any) => state._hasHydrated);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: {
        text: 'Chào bạn! Tớ là CineBot 🎬, nay bạn muốn xem phim thể loại gì hay tìm rạp nào gần đây?',
        type: 'text',
        data: []
      }
    }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (directMessage?: string) => {
    const msg = directMessage || input;
    if (!msg.trim() || isLoading) return;

    const userMsg = { role: 'user', content: { text: msg, type: 'text', data: [] } };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const endpoint = `${apiUrl}/chat`;

      console.log('📤 Sending to:', endpoint);
      console.log('📨 Payload:', { userMessage: msg, userName: 'bạn' });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: msg,
          userName: "bạn",
          sessionId: `session_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('❌ API Error:', data);
        throw new Error(data.botMessage?.text || 'API error');
      }

      const botResponse = data.botMessage;

      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);

      if (botResponse.type === 'action_booking' && botResponse.data?.movieId) {
        setTimeout(() => {
          setIsOpen(false);
          router.push(`/movies/${botResponse.data.movieId}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error('❌ Chat Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: { text: `Oops! ${error?.message || 'Mạng không ổn, thử lại tí nhé!'} 😅`, type: 'text', data: [] } }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-[var(--primary)]">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!_hasHydrated) return null;

  if (
    role === 'admin' ||
    role === 'super-admin' ||
    role === 'staff' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')
  ) {
    return null;
  }

  return (
    <>
      {/* Chatbot Styles */}
      <style jsx>{`
        @keyframes chatbot-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes chatbot-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatbot-bounce-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes chatbot-pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes chatbot-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes chatbot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .chatbot-slide-up {
          animation: chatbot-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .chatbot-msg-fade {
          animation: chatbot-fade-in 0.3s ease-out forwards;
        }
        .chatbot-dot-1 { animation: chatbot-bounce-dot 1.2s infinite; animation-delay: 0ms; }
        .chatbot-dot-2 { animation: chatbot-bounce-dot 1.2s infinite; animation-delay: 200ms; }
        .chatbot-dot-3 { animation: chatbot-bounce-dot 1.2s infinite; animation-delay: 400ms; }
        .chatbot-pulse-ring {
          animation: chatbot-pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .chatbot-card-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: chatbot-shimmer 2s infinite;
        }
        .chatbot-float {
          animation: chatbot-float 3s ease-in-out infinite;
        }
        .chatbot-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .chatbot-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatbot-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(108, 99, 255, 0.2);
          border-radius: 10px;
        }
        .chatbot-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(108, 99, 255, 0.4);
        }
        .chatbot-movie-scroll::-webkit-scrollbar {
          height: 3px;
        }
        .chatbot-movie-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatbot-movie-scroll::-webkit-scrollbar-thumb {
          background: rgba(108, 99, 255, 0.3);
          border-radius: 10px;
        }
      `}</style>

      <div className="fixed bottom-5 right-4 sm:bottom-7 sm:right-7 z-[9999]">
        {/* Floating Action Button */}
        <div className="relative">
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-[var(--primary)] chatbot-pulse-ring pointer-events-none" />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative group flex items-center gap-2 text-white px-5 py-3.5 rounded-full shadow-xl transition-all duration-300 hover:shadow-2xl active:scale-95"
            style={{
              background: isOpen
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
            }}
          >
            {isOpen ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span className="text-sm font-semibold hidden sm:inline">Đóng</span>
              </>
            ) : (
              <>
                <span className="text-lg chatbot-float">🎬</span>
                <span className="text-sm font-semibold">CineBot</span>
              </>
            )}
          </button>
        </div>

        {/* Chat Window */}
        {isOpen && (
          <div className="chatbot-slide-up absolute bottom-[65px] right-0 w-[92vw] max-w-[400px] h-[78vh] max-h-[620px] rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-white dark:bg-gray-900 border border-violet-500/15 dark:border-violet-400/20"
          >
            {/* Header */}
            <div
              className="relative px-4 py-3.5 text-white flex items-center gap-3 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #6c63ff 0%, #8b5cf6 50%, #a78bfa 100%)',
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-white/5" />

              <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner flex-shrink-0">
                <span className="text-xl">🤖</span>
              </div>
              <div className="relative flex-1 min-w-0">
                <h3 className="font-bold text-sm tracking-wide">CineBot AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                  <span className="text-[11px] text-white/80 font-medium">Đang hoạt động</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="relative w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4 chatbot-scrollbar">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`chatbot-msg-fade flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Bot Avatar */}
                  {m.role === 'bot' && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mb-1 shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)' }}
                    >
                      <span className="text-xs">🤖</span>
                    </div>
                  )}

                  {/* User Message */}
                  {m.role === 'user' && (
                    <div
                      className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                      }}
                    >
                      {m.content?.text}
                    </div>
                  )}

                  {/* Bot Message */}
                  {m.role === 'bot' && (
                    <div className="max-w-[85%] sm:max-w-[88%] flex flex-col overflow-hidden rounded-2xl rounded-tl-sm shadow-sm bg-white dark:bg-gray-800 border border-violet-500/10 dark:border-violet-400/20"
                    >
                      {/* Text Content */}
                      {m.content?.text && (
                        <div className="px-4 py-3 text-[13px] text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                          {formatText(m.content.text)}
                        </div>
                      )}

                      {/* Movie Cards Carousel */}
                      {m.content?.type === 'movie_list' && Array.isArray(m.content?.data) && m.content.data.length > 0 && (
                        <div className="px-3 pb-3">
                          {/* Section label */}
                          <div className="flex items-center gap-1.5 mb-2.5 px-1">
                            <span className="text-xs">🎬</span>
                            <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">
                              Phim gợi ý
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-[var(--primary)]/20 to-transparent ml-1" />
                          </div>

                          <div className="flex gap-2.5 overflow-x-auto pb-1 chatbot-movie-scroll snap-x snap-mandatory scroll-smooth">
                            {m.content.data.map((movie: any, idx: number) => {
                              const title = movie.title || 'Phim Đang Chiếu';
                              const genre = movie.genre || 'Đang hot';
                              const imageUrl = movie.poster || movie.posterUrl || 'https://placehold.co/150x200?text=No+Poster';
                              const movieId = movie._id || '';
                              const rating = movie.rating || movie.averageRating || null;

                              return (
                                <div
                                  key={idx}
                                  className="flex-none w-[135px] rounded-xl overflow-hidden snap-center flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gray-50 dark:bg-gray-700 border border-violet-500/12 dark:border-violet-400/20"
                                >
                                  {/* Poster */}
                                  <div className="relative w-full h-[175px] overflow-hidden">
                                    <img
                                      src={imageUrl}
                                      alt={title}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    {/* Rating badge */}
                                    {rating && (
                                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                                        <span className="text-yellow-400 text-[10px]">★</span>
                                        <span className="text-white text-[10px] font-bold">{rating}</span>
                                      </div>
                                    )}

                                    {/* Quick book overlay on hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <div
                                        className="px-3 py-1.5 rounded-full text-white text-[10px] font-bold shadow-lg backdrop-blur-sm"
                                        style={{ background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)' }}
                                      >
                                        Xem chi tiết
                                      </div>
                                    </div>
                                  </div>

                                  {/* Info */}
                                  <div className="p-2.5 flex flex-col flex-1">
                                    <h4 className="font-bold text-[11px] text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug mb-1" title={title}>
                                      {title}
                                    </h4>
                                    <div className="flex items-center gap-1 mb-2">
                                      <span className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] px-1.5 py-0.5 rounded-full font-medium truncate max-w-full">
                                        {genre}
                                      </span>
                                    </div>

                                    {/* Book Button */}
                                    <button
                                      onClick={() => {
                                        setIsOpen(false);
                                        router.push(`/movies/${movieId}`);
                                      }}
                                      className="mt-auto w-full flex items-center justify-center gap-1 py-2 rounded-lg text-white text-[11px] font-bold transition-all duration-300 hover:shadow-md active:scale-95"
                                      style={{
                                        background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                                      }}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="M2 10h20" />
                                        <path d="M7 15h4" />
                                      </svg>
                                      Đặt vé ngay
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Movie Detail Card (for single movie info) */}
                      {m.content?.type === 'movie_detail' && m.content?.data && (
                        <div className="px-3 pb-3">
                          <div
                            className="rounded-xl overflow-hidden"
                            style={{ border: '1px solid rgba(108, 99, 255, 0.12)' }}
                          >
                            <div className="flex gap-3 p-3">
                              <img
                                src={m.content.data.poster || m.content.data.posterUrl || 'https://placehold.co/100x140?text=Poster'}
                                alt={m.content.data.title}
                                className="w-20 h-28 object-cover rounded-lg shadow-sm flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0 flex flex-col">
                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-2">{m.content.data.title}</h4>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{m.content.data.genre}</p>
                                {m.content.data.duration && (
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">⏱ {m.content.data.duration} phút</p>
                                )}
                                <button
                                  onClick={() => {
                                    setIsOpen(false);
                                    router.push(`/movies/${m.content.data._id || m.content.data.movieId}`);
                                  }}
                                  className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-bold transition-all duration-300 hover:shadow-md active:scale-95"
                                  style={{
                                    background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M2 10h20" />
                                    <path d="M7 15h4" />
                                  </svg>
                                  Đặt vé ngay
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Food/Product Cards */}
                      {m.content?.type === 'food_list' && Array.isArray(m.content?.data) && m.content.data.length > 0 && (
                        <div className="px-3 pb-3">
                          <div className="flex items-center gap-1.5 mb-2.5 px-1">
                            <span className="text-xs">🍿</span>
                            <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">
                              Đồ ăn & Thức uống
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-[var(--primary)]/20 to-transparent ml-1" />
                          </div>

                          <div className="flex gap-2.5 overflow-x-auto pb-1 chatbot-movie-scroll snap-x snap-mandatory scroll-smooth">
                            {m.content.data.map((item: any, idx: number) => {
                              const name = item.name || 'Sản phẩm';
                              const imageUrl = item.imageUrl || item.image || 'https://placehold.co/150x150?text=No+Image';
                              const price = item.price || 0;
                              const category = item.category || '';

                              return (
                                <div
                                  key={idx}
                                  className="flex-none w-[130px] rounded-xl overflow-hidden snap-center flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gray-50 dark:bg-gray-700 border border-violet-500/12 dark:border-violet-400/20"
                                >
                                  {/* Image */}
                                  <div className="relative w-full h-[120px] overflow-hidden">
                                    <img
                                      src={imageUrl}
                                      alt={name}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {category && (
                                      <div className="absolute top-2 left-2 bg-orange-500/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                                        <span className="text-white text-[9px] font-bold">{category}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="p-2.5 flex flex-col flex-1">
                                    <h4 className="font-bold text-[11px] text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug mb-1" title={name}>
                                      {name}
                                    </h4>
                                    <div className="mt-auto flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-[var(--primary)]">
                                        {price.toLocaleString('vi-VN')}đ
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Booking confirmation */}
                      {m.content?.type === 'action_booking' && m.content?.data?.movieId && (
                        <div className="px-4 pb-3">
                          <div
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-violet-500/8 dark:bg-violet-400/10 border border-violet-500/15 dark:border-violet-400/25"
                          >
                            <span className="text-lg">🎫</span>
                            <span className="text-xs text-gray-600 dark:text-gray-300">Đang chuyển đến trang đặt vé...</span>
                            <div className="ml-auto flex gap-0.5">
                              <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full chatbot-dot-1" />
                              <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full chatbot-dot-2" />
                              <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full chatbot-dot-3" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="chatbot-msg-fade flex justify-start items-end gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mb-1 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)' }}
                  >
                    <span className="text-xs">🤖</span>
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center bg-white dark:bg-gray-800 border border-violet-500/10 dark:border-violet-400/20"
                  >
                    <span className="w-2 h-2 bg-[var(--primary)] rounded-full chatbot-dot-1" />
                    <span className="w-2 h-2 bg-[var(--primary)] rounded-full chatbot-dot-2" />
                    <span className="w-2 h-2 bg-[var(--primary)] rounded-full chatbot-dot-3" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-2 overflow-x-auto chatbot-movie-scroll">
                {['Phim đang chiếu?', 'Phim hay nhất?', 'Phim hành động?'].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="flex-none px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 hover:shadow-sm active:scale-95 whitespace-nowrap bg-violet-500/10 dark:bg-violet-400/15 text-violet-600 dark:text-violet-300 border border-violet-500/15 dark:border-violet-400/25"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div
              className="px-3 py-3 flex items-center gap-2 bg-white dark:bg-gray-900 border-t border-violet-500/10 dark:border-violet-400/20"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập tin nhắn..."
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-[1.5px] border-violet-500/12 dark:border-violet-400/25"
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(108, 99, 255, 0.4)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(108, 99, 255, 0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-xl text-white flex items-center justify-center transition-all duration-300 hover:shadow-lg active:scale-90 disabled:opacity-40 disabled:hover:shadow-none disabled:cursor-not-allowed"
                style={{
                  background: (isLoading || !input.trim())
                    ? '#c4c0e8'
                    : 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}