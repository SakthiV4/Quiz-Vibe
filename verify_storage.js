
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cezzkjspnnacwlkyzkio.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlenpranNwbm5hY3dsa3l6a2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjQ1MDksImV4cCI6MjA4NTQ0MDUwOX0.Ax1JQNrlyW31-7LSDQMX_4zj-phuNjCiyZquOu7Psww'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log("🧪 Testing Storage Permissions...")

async function testStorage() {
    // 1. Upload a test file
    const fileName = `test_${Date.now()}.txt`
    const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, 'Hello World', { contentType: 'text/plain' })

    if (error) {
        console.error("❌ UPLOAD FAILED:", error.message)
        console.log("⚠️  Please go to Supabase Dashboard -> Storage -> Policies and allow 'INSERT' for Anon/Public.")
        return
    }
    console.log("✅ Upload successful!")

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

    console.log("🔗 Public URL:", publicUrl)

    // 3. Try to download it (Mimic what the Edge Function does)
    try {
        const response = await fetch(publicUrl)
        if (response.ok) {
            console.log("✅ DOWNLOAD SUCCESS! The bucket is PUBLIC.")
        } else {
            console.error(`❌ DOWNLOAD FAILED (${response.status})`)
            console.log("⚠️  Legacy Issue: The bucket exists but is NOT set to 'Public'.")
            console.log("   👉 Go to Supabase Storage -> documents -> Edit Bucket -> Toggle 'Public Bucket' ON.")
        }
    } catch (e) {
        console.error("❌ Download Error:", e)
    }
}

testStorage()
