import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Paperclip, Loader2, Bot, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css' // Import KaTeX styles

interface Message {
    role: 'user' | 'model'
    content: string
}

export function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Hi! I'm your AI Tutor. Ask me anything or upload a PDF to analyze!" }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
        }
    }

    const sendMessage = async () => {
        if ((!input.trim() && !file) || isLoading) return

        const userMsg = input
        const currentFile = file

        // Optimistic UI Update
        const newMessages = [...messages, { role: 'user', content: userMsg || (currentFile ? `Uploaded: ${currentFile.name}` : '') }] as Message[]
        setMessages(newMessages)
        setInput('')
        setFile(null)
        setIsLoading(true)

        try {
            let fileUrl = ''

            // 1. Upload File if present
            if (currentFile) {
                const fileExt = currentFile.name.split('.').pop()
                const fileName = `chat/${Math.random().toString(36).substring(7)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, currentFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName)

                fileUrl = publicUrl
            }

            // 2. Call Edge Function using raw fetch for debugging
            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    messages: newMessages,
                    fileUrl: fileUrl || undefined
                })
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 546) {
                    throw new Error("Server overloaded (File too large). Please redeploy the backend or try a smaller file.")
                }
                throw new Error(`Create Chat Failed: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`)
            }

            if (!data?.reply) throw new Error('No response from AI')

            // Check for diagnostic error from backend
            if (data.error) {
                setMessages(prev => [...prev, { role: 'model', content: `${data.reply}` }])
            } else {
                setMessages(prev => [...prev, { role: 'model', content: data.reply }])
            }

        } catch (error: any) {
            console.error('Chat Error:', error)
            const errorMsg = error.message || "Unknown error occurred"
            setMessages(prev => [...prev, { role: 'model', content: `⚠️ Error: ${errorMsg}` }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 font-display">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[95vw] md:w-[600px] h-[750px] max-h-[90vh] bg-bg-secondary/95 backdrop-blur-xl border border-glass-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-bg-tertiary/50 border-b border-glass-border flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-bg-primary shadow-lg shadow-accent-primary/20">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Nova AI</h3>
                                    <p className="text-xs text-text-secondary">Your Personal Tutor</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl text-base leading-relaxed
                                            ${msg.role === 'user'
                                                ? 'bg-accent-primary text-bg-primary rounded-tr-none'
                                                : 'bg-bg-tertiary border border-glass-border text-text-primary rounded-tl-none prose prose-invert prose-sm max-w-none'}`}
                                    >
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-primary underline">{children}</a>,
                                                    code: ({ children }) => <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono text-accent-primary">{children}</code>
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-bg-tertiary px-4 py-2 rounded-2xl rounded-tl-none flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin text-accent-primary" />
                                        <span className="text-xs text-text-secondary">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-bg-tertiary/30 border-t border-glass-border">
                            {/* File Preview */}
                            {file && (
                                <div className="mb-2 flex items-center justify-between bg-bg-primary/50 p-2 rounded-lg border border-glass-border">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText size={16} className="text-accent-primary flex-shrink-0" />
                                        <span className="text-xs text-white truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                    <button onClick={() => setFile(null)} className="text-text-secondary hover:text-error">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <label className="p-2 text-text-secondary hover:text-accent-primary cursor-pointer transition-colors rounded-full hover:bg-white/5">
                                    <Paperclip size={20} />
                                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
                                </label>

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Ask any doubt..."
                                    className="flex-1 bg-transparent text-white placeholder-text-tertiary focus:outline-none text-sm"
                                    disabled={isLoading}
                                />

                                <button
                                    onClick={sendMessage}
                                    disabled={(!input.trim() && !file) || isLoading}
                                    className="p-2 bg-accent-primary text-bg-primary rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="w-24 h-24 bg-gradient-to-br from-accent-primary to-emerald-400 rounded-full flex items-center justify-center text-bg-primary shadow-[0_8px_32px_rgba(110,231,183,0.3)] hover:shadow-[0_12px_40px_rgba(110,231,183,0.4)] transition-all"
                >
                    <MessageCircle size={48} strokeWidth={2.5} />
                </motion.button>
            )}
        </div>
    )
}
