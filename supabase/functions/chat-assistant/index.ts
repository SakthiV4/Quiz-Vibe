// @ts-nocheck

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// List of models to try in order of preference
const MODELS_TO_TRY = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
]

async function uploadToGoogle(url: string, apiKey: string, mimeType: string) {
    console.log("📤 Transferring file to Google...")

    // 1. Fetch from Supabase (Stream)
    const supRes = await fetch(url)
    if (!supRes.ok) throw new Error(`Failed to fetch file: ${supRes.statusText}`)
    const size = supRes.headers.get('content-length')
    const bodyStream = supRes.body

    // 2. Start Resumable Upload
    const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': size || '0',
            'X-Goog-Upload-Header-Content-Type': mimeType,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file: { display_name: 'uploaded_doc' } })
    })

    const uploadUrl = startRes.headers.get('x-goog-upload-url')
    if (!uploadUrl) throw new Error("Failed to initiate upload session")

    // 3. Upload Bytes (Pipe Stream)
    const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Content-Length': size || '0',
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize'
        },
        body: bodyStream // Pipe directly!
    })

    if (!uploadRes.ok) throw new Error(`Google Upload Failed: ${await uploadRes.text()}`)

    const { file } = await uploadRes.json()
    console.log(`✅ File Uploaded: ${file.uri}`)

    // 4. Wait for ACTIVE state (Processing loop)
    await waitForFileActive(file.name, apiKey)

    return file.uri
}

async function waitForFileActive(name: string, apiKey: string) {
    console.log("⏳ Waiting for file processing...")
    for (let i = 0; i < 30; i++) { // Wait up to 60 seconds
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}?key=${apiKey}`)
        if (!res.ok) throw new Error("Failed to check file state")

        const data = await res.json()
        const state = data.state
        console.log(`... State: ${state}`)

        if (state === 'ACTIVE') return
        if (state === 'FAILED') throw new Error("File processing failed on Google servers.")

        // Wait 2 seconds
        await new Promise(r => setTimeout(r, 2000))
    }
    throw new Error("File processing timed out (still processing after 60s)")
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        console.log("🚀 Request Start")
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY")

        // Parse Request
        let body
        try {
            const text = await req.text()
            if (!text) throw new Error("Empty Body")
            body = JSON.parse(text)
        } catch (e) { throw new Error(`JSON Error: ${e.message}`) }

        const { messages, fileUrl } = body

        // Prepare File (If any)
        let fileUri = null
        if (fileUrl) {
            try {
                // Determine MIME from URL or default to PDF, simplistic check
                const lower = fileUrl.toLowerCase()
                const mimeType = lower.endsWith('.png') ? 'image/png' :
                    lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg' : 'application/pdf'

                fileUri = await uploadToGoogle(fileUrl, GEMINI_API_KEY, mimeType)
            } catch (e: any) {
                console.error("Upload Logic Error:", e)
                return new Response(
                    JSON.stringify({ success: true, reply: `⚠️ Error analyzing file: ${e.message}. Please try again.` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }
        }

        // Prepare Prompt
        const history = messages?.map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`).join('\n') || ''
        const promptText = `You are a friendly educational AI assistant (Nova AI).\nConversation:\n${history}\n\nAI:`

        // --- GENERATION LOOP ---
        let errorLog = ""

        for (const model of MODELS_TO_TRY) {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

            // Construct Payload
            const textPart = { text: promptText }
            let parts = [textPart]

            if (fileUri) {
                const lower = fileUrl ? fileUrl.toLowerCase() : ''
                const mimeType = lower.endsWith('.png') ? 'image/png' :
                    lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg' : 'application/pdf'

                parts = [
                    { file_data: { file_uri: fileUri, mime_type: mimeType } },
                    textPart
                ]
            }

            const payload = {
                contents: [{ parts: parts }]
            }

            try {
                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (res.ok) {
                    const data = await res.json()
                    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply."
                    return new Response(
                        JSON.stringify({ success: true, reply: reply, debug: { modelUsed: model } }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                    )
                }

                if (res.status === 429) {
                    console.warn(`Model ${model} hit rate limit (429). Trying next...`)
                    errorLog += `[${model}: 429 Rate Limit] `
                } else {
                    const txt = await res.text()
                    const thisError = `[${model} failed (${res.status}): ${txt}]`
                    console.error(thisError)
                    errorLog += thisError + " "
                }

            } catch (e: any) {
                errorLog += `[${model} exception: ${e.message}] `
            }
        }

        // --- DIAGNOSTIC: LIST AVAILABLE MODELS ---
        console.log("⚠️ All known models failed. Listing available...")
        let availableModels = []
        let listError = ""
        try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`)
            if (listRes.ok) {
                const listData = await listRes.json()
                availableModels = listData.models
                    ?.filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                    ?.map(m => m.name.replace('models/', ''))
            } else {
                listError = await listRes.text()
            }
        } catch (e) { listError = e.message }

        const availableStr = availableModels.length > 0 ? availableModels.join(', ') : `Could not list models. Error: ${listError}`

        return new Response(
            JSON.stringify({
                success: false,
                reply: `⚠️ I'm busy right now. Please try again in 1 minute. Debug info: ${errorLog} | Available Models for your Key: [${availableStr}]`,
                error: errorLog
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ success: false, reply: `⚠️ Server Error: ${error.message}`, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
