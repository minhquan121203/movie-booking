'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 

export default function ChatBot() {
  const router = useRouter(); 
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      content: { 
        text: 'Chào fen! Tớ là CineBot, nay fen muốn xem phim thể loại gì hay tìm rạp nào gần đây?', 
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: { text: input, type: 'text', data: [] } };
    
    const currentHistory = [...messages]; 
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage: input,
          history: currentHistory, 
          userName: "Fen"          
        }),
      });
      const data = await res.json();
      const botResponse = data.botMessage;
      
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);

      if (botResponse.type === 'action_booking' && botResponse.data?.movieId) {
        setTimeout(() => {
          setIsOpen(false); 
          router.push(`/movies/${botResponse.data.movieId}`); 
        }, 1500); 
      }

    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'bot', 
          content: { text: 'Lỗi mạng rồi fen ơi, thử lại tí nhé!', type: 'text', data: [] } 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      {/* Nút bấm tròn */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? '❌' : '💬 AI Tư vấn'}
      </button>

      {/* Khung Chat */}
      {isOpen && (
        <div className="absolute bottom-[75px] right-0 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-blue-600 p-4 text-white font-bold flex justify-between items-center shadow-md z-10">
            <span className="flex items-center gap-2">
              <span className="text-2xl">🤖</span> 
              Trợ lý CineBooking
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                
                {/* Avatar Bot */}
                {m.role === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 mb-1">
                    🤖
                  </div>
                )}

                {/* Nội dung tin nhắn của User */}
                {m.role === 'user' && (
                  <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-blue-600 text-white rounded-br-none shadow-sm">
                    {m.content?.text}
                  </div>
                )}

                {/* Nội dung tin nhắn của Bot */}
                {m.role === 'bot' && (
                  <div className="max-w-[85%] bg-white border rounded-2xl rounded-tl-none shadow-sm overflow-hidden flex flex-col">
                    
                    {/* Phần chữ của Bot */}
                    {m.content?.text && (
                      <div className="p-3 text-sm text-gray-800 leading-relaxed">
                        {m.content.text}
                      </div>
                    )}

                    {/* Phần danh sách Phim */}
                    {m.content?.type === 'movie_list' && m.content?.data?.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto px-3 pb-3 pt-1 snap-x scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {m.content.data.map((movie: any, idx: number) => (
                          <div key={idx} className="flex-none w-[140px] border rounded-xl overflow-hidden snap-center flex flex-col bg-gray-50 shadow-sm">
                            <img 
                              src={movie.poster || 'https://placehold.co/150x200?text=No+Poster'} 
                              alt={movie.title} 
                              className="w-full h-[200px] object-cover"
                            />
                            <div className="p-2 flex flex-col flex-1 justify-between">
                              <div>
                                <h4 className="font-bold text-xs line-clamp-2" title={movie.title}>{movie.title}</h4>
                                <p className="text-[10px] text-gray-500 truncate mt-1">{movie.genre}</p>
                              </div>
                              <a 
                                href={movie.details_url || '#'} 
                                target="_blank"
                                className="mt-2 text-center bg-blue-500 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                              >
                                Đặt vé
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Hiệu ứng đang gõ */}
            {isLoading && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mb-1">🤖</div>
                <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center h-10">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
          </div>

          {/* Khung nhập liệu */}
          <div className="p-3 border-t bg-white flex items-center gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi tớ về phim, rạp..."
              className="flex-[4] min-w-0 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            <button 
              onClick={handleSend} 
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-full text-sm font-bold whitespace-nowrap px-4 hover:bg-blue-700 transition-colors shadow-sm"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}