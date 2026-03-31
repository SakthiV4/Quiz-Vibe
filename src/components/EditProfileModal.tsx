import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, RefreshCw, User, Dice5 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    currentUser: {
        id: string
        username: string
        avatar_url: string
    }
    onUpdate: () => void
}



export function EditProfileModal({ isOpen, onClose, currentUser, onUpdate }: EditProfileModalProps) {
    const [username, setUsername] = useState(currentUser.username)
    const [avatarSeed, setAvatarSeed] = useState(currentUser.username)
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [hairColor, setHairColor] = useState('2c1b18')
    const [skinColor, setSkinColor] = useState('f8d25c')
    const [glasses, setGlasses] = useState(false)
    const [loading, setLoading] = useState(false)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setUsername(currentUser.username)
            setAvatarSeed(currentUser.username + Math.random().toString().substring(0, 5))
            setGlasses(false)
            setHairColor('2c1b18')
            setSkinColor('f8d25c')
        }
    }, [isOpen, currentUser])

    const getAvatarUrl = () => {
        // Note: we do NOT pass `top` — DiceBear determines hair from seed, avoiding 400 errors
        const glassesOption = glasses ? '&accessoriesProbability=100' : '&accessoriesProbability=0'
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&hairColor=${hairColor}&skinColor=${skinColor}${glassesOption}`
    }

    const currentPreviewUrl = getAvatarUrl()

    const handleSave = async () => {
        if (!username.trim()) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    username: username,
                    avatar_url: currentPreviewUrl
                })
                .eq('id', currentUser.id)

            if (error) throw error

            onUpdate()
            onClose()
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const randomize = () => {
        setAvatarSeed(Math.random().toString(36).substring(7))
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-bg-secondary border border-glass-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <User className="text-accent-primary" /> Edit Profile
                            </h2>
                            <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Avatar Customization */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative mb-4 group">
                                <div className="w-32 h-32 rounded-full bg-bg-tertiary border-4 border-accent-primary/20 p-1 overflow-hidden relative">
                                    <img
                                        src={currentPreviewUrl}
                                        alt="Avatar Preview"
                                        className="w-full h-full rounded-full object-cover bg-bg-primary"
                                    />
                                </div>
                                <button
                                    onClick={randomize}
                                    className="absolute bottom-0 right-0 p-2.5 bg-accent-primary text-bg-primary rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title="Randomize Look"
                                >
                                    <Dice5 size={20} />
                                </button>
                            </div>

                            {/* Customization Options */}
                            <div className="w-full space-y-4 mb-6">
                                {/* Skin Tone */}
                                <div>
                                    <label className="text-xs font-bold text-text-secondary mb-2 block uppercase tracking-wider">Skin Tone</label>
                                    <div className="flex gap-2 justify-center flex-wrap">
                                        {['f8d25c', 'fd9841', 'd08b5b', '614335', 'ae5d29', 'edb98a', 'ffdbb4'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setSkinColor(color)}
                                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${skinColor === color ? 'border-accent-primary scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: `#${color}` }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Hair Color */}
                                <div>
                                    <label className="text-xs font-bold text-text-secondary mb-2 block uppercase tracking-wider">Hair Color</label>
                                    <div className="flex gap-2 justify-center flex-wrap">
                                        {['2c1b18', '4a312c', '724133', 'd6b370', 'f59797', 'ecdcbf', 'b58143'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setHairColor(color)}
                                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${hairColor === color ? 'border-accent-primary scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: `#${color}` }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Glasses Toggle */}
                                <div className="flex justify-center mt-2">
                                    <button
                                        onClick={() => setGlasses(!glasses)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${glasses
                                            ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                                            : 'bg-transparent border-glass-border text-text-secondary hover:border-white/20'
                                            }`}
                                    >
                                        {glasses ? '👓 Glasses On' : '👓 Glasses Off'}
                                    </button>
                                </div>
                            </div>

                            {/* Gender Toggle */}
                            <div className="grid grid-cols-2 gap-2 bg-bg-primary/50 p-1 rounded-xl border border-glass-border w-full max-w-[200px] mb-2">
                                <button
                                    onClick={() => setGender('male')}
                                    className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${gender === 'male'
                                        ? 'bg-bg-tertiary text-white shadow-sm'
                                        : 'text-text-secondary hover:bg-white/5'
                                        }`}
                                >
                                    Male
                                </button>
                                <button
                                    onClick={() => setGender('female')}
                                    className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${gender === 'female'
                                        ? 'bg-bg-tertiary text-white shadow-sm'
                                        : 'text-text-secondary hover:bg-white/5'
                                        }`}
                                >
                                    Female
                                </button>
                            </div>
                        </div>

                        {/* Username Input */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2 ml-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-bg-primary border border-glass-border rounded-xl px-4 py-3 text-white focus:border-accent-primary outline-none transition-all"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl font-bold text-text-secondary hover:bg-bg-tertiary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || !username.trim()}
                                className="flex-1 bg-accent-primary text-bg-primary py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                Save Changes
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
