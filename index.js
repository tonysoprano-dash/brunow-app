export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });

  const { message, image } = req.body;

  // 🎯 대화형 프롬프트: 짧은 추천 + 후속 질문 유도
  const interactiveSystemInstruction = `
You are a friendly, conversational Brunei Travel Assistant.
RULES FOR RESPONSE:
1. NO LONG LISTS: Recommend ONLY 1 or 2 top choices at a time.
2. NO MARKDOWN HEADERS: Never use '###' or '##'.
3. BREVITY: Keep descriptions to 1-2 short sentences per spot.
4. FOLLOW-UP: ALWAYS end with ONE friendly follow-up question to ask what the user wants next.
5. NO LONG INTROS: Skip repetitive welcome greetings.
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
