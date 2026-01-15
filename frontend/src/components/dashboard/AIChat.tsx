'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User as UserIcon, Bot } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface AIChatProps {
    patientId: number | undefined;
    contextId?: string; // Insight ID for context
}

export default function AIChat({ patientId, contextId }: AIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([{
        role: 'assistant',
        content: 'I have analyzed your latest vitals. Do you have any questions about the results?'
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || !patientId) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMsg,
                    contextId: contextId
                })
            });

            if (!res.ok) throw new Error('Failed to get answer');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

        } catch (error) {
            console.error('Chat Error', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[400px] border rounded-lg bg-white shadow-sm">
            <div className="p-3 border-b bg-slate-50 rounded-t-lg">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    AI Medical Assistant
                </h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <Bot className="h-5 w-5 text-blue-600" />
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                }`}>
                                {msg.content}
                            </div>
                            {msg.role === 'user' && (
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                    <UserIcon className="h-5 w-5 text-slate-600" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Bot className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="bg-slate-100 rounded-lg p-3 rounded-bl-none">
                                <span className="animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-3 border-t bg-slate-50 rounded-b-lg flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your health..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={loading}
                    className="bg-white"
                />
                <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
