
const SUPABASE_URL = 'https://cezzkjspnnacwlkyzkio.supabase.co/functions/v1/process-bookworm'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlenpranNwbm5hY3dsa3l6a2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjQ1MDksImV4cCI6MjA4NTQ0MDUwOX0.Ax1JQNrlyW31-7LSDQMX_4zj-phuNjCiyZquOu7Psww'

console.log("Testing Live Edge Function (JSON Protocol)...")

async function testFunction() {
    try {
        // Send a dummy file URL (it will fail to download, but the function should Run and return 200 OK with an error message)
        const response = await fetch(SUPABASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileUrl: "https://invalid-url.com/test.pdf",
                questionCount: 5,
                roomId: "debug-room"
            })
        })

        console.log(`Status: ${response.status} ${response.statusText}`)
        const text = await response.text()
        console.log("Response:", text)

        if (response.status === 200) {
            console.log("✅ SUCCESS! Backend accepted JSON payload.")
            if (text.includes("Failed to download")) {
                console.log("   (Expected error: Download failed, but logic ran)")
            }
        } else {
            console.error("❌ FAILED: Backend returned non-200 status.")
        }

    } catch (err) {
        console.error("❌ Network Error:", err)
    }
}

testFunction()
