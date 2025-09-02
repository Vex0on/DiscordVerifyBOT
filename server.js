require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const BODY_LIMIT = process.env.BODY_LIMIT || "5mb";

app.use(bodyParser.json({ limit: BODY_LIMIT }));

const guildData = {};

app.post("/:guildId", (req, res) => {
  const guildId = req.params.guildId;
  const users = req.body.users;

  if (!Array.isArray(users)) {
    return res.status(400).json({ error: "users must be an array" });
  }

  guildData[guildId] = users;
  console.log(`Received ${users.length} members for guild ${guildId}`);
  res.json({ status: "OK", received: users.length });
});

app.get("/:guildId", (req, res) => {
  const guildId = req.params.guildId;
  const users = guildData[guildId] || [];
  res.json({ guildId, users });
});

app.listen(PORT, () => {
  console.log(`API running at http://${HOST}:${PORT}`);
});
