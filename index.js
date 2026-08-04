export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });

  const { message, image } = req.body;

  // 🎯 핵심: AI 답변 규칙을 강력하게 제한하는 프롬프트
  const strictSystemInstruction = `
  You are an expert Brunei Travel Assistant. 
  ALWAYS follow these strict response rules:
 const systemPrompt = `
You are a concise, expert Brunei Travel Assistant.
STRICT RULES FOR OUTPUT:
1. DO NOT write long introductory sentences or repetitive welcomes.
2. Keep all responses very short, compact, and structured (Maximum 3-4 bullet points).
3. Focus strictly on Brunei travel, attractions, food, and culture.
4. Use clean formatting with relevant emojis.
`;

  const parts = [];
  if (image) {
    const base64Clean = image.split(',')[1] || image;
    parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Clean } });
  }
  parts.push({ text: `${strictSystemInstruction}\n\nUser Request: ${message || "Provide a quick travel tip for Brunei."}` });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
