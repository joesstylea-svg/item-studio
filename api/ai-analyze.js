const Anthropic = require("@anthropic-ai/sdk");

const PROMPTS = {
  parts: `この商品の写真を分析して、ハンドメイド材料・パーツ素材の販売情報をJSONで返してください。
日本語で出力してください。タイトルは40文字以内にしてください。

{
  "title": "商品タイトル（40文字以内）",
  "material": "素材・材質（例：ガラスビーズ、メタルパーツ、天然石）",
  "color": "カラー（例：ゴールド、シルバー、クリア）",
  "description": "商品説明（3〜5行。素材・サイズ感・用途・特徴を含める）"
}

JSONのみ返してください。前後に文章を追加しないでください。`,

  clothes: `この洋服・ファッションアイテムの写真を分析して、フリマアプリ向け販売情報をJSONで返してください。
日本語で出力してください。タイトルは40文字以内にしてください。

{
  "title": "商品タイトル（40文字以内）",
  "category": "カテゴリ（例：ワンピース、Tシャツ、ジャケット、スカート）",
  "brand": "ブランド名（不明なら空文字）",
  "condition": "状態（「新品・未使用」「未使用に近い」「目立つ傷や汚れなし」「やや傷や汚れあり」「傷や汚れあり」のいずれか）",
  "color": "カラー（例：ホワイト、ネイビー、ベージュ）",
  "description": "商品説明（3〜5行。素材・サイズ感・状態・おすすめポイントを含める）"
}

JSONのみ返してください。前後に文章を追加しないでください。`,
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mimeType, mode } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 is required" });
  }
  if (!mode || !PROMPTS[mode]) {
    return res.status(400).json({ error: "mode must be 'parts' or 'clothes'" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  const client = new Anthropic({ apiKey });

  let message;
  try {
    message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: PROMPTS[mode],
            },
          ],
        },
      ],
    });
  } catch (e) {
    return res.status(502).json({ error: "Anthropic API error", detail: e.message });
  }

  const text = message.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return res.status(500).json({ error: "AI response parse error", raw: text });
  }

  let result;
  try {
    result = JSON.parse(match[0]);
  } catch (e) {
    return res.status(500).json({ error: "JSON parse error", raw: match[0] });
  }

  return res.status(200).json(result);
};
