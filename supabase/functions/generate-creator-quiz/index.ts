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
        const { topic, difficulty, questionCount } = await req.json()

        console.log('✨ Creator mode request:', { topic, difficulty, questionCount })

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured')
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                temperature: 1.0,
                topP: 0.95,
                topK: 40,
            }
        })

        const difficultyMap = {
            easy: { level: '1-2', description: 'Easy - Fundamental concepts and basic recall' },
            medium: { level: '3', description: 'Medium - Application and analysis of concepts' },
            hard: { level: '4-5', description: 'Hard - Complex synthesis and critical thinking' }
        }

        const difficultyInfo = difficultyMap[difficulty] || difficultyMap.medium

        const randomSeed = Math.random().toString(36).substring(7)
        const timestamp = new Date().toISOString()

        const prompt = `You are creating a UNIQUE quiz about "${topic}". Session ID: ${randomSeed} at ${timestamp}

CRITICAL REQUIREMENTS:
1. Generate exactly ${questionCount} COMPLETELY DIFFERENT questions about ${topic}
2. DO NOT repeat questions or use generic examples
3. Cover DIVERSE aspects of ${topic}
4. Difficulty: ${difficultyInfo.description}
5. Each question must test a DIFFERENT concept or aspect
6. Make questions creative, engaging, and educational

TOPIC: ${topic}
DIFFICULTY: ${difficulty} (Level ${difficultyInfo.level}/5)
NUMBER OF QUESTIONS: ${questionCount}

For EACH question, create:
- question_text: A unique, specific question about ${topic} (no generic questions!)
- options: Array of 4 plausible options (no A/B/C/D labels)
- correct_answer: Index 0-3 of the correct option
- explanation: One clear sentence explaining why the answer is correct
- hint: A helpful clue that guides thinking without revealing the answer
- difficulty_level: Number from ${difficultyInfo.level}

Return ONLY a JSON array in this EXACT format (no markdown, no backticks):
[
  {
    "question_text": "Unique question here",
    "options": ["option1", "option2", "option3", "option4"],
    "correct_answer": 2,
    "explanation": "Clear one-sentence explanation",
    "hint": "Helpful hint without revealing answer",
    "difficulty_level": 3
  }
]

Generate ${questionCount} DIVERSE questions now:`

        console.log('📤 Sending prompt to Gemini...')

        const result = await model.generateContent(prompt)
        let responseText = result.response.text()

        console.log('📥 Received response, length:', responseText.length)

        responseText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()

        let questions
        try {
            questions = JSON.parse(responseText)
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError)
            throw new Error('Failed to parse Gemini response as JSON')
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('No questions generated')
        }

        questions = questions.map((q, idx) => {
            if (!q.question_text || !Array.isArray(q.options) || q.options.length !== 4) {
                throw new Error(`Question ${idx + 1} has invalid structure`)
            }

            return {
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation || 'No explanation provided',
                hint: q.hint || 'Think about the core concepts',
                difficulty_level: q.difficulty_level || 3,
                background_image_url: ''
            }
        })

        console.log(`✅ Validated ${questions.length} unique questions`)

        const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY')
        if (PEXELS_API_KEY) {
            const searchQuery = encodeURIComponent(topic)

            for (let i = 0; i < questions.length; i++) {
                try {
                    const pexelsResponse = await fetch(
                        `https://api.pexels.com/v1/search?query=${searchQuery}&per_page=1&page=${i + 1}`,
                        { headers: { Authorization: PEXELS_API_KEY } }
                    )

                    if (pexelsResponse.ok) {
                        const pexelsData = await pexelsResponse.json()
                        if (pexelsData.photos?.[0]) {
                            questions[i].background_image_url = pexelsData.photos[0].src.large
                        }
                    }
                } catch (imgError) {
                    console.error(`Image fetch failed for question ${i}:`, imgError.message)
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                questions,
                metadata: { topic, difficulty, questionCount: questions.length, timestamp }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Creator quiz error:', error)

        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
