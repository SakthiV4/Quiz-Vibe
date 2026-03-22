import { supabase } from '@/lib/supabase'

export async function generateUniqueRoomCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
        // Generate 4-character code
        let code = ''
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        // Check if code already exists
        const { data, error } = await supabase
            .from('rooms')
            .select('id')
            .eq('room_code', code)
            .maybeSingle()

        if (error) {
            console.error('Error checking room code:', error)
            attempts++
            continue
        }

        // If code doesn't exist, return it
        if (!data) {
            console.log('✅ Generated unique room code:', code)
            return code
        }

        // Code exists, try again
        attempts++
        console.log(`⚠️ Room code ${code} already exists, attempt ${attempts}/${maxAttempts}`)
    }

    throw new Error('Failed to generate unique room code after ' + maxAttempts + ' attempts')
}

export async function createRoom(
    hostId: string,
    mode: 'bookworm' | 'creator',
    config: {
        questionCount: number
        difficulty?: string
        topic?: string
    }
): Promise<{ roomCode: string; roomId: string }> {
    try {
        console.log('🏠 Creating room:', { hostId, mode, config })

        // Generate unique code
        const roomCode = await generateUniqueRoomCode()

        // Insert room into database
        const { data: room, error } = await supabase
            .from('rooms')
            .insert({
                room_code: roomCode,
                host_id: hostId,
                mode: mode,
                question_count: config.questionCount,
                difficulty: config.difficulty || 'medium',
                topic: config.topic || '',
                status: 'waiting'
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Room creation error:', error)
            throw new Error(`Failed to create room: ${error.message}`)
        }

        if (!room) {
            throw new Error('Room created but no data returned')
        }

        console.log('✅ Room created successfully:', { roomCode, roomId: room.id })

        // Add host as a player
        const { error: joinError } = await supabase
            .from('player_sessions')
            .insert({
                room_id: room.id,
                user_id: hostId,
                score: 0,
                current_question_index: 0
            })

        if (joinError) throw joinError

        return {
            roomCode,
            roomId: room.id
        }

    } catch (error) {
        console.error('❌ createRoom error:', error)
        throw error
    }
}

export async function joinRoom(roomCode: string, userId: string): Promise<string> {
    // Check if room exists
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('room_code', roomCode)
        .single()

    if (roomError || !room) {
        throw new Error('Room not found')
    }

    if (room.status !== 'waiting') {
        throw new Error('Room has already started or finished')
    }

    // Check if already in room
    const { data: session } = await supabase
        .from('player_sessions')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .maybeSingle()

    if (!session) {
        // Join room
        const { error: joinError } = await supabase
            .from('player_sessions')
            .insert({
                room_id: room.id,
                user_id: userId,
                score: 0,
                current_question_index: 0
            })

        if (joinError) throw joinError
    }

    return room.id
}

export async function startRoom(roomId: string) {
    const { error } = await supabase
        .from('rooms')
        .update({
            status: 'active',
            started_at: new Date().toISOString()
        })
        .eq('id', roomId)

    if (error) throw error
}
