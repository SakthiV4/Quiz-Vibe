// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { topic, currentDifficulty, performanceHistory } = await req.json()

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

        // Calculate next difficulty based on performance (simple logic for now)
        // adaptive_logic: If last 3 correct -> +1 difficulty. If last 2 wrong -> -1 difficulty.
        let nextDifficulty = currentDifficulty
        const lastThree = performanceHistory.slice(-3)
        if (lastThree.every((p: any) => p.isCorrect)) {
            nextDifficulty = Math.min(5, currentDifficulty + 1)
        } else if (lastThree.length >= 2 && !lastThree[lastThree.length - 1].isCorrect && !lastThree[lastThree.length - 2].isCorrect) {
            nextDifficulty = Math.max(1, currentDifficulty - 1)
        }

        const prompt = `Generate ONE multiple-choice quiz question about "${topic}".
        
        DIFFICULTY LEVEL: ${nextDifficulty} (on a scale of 1-5)
        ${nextDifficulty === 5 ? 'Make it extremely challenging and obscure.' : ''}
        ${nextDifficulty === 1 ? 'Make it very basic and fundamental.' : ''}

        Return ONLY a JSON object:
        {
          "question_text": "...",
          "options": ["A", "B", "C", "D"],
          "correct_answer": 0,
          "explanation": "...",
          "hint": "...",
          "difficulty_level": ${nextDifficulty}
        }`

        const result = await model.generateContent(prompt)
        const text = result.response.text().replace(/```json\n?|```/g, '').trim()
        const questionData = JSON.parse(text)

        return new Response(
            JSON.stringify({ success: true, question: questionData, nextDifficulty }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
