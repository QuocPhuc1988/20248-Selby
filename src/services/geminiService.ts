import { GoogleGenAI } from "@google/genai";

export async function generateVictoryImage(score: number) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  
  const prompt = `A high-quality, cinematic cyberpunk neon victory card for a 2048 game winner. 
  The image should feature a futuristic digital trophy with the number ${score} glowing in cyan neon. 
  In the background, a person (gamer) with neon-lit headphones and visor is celebrating. 
  Style: Synthwave, futuristic, vibrant neon colors, 4k resolution, digital art.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}
