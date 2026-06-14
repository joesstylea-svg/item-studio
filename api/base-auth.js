module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const clientId = process.env.BASE_CLIENT_ID;
  const clientSecret = process.env.BASE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "BASE credentials not configured" });
  }

  const { code, refresh_token } = req.body || {};

  let params;
  if (refresh_token) {
    params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token,
    });
  } else if (code) {
    params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: "https://joesstylea-svg.github.io/item-studio/callback",
    });
  } else {
    return res.status(400).json({ error: "code or refresh_token is required" });
  }

  let response;
  try {
    response = await fetch("https://api.thebase.in/1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  } catch (e) {
    return res.status(502).json({ error: "BASE API network error", detail: e.message });
  }

  const data = await response.json();
  if (!response.ok) {
    return res.status(response.status).json({ error: "BASE token error", detail: data });
  }
  return res.status(200).json(data);
};
