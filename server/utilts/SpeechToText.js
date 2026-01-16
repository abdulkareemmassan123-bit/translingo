import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: "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",
});

async function SpeechToText(filePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`Audio file not found: ${filePath}`);
        }

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "gpt-4o-transcribe",
        })

        return transcription.text;
    } catch (error) {
        console.error("Speech to Text error:", error);
        throw error;
    }
}

export default SpeechToText;