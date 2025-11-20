// api/auth.js
export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: "Missing ?code" });
    return;
  }

  const params = new URLSearchParams();
  params.append("client_id", process.env.GH_CLIENT_ID);
  params.append("client_secret", process.env.GH_CLIENT_SECRET);
  params.append("code", code);

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json" },
    body: params
  });

  const tokenJson = await tokenRes.json();

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json(tokenJson);
}
