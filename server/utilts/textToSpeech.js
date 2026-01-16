import fs from "fs";
import path from "path";
import ElevenLabs from "elevenlabs-node";

export async function textToSpeech(text, gender, language) {


    console.log(text,language);
    

    const availableVoices = {
             english: "PIGsltMj3gFMR34aFDI3",
        hindi: "9cI5mhBtM4WtQ9Fo6jWQ",
        urdu: "9cI5mhBtM4WtQ9Fo6jWQ",
        arabic: "nH7M8bGCLQbKoS0wBZj7",
        french: "PIGsltMj3gFMR34aFDI3",
        german: "PIGsltMj3gFMR34aFDI3",
        spanish: "PIGsltMj3gFMR34aFDI3",
        italian: "PIGsltMj3gFMR34aFDI3",
        portuguese: "PIGsltMj3gFMR34aFDI3",
        dutch: "PIGsltMj3gFMR34aFDI3",
        swedish: "PIGsltMj3gFMR34aFDI3",
        norwegian: "PIGsltMj3gFMR34aFDI3",
        danish: "PIGsltMj3gFMR34aFDI3",
        polish: "PIGsltMj3gFMR34aFDI3",
        czech: "PIGsltMj3gFMR34aFDI3",
        slovak: "PIGsltMj3gFMR34aFDI3",
        romanian: "PIGsltMj3gFMR34aFDI3",
        hungarian: "PIGsltMj3gFMR34aFDI3",
        turkish: "PIGsltMj3gFMR34aFDI3",
        irish: "PIGsltMj3gFMR34aFDI3",
        swahili: "PIGsltMj3gFMR34aFDI3",
        zulu: "PIGsltMj3gFMR34aFDI3",
        xhosa: "PIGsltMj3gFMR34aFDI3",
        yoruba: "PIGsltMj3gFMR34aFDI3",
        hausa: "PIGsltMj3gFMR34aFDI3",
        vietnamese: "PIGsltMj3gFMR34aFDI3",
        filipino: "PIGsltMj3gFMR34aFDI3",
        tagalog: "PIGsltMj3gFMR34aFDI3",
        malay: "PIGsltMj3gFMR34aFDI3",
        indonesian: "PIGsltMj3gFMR34aFDI3",
        hawaiian: "PIGsltMj3gFMR34aFDI3",
        samoan: "PIGsltMj3gFMR34aFDI3",
        maori: "PIGsltMj3gFMR34aFDI3",
        fijian: "PIGsltMj3gFMR34aFDI3"
    };

    const voiceId = availableVoices[language.toLowerCase()];
    if (!voiceId) throw new Error(`Voice for language "${language}" not found.`);

    const client = new ElevenLabs({
        apiKey: "sk_af07a9575771ec85363915c559e51c5d57e0ef1739876a3b"
    });
    
    const uploadDir = path.join(process.cwd(),  "public", "uploads/translates");
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const fileName = `tts_${Date.now()}.webm`;
    const filePath = path.join(uploadDir, fileName);
    
   const result  =  await client.textToSpeech({
        voice: voiceId,
        textInput: text,
        model: "eleven_multilingual_v2",
        format: "webm",
        fileName: filePath
    });

    console.log(result);
    
    // Return the public URL path
    return `/uploads/${fileName}`;
}
export default textToSpeech;