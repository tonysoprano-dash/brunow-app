export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, image } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const parts = [];

        if (image) {
            const base64Data = image.split(',')[1] || image;
            parts.push({
                inlineData: { mimeType: "image/jpeg", data: base64Data }
            });
        }

        const systemPrompt = "You are a warm, expert Brunei Travel Assistant. Help users plan itineraries, recommend authentic Brunei food, culture, and nature spots concisely.";
        parts.push({ text: `${systemPrompt}\n\nUser Question: ${message || "Analyze this image for Brunei travel."}` });

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            return res.status(500).json({ error: 'Gemini API 응답 오류', details: data });
        }
    } catch (error) {
        return res.status(500).json({ error: '서버 내부 오류' });
    }
}
