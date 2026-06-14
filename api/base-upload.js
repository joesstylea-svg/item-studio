module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accessToken, itemData, imageUrls } = req.body || {};

  if (!accessToken) return res.status(400).json({ error: "accessToken is required" });
  if (!itemData?.title) return res.status(400).json({ error: "itemData.title is required" });
  if (!itemData?.price || Number(itemData.price) < 100) {
    return res.status(400).json({ error: "price must be at least 100 yen" });
  }

  const authHeader = { Authorization: `Bearer ${accessToken}` };
  const formHeader = { ...authHeader, "Content-Type": "application/x-www-form-urlencoded" };

  // 1. Create item
  const addParams = new URLSearchParams({
    title: itemData.title,
    detail: itemData.detail || "",
    price: String(Math.round(Number(itemData.price))),
    stock: String(Math.max(1, Math.round(Number(itemData.stock || 1)))),
    status: "1",
  });

  let addRes, addData;
  try {
    addRes = await fetch("https://api.thebase.in/1/items/add", {
      method: "POST",
      headers: formHeader,
      body: addParams.toString(),
    });
    addData = await addRes.json();
  } catch (e) {
    return res.status(502).json({ error: "BASE API network error", detail: e.message });
  }

  if (addRes.status === 401) {
    return res.status(401).json({ error: "token_expired", detail: addData });
  }
  if (!addRes.ok) {
    return res.status(addRes.status).json({ error: "BASE items/add failed", detail: addData });
  }

  const itemId = addData?.item?.item_id ?? addData?.item_id;
  if (!itemId) {
    return res.status(500).json({ error: "item_id not found in response", detail: addData });
  }

  // 2. Upload images (up to 5)
  const imageErrors = [];
  const urls = (imageUrls || []).slice(0, 5);
  for (let i = 0; i < urls.length; i++) {
    const imgParams = new URLSearchParams({
      item_id: String(itemId),
      image_no: String(i + 1),
      image_url: urls[i],
    });
    try {
      const imgRes = await fetch("https://api.thebase.in/1/items/add_image", {
        method: "POST",
        headers: formHeader,
        body: imgParams.toString(),
      });
      if (!imgRes.ok) {
        const imgErr = await imgRes.json().catch(() => ({}));
        imageErrors.push({ index: i, error: imgErr });
      }
    } catch (e) {
      imageErrors.push({ index: i, error: e.message });
    }
  }

  return res.status(200).json({
    baseItemId: String(itemId),
    baseUrl: `https://admin.thebase.in/items/${itemId}`,
    imageErrors: imageErrors.length ? imageErrors : undefined,
  });
};
