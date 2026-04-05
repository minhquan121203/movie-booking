'use client';
import { useState } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Chào bạn! Bạn cần gì mình tư vấn cho?' }]);

  const handleSend = async () => {
    if (!input) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage: input }),
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'bot', text: data.botMessage }]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 text-white p-4 rounded-full shadow-lg">
        💬
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white border rounded-lg shadow-xl flex flex-col p-3">
          <div className="font-bold border-b pb-2 mb-2">Trợ lý CineBooking</div>
          <div className="flex-1 overflow-y-auto space-y-2 mb-2">
            {messages.map((m, i) => (
              <div key={i} className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="border flex-1 p-1" placeholder="Hỏi tớ đi..." />
            <button onClick={handleSend} className="bg-blue-500 text-white px-3 rounded">Gửi</button>
          </div>
        </div>
      )}
    </div>
  );
}