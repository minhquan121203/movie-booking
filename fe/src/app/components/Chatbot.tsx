'use client';
import { useState, useRef, useEffect } from 'react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Chào fen! Tớ là CineBot, fen cần tớ tư vấn phim hay rạp nào không?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: input }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.botMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Lỗi rồi fen ơi, thử lại tí nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Nút bấm tròn */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110"
      >
        {isOpen ? '❌' : '💬 AI Tư vấn'}
      </button>

      {/* Khung Chat */}
      {isOpen && (
        <div className="absolute bottom-24 right-0 w-[350px] ...">
          <div className="bg-blue-600 p-4 text-white font-bold flex justify-between">
            <span>🤖 Trợ lý CineBooking</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white border rounded-tl-none text-gray-800 shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-400 italic">CineBot đang gõ...</div>}
          </div>

          <div className="p-4 border-t bg-white flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi tớ về phim, rạp, giờ chiếu..."
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-full px-4 text-sm font-bold">
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}