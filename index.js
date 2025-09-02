require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const cron = require("node-cron");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const API_BASE_URL = process.env.API_BASE_URL;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "500", 10);
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "*/2 * * * *";

const sentMembers = {};

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.guilds.cache.forEach(async (guild) => {
    await fetchAndSendMembers(guild);

    cron.schedule(CRON_SCHEDULE, async () => {
      await fetchAndSendMembers(guild);
    });
  });
});

async function fetchAndSendMembers(guild) {
  console.time(`fetchMembers-${guild.id}`);
  const members = await guild.members.fetch();
  console.timeEnd(`fetchMembers-${guild.id}`);

  console.log(`--- Guild: ${guild.name} (${members.size} members) ---`);

  if (!sentMembers[guild.id]) sentMembers[guild.id] = new Set();

  const newMembers = members.filter(m => !sentMembers[guild.id].has(m.user.id));

  if (newMembers.size === 0) {
    console.log("No new members to send.");
    return;
  }

  const payload = newMembers.map(m => ({
    id: m.user.id,
    username: m.user.username
  }));

  let totalSent = 0;

  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const batch = payload.slice(i, i + BATCH_SIZE);
    try {
      const response = await axios.post(`${API_BASE_URL}/${guild.id}`, { users: batch });
      totalSent += batch.length;
      console.log(`Batch ${i / BATCH_SIZE + 1} sent: ${batch.length} new members, API responded with ${response.status}`);
    } catch (err) {
      console.error("Error sending to API:", err.message);
    }
  }

  newMembers.forEach(m => sentMembers[guild.id].add(m.user.id));

  console.log(`Total new members sent: ${totalSent}`);
}

client.login(process.env.DISCORD_TOKEN);
