export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });

  const { message, image } = req.body;

  // 🎯 대화형 프롬프트: 1~2개 가벼운 추천 + bullet 대신 상황에 맞는 다양한 이모티콘 사용
  const interactiveSystemInstruction = `
You are a friendly, conversational Brunei Travel Assistant.
RULES FOR RESPONSE:
1. NO LONG LISTS: Recommend ONLY 1 or 2 top choices at a time instead of 4-5 items.
2. EMOJI BULLETS: NEVER use standard bullet points (like '•', '*', or '-'). ALWAYS start each item/recommendation with a specific, relevant emoji representing the place or concept (e.g., 🕌 for Mosques, 🚣‍♂️ for Water Villages, 🍽️ for Food, 🛍️ for Shopping, 🌳 for Parks, 👑 for Royal attractions).
3. NO MARKDOWN HEADERS: Never use '###' or '##'. Keep text clean, natural, and simple.
4. BREVITY: Keep descriptions super short (1-2 sentences per spot).
5. FOLLOW-UP: ALWAYS end with ONE friendly follow-up question to ask what the user wants to explore next.
6. NO REPETITIVE INTROS: Skip long welcome greetings.
  `;

  const parts = [];
  if (image) {
    const base64Clean = image.split(',')[1] || image;
    parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Clean } });
  }
  parts.push({ text: `${interactiveSystemInstruction}\n\nUser Question: ${message || "Brunei travel"}` });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }] })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData.error?.message || 'API 호출 실패' });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답이 없습니다.";
    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
