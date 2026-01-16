async function translateWithGeminiFlash(text, targetLanguage) {
  const API_KEY = "AIzaSyBCJpPEOllfTB0wHuwfC4-DgTwBuk4ZK9o";
  const MODEL_ID = "gemini-flash-latest";
  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:streamGenerateContent?key=${API_KEY}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Translate the following text to ${targetLanguage}. Return ONLY the translated text. Do not add anything else, no explanations, no extra words:\n"${text}"`
          }
        ]
      }
    ],
    generationConfig: {
      thinkingConfig: { thinkingBudget: -1 },
      candidateCount: 1 // Generate only one candidate
    },
    tools: [{ googleSearch: {} }]
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (
      !data ||
      !Array.isArray(data) ||
      data.length === 0 ||
      !data[0].candidates ||
      !data[0].candidates[0].content
    ) {
      console.error("Unexpected Gemini response:", data);
      throw new Error("No valid candidates found in Gemini response");
    }
    
    const translated = data[0].candidates[0].content.parts[0].text;
    return translated.trim();
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    throw err;
  }
}




export default translateWithGeminiFlash;