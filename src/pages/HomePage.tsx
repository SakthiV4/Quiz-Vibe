import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, BookOpen, Sparkles, Home, Users, Clock, FileText, Download, ArrowRight, Trophy, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ChatAssistant } from '@/components/ChatAssistant'
import { useState, useEffect } from 'react'
import { EditProfileModal } from '@/components/EditProfileModal'

export default function HomePage() {
    const navigate = useNavigate()
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    useEffect(() => {
        fetchUser()
    }, [])

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()
            setCurrentUser(profile)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div className="min-h-screen bg-bg-primary p-6 md:p-10 font-display text-text-primary relative overflow-y-auto">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-bg-tertiary/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-[1600px] mx-auto relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-4xl font-bold mb-2 tracking-tight"
                        >
                            Master Your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-white">Knowledge.</span>
                        </motion.h1>
                        <p className="text-text-secondary text-sm max-w-xl">
                            Join the platform where AI meets education. Create, compete, and learn with advanced quiz generation.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 self-end">
                        {/* User Profile */}
                        {currentUser && (
                            <div className="flex items-center gap-3 bg-bg-secondary/50 border border-glass-border p-2 pr-4 rounded-full">
                                <div className="relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                                    <img
                                        src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full bg-bg-tertiary object-cover border-2 border-transparent group-hover:border-accent-primary transition-all"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-accent-primary rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Settings size={10} className="text-bg-primary" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold leading-none">{currentUser.username}</div>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="text-[10px] text-text-secondary hover:text-accent-primary transition-colors font-medium uppercase tracking-wider"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="h-8 w-[1px] bg-glass-border mx-2 hidden md:block" />

                        <Link to="/history" className="btn-secondary hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
                            <Clock size={18} /> History
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="btn-secondary group flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                        >
                            <LogOut size={18} className="group-hover:text-error transition-colors" />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-12 gap-6"
                >
                    {/* --- ROW 1: CORE MODES (Massive Cards) --- */}

                    {/* Bookworm Mode */}
                    <div className="md:col-span-6 lg:col-span-6">
                        <Link to="/bookworm" className="h-full block">
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ y: -5, scale: 1.01 }}
                                className="bg-gradient-to-br from-bg-tertiary/60 to-bg-secondary border border-glass-border p-6 rounded-2xl h-full min-h-[280px] relative overflow-hidden group flex flex-col justify-between hover:shadow-2xl hover:shadow-accent-primary/10 transition-all"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 transform group-hover:scale-125 origin-top-right">
                                    <BookOpen size={180} />
                                </div>

                                <div>
                                    <div className="w-14 h-14 bg-accent-primary/10 rounded-2xl flex items-center justify-center mb-4 text-accent-primary border border-accent-primary/20">
                                        <BookOpen size={28} />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">The Bookworm</h2>
                                    <p className="text-text-secondary text-base leading-relaxed max-w-md">
                                        Upload any PDF or image. Our AI extracts the knowledge and creates a perfect quiz instantly.
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-4">
                                    <span className="bg-accent-primary text-bg-primary font-bold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                        Start Learning <ArrowRight size={18} />
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                    {/* Creator Mode */}
                    <div className="md:col-span-6 lg:col-span-6">
                        <Link to="/creator" className="h-full block">
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ y: -5, scale: 1.01 }}
                                className="bg-gradient-to-br from-bg-tertiary/60 to-bg-secondary border border-glass-border p-6 rounded-2xl h-full min-h-[280px] relative overflow-hidden group flex flex-col justify-between hover:shadow-2xl hover:shadow-white/5 transition-all"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 transform group-hover:scale-125 origin-top-right">
                                    <Sparkles size={180} />
                                </div>

                                <div>
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-white border border-white/20">
                                        <Sparkles size={28} />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">The Creator</h2>
                                    <p className="text-text-secondary text-base leading-relaxed max-w-md">
                                        Test yourself on anything. From "Quantum Physics" to "Pop Culture", just type a topic.
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-4">
                                    <span className="bg-white text-bg-primary font-bold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                        Create Quiz <ArrowRight size={18} />
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                    {/* --- ROW 2: TOOLS & MULTIPLAYER (Bento Grid) --- */}

                    {/* Create Room */}
                    <div className="md:col-span-4 lg:col-span-4">
                        <Link to="/create-room" className="h-full block">
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                className="bg-bg-secondary/50 border border-glass-border p-5 rounded-xl h-full min-h-[180px] hover:bg-bg-secondary transition-all flex flex-col justify-between group relative overflow-hidden"
                            >
                                <div className="w-12 h-12 bg-bg-primary rounded-xl flex items-center justify-center text-text-secondary group-hover:text-white transition-colors">
                                    <Home size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Create Room</h3>
                                    <p className="text-text-secondary text-sm">Host a live lobby for friends</p>
                                </div>
                                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="text-white" size={18} />
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                    {/* Join Room */}
                    <div className="md:col-span-4 lg:col-span-4">
                        <Link to="/join-room" className="h-full block">
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                className="bg-bg-secondary/50 border border-glass-border p-5 rounded-xl h-full min-h-[180px] hover:bg-bg-secondary transition-all flex flex-col justify-between group relative overflow-hidden"
                            >
                                <div className="w-12 h-12 bg-bg-primary rounded-xl flex items-center justify-center text-text-secondary group-hover:text-white transition-colors">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Join Room</h3>
                                    <p className="text-text-secondary text-sm">Enter a code to join</p>
                                </div>
                                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="text-white" size={18} />
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                    {/* Assessment History (Practice Mode) */}
                    <div className="md:col-span-4 lg:col-span-4">
                        <Link to="/history" className="h-full block">
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                className="bg-accent-primary border border-transparent p-5 rounded-xl h-full min-h-[180px] flex flex-col justify-between group relative overflow-hidden"
                            >
                                <div className="absolute right-[-15px] top-[-15px] opacity-20">
                                    <FileText size={100} />
                                </div>

                                <div className="w-12 h-12 bg-bg-primary/10 rounded-xl flex items-center justify-center text-bg-primary">
                                    <Trophy size={24} />
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold mb-1 text-bg-primary">Your History</h3>
                                    <div className="flex items-center gap-2 text-bg-primary/80 font-medium text-sm">
                                        <Download size={16} />
                                        <span>Download & Practice</span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    </div>

                </motion.div>
            </div>

            {/* AI Assistant */}
            <ChatAssistant />

            {/* Edit Profile Modal */}
            {currentUser && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    currentUser={currentUser}
                    onUpdate={fetchUser}
                />
            )}
        </div>
    )
}


