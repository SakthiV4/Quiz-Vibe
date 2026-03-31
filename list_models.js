
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
    const envPath = path.resolve(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const match = envConfig.match(/VITE_GEMINI_API_KEY=(.*)/);

    if (match && match[1]) {
        const apiKey = match[1].trim();
        console.log(`Checking models for API Key: ${apiKey.substring(0, 10)}...`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else if (data.models) {
            console.log("✅ Available Models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("No models found?", data);
        }

    } else {
        console.error("Could not find VITE_GEMINI_API_KEY in .env");
    }
} catch (e) {
    console.error("Error reading .env:", e);
}
