// @ts-nocheck
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("🚀 Request received!")

        // 2. Parse JSON Body (Frontend sends { fileUrl, questionCount })
        // We use req.json() because the client sends application/json
        let body;
        try {
            body = await req.json()
        } catch (e) {
            console.error("Failed to parse JSON body:", e)
            throw new Error("Invalid JSON body. Expected { fileUrl, questionCount }")
        }

        const { fileUrl, questionCount = 5, difficulty = 'medium', roomId = 'unknown' } = body

        console.log(`Processing file: ${fileUrl} for room ${roomId}, Q: ${questionCount}`)

        if (!fileUrl) {
            throw new Error('Missing fileUrl in request body')
        }


        // 3. Upload file to Google File API (handles large files better than inline base64)
        console.log("📤 Uploading file to Google File API...")

        const fileResponse = await fetch(fileUrl)
        if (!fileResponse.ok) {
            throw new Error(`Failed to download file: ${fileResponse.statusText}`)
        }

        const mimeType = fileResponse.headers.get('content-type') || 'application/pdf'
        const size = fileResponse.headers.get('content-length')
        const bodyStream = fileResponse.body

        // 4. Initialize Gemini
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is missing in Supabase Secrets')
        }

        // Start resumable upload to Google
        const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Protocol': 'resumable',
                'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': size || '0',
                'X-Goog-Upload-Header-Content-Type': mimeType,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file: { display_name: 'quiz_document' } })
        })

        const uploadUrl = startRes.headers.get('x-goog-upload-url')
        if (!uploadUrl) throw new Error("Failed to initiate upload session")

        // Upload file bytes
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Content-Length': size || '0',
                'X-Goog-Upload-Offset': '0',
                'X-Goog-Upload-Command': 'upload, finalize'
            },
            body: bodyStream
        })

        const uploadData = await uploadRes.json()
        const fileUri = uploadData.file.uri
        console.log(`✅ File uploaded to Google: ${fileUri}`)

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,  // Lower = faster, more focused
                maxOutputTokens: 8192,  // Limit output size
                responseMimeType: "application/json"
            }
        })

        // 5. Generate Content using uploaded file
        const prompt = `Generate ${questionCount} multiple-choice questions from the document.
        Difficulty Level: ${difficulty.toUpperCase()}
        
Return ONLY a valid JSON array in this EXACT format (no markdown, no code blocks):
[
  {
    "question_text": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of the answer",
    "hint": "Helpful hint for the question",
    "difficulty_level": 3
  }
]

CRITICAL: Return ONLY the JSON array. No extra text before or after.`

        const result = await model.generateContent([
            {
                fileData: {
                    fileUri: fileUri,
                    mimeType: mimeType
                }
            },
            { text: prompt }
        ])

        const responseText = await result.response.text()
        console.log("🤖 AI Response generated:", responseText.substring(0, 200))

        // 6. Clean and Parse JSON - Enhanced cleaning
        let cleanedText = responseText
            .replace(/```json\n?/g, '')  // Remove ```json
            .replace(/```\n?/g, '')      // Remove ```
            .replace(/^[^[{]*/, '')      // Remove everything before first [ or {
            .replace(/[^}\]]*$/, '')     // Remove everything after last } or ]
            .trim()

        console.log("🧹 Cleaned JSON:", cleanedText.substring(0, 200))

        let questions
        try {
            questions = JSON.parse(cleanedText)
        } catch (e) {
            console.error('❌ JSON Parse Error. Raw response:', responseText)
            console.error('❌ Cleaned text:', cleanedText)
            throw new Error(`Failed to parse AI response: ${e.message}`)
        }

        if (!Array.isArray(questions)) {
            // Sometimes Gemini returns { questions: [...] }
            if (questions.questions && Array.isArray(questions.questions)) {
                questions = questions.questions
            } else {
                throw new Error('AI response is not an array')
            }
        }

        // 7. Fetch Background Images from Pexels
        // Since we don't have a specific topic from the file, we can either:
        // A) Ask Gemini to extract a topic (requires prompt change)
        // B) Use keywords from the first question
        // Let's try to infer a search term from the first question or default to 'abstract education'

        const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY')
        if (PEXELS_API_KEY && questions.length > 0) {
            try {
                // Simple heuristic: use the first 3-4 words of the first question as a search query
                // Or better, let's just search for "education abstract" to be safe and pretty
                // Ideally, we'd update the prompt to return a topic, but for now let's try to get *something*

                // Let's try to extract a noun from the first question? Too complex.
                // Let's us a generic but relevant query.
                const searchQuery = 'education abstract dark'

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
                        console.error(`Bookworm Image fetch failed for question ${i}:`, imgError.message)
                    }
                }
            } catch (e) {
                console.error("Pexels fetch error", e)
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                questions: questions
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('❌ Server Error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Unknown error',
                details: error.stack
            }),
            {
                // Return 200 so the frontend can read the error message JSON
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    }
})
