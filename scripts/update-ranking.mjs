import { mkdir, readFile, writeFile } from "node:fs/promises";

const API_KEY = process.env.RIOT_API_KEY;
const PLAYERS_PATH = new URL("../data/players.json", import.meta.url);
const OUTPUT_PATH = new URL("../data/ranking.json", import.meta.url);
const JS_OUTPUT_PATH = new URL("../data/ranking.js", import.meta.url);

const DIVISION_POINTS = {
  IV: 0,
  III: 100,
  II: 200,
  I: 300,
};

const TIER_POINTS = {
  IRON: 0,
  BRONZE: 400,
  SILVER: 800,
  GOLD: 1200,
  PLATINUM: 1600,
  EMERALD: 2000,
  DIAMOND: 2400,
  MASTER: 3100,
  GRANDMASTER: 3400,
  CHALLENGER: 3700,
};

if (!API_KEY) {
  throw new Error("Missing RIOT_API_KEY environment variable.");
}

const players = JSON.parse(await readFile(PLAYERS_PATH, "utf8"));
const ranking = [];

for (const player of players) {
  try {
    ranking.push(await fetchPlayer(player));
  } catch (error) {
    console.error(`Could not update ${player.gameName}#${player.tagLine}: ${error.message}`);
    ranking.push(createFallbackPlayer(player, error.message));
  }
}

ranking.sort((a, b) => b.points - a.points || b.winRate - a.winRate || b.games - a.games);

const output = {
  updatedAt: new Date().toISOString(),
  players: ranking,
};

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(JS_OUTPUT_PATH, `window.RANKING_DATA = ${JSON.stringify(output, null, 2)};\n`);

async function fetchPlayer(player) {
  const account = await riotFetch(
    `https://${player.regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`
  );

  const entries = await riotFetch(
    `https://${player.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`
  );

  const soloQueue = entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5");

  if (!soloQueue) {
    return {
      name: account.gameName ?? player.gameName,
      riotId: `${account.gameName ?? player.gameName}#${account.tagLine ?? player.tagLine}`,
      tier: "UNRANKED",
      rank: "",
      lp: 0,
      games: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      points: 0,
      url: player.leagueOfGraphsUrl,
    };
  }

  const wins = soloQueue.wins ?? 0;
  const losses = soloQueue.losses ?? 0;
  const games = wins + losses;
  const winRate = games > 0 ? (wins / games) * 100 : 0;

  return {
    name: account.gameName ?? player.gameName,
    riotId: `${account.gameName ?? player.gameName}#${account.tagLine ?? player.tagLine}`,
    tier: soloQueue.tier,
    rank: soloQueue.rank,
    lp: soloQueue.leaguePoints ?? 0,
    games,
    wins,
    losses,
    winRate,
    points: calculatePoints(soloQueue),
    url: player.leagueOfGraphsUrl,
  };
}

async function riotFetch(url) {
  const response = await fetch(url, {
    headers: {
      "X-Riot-Token": API_KEY,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Riot API ${response.status}: ${body}`);
  }

  return response.json();
}

function calculatePoints(entry) {
  const tier = TIER_POINTS[entry.tier] ?? 0;
  const division = DIVISION_POINTS[entry.rank] ?? 0;
  const lp = entry.leaguePoints ?? 0;

  return tier + division + lp;
}

function createFallbackPlayer(player, message) {
  return {
    name: player.gameName,
    riotId: `${player.gameName}#${player.tagLine}`,
    tier: "ERROR",
    rank: "",
    lp: 0,
    games: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    points: 0,
    url: player.leagueOfGraphsUrl,
    error: message,
  };
}
