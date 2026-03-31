
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cezzkjspnnacwlkyzkio.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlenpranNwbm5hY3dsa3l6a2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjQ1MDksImV4cCI6MjA4NTQ0MDUwOX0.Ax1JQNrlyW31-7LSDQMX_4zj-phuNjCiyZquOu7Psww'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log("Checking 'documents' bucket...")

async function checkBucket() {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
        console.error("❌ Failed to list buckets:", error)
        return
    }

    const docBucket = data.find(b => b.name === 'documents')
    if (docBucket) {
        console.log("✅ Bucket 'documents' EXISTS.")
        console.log("   Public:", docBucket.public)
    } else {
        console.error("❌ Bucket 'documents' DOES NOT EXIST! Creating it...")
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
            public: true
        })
        if (createError) {
            console.error("❌ Failed to create bucket:", createError)
        } else {
            console.log("✅ Bucket 'documents' CREATED successfully.")
        }
    }
}

checkBucket()
