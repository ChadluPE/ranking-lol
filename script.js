const rankingRows = document.querySelector("#rankingRows");
const updatedAt = document.querySelector("#updatedAt");

function tierClass(tier) {
  const tierName = tier.toLowerCase();

  if (tierName.includes("master")) return "master";
  if (tierName.includes("grandmaster")) return "master";
  if (tierName.includes("challenger")) return "master";
  if (tierName.includes("diamond")) return "diamond";
  if (tierName.includes("error")) return "error";
  if (tierName.includes("unranked")) return "unranked";
  return "";
}

async function loadRanking() {
  rankingRows.innerHTML = '<div class="empty-state">Cargando ranking...</div>';

  try {
    const response = await fetch(`data/ranking.json?ts=${Date.now()}`);

    if (!response.ok) {
      throw new Error(`No se pudo cargar data/ranking.json (${response.status})`);
    }

    const data = await response.json();
    renderPlayers(data.players ?? []);
    renderUpdatedAt(data.updatedAt);
  } catch (error) {
    if (window.RANKING_DATA) {
      renderPlayers(window.RANKING_DATA.players ?? []);
      renderUpdatedAt(window.RANKING_DATA.updatedAt);
      return;
    }

    rankingRows.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function renderPlayers(players) {
  const rankedPlayers = players.map((player, index) => ({ ...player, position: index + 1 }));

  if (!rankedPlayers.length) {
    rankingRows.innerHTML = '<div class="empty-state">No hay jugadores para mostrar.</div>';
    return;
  }

  rankingRows.innerHTML = rankedPlayers.map(createRow).join("");
}

function createRow(player) {
  const isPositiveWinRate = player.games > 0 && player.winRate >= 50;
  const winRateClass = player.games === 0 ? "neutral" : isPositiveWinRate ? "positive" : "negative";
  const tier = formatTier(player);
  const errorTitle = player.error ? ` title="${escapeHtml(player.error)}"` : "";

  return `
    <article class="table-row"${errorTitle}>
      <div class="position rank-${player.position}" aria-label="Posicion ${player.position}">${player.position}</div>
      <div>
        <h2 class="name">${escapeHtml(player.name)}</h2>
        <p class="riot-id">${escapeHtml(player.riotId ?? "")}</p>
      </div>
      <div>${tier}</div>
      <div class="games">${player.games}</div>
      <div class="record"><span class="wins">${player.wins}W</span> / <span class="losses">${player.losses}L</span></div>
      <div class="win-rate ${winRateClass}">${player.winRate.toFixed(2)} %</div>
      <div class="points">${player.points.toLocaleString("en-US")}</div>
      <a class="profile-link" href="${player.url}" target="_blank" rel="noreferrer">
        L.O.G.
      </a>
    </article>
  `;
}

function formatTier(player) {
  if (player.tier === "UNRANKED" || player.tier === "ERROR") {
    return `<span class="tier ${tierClass(player.tier)}">${escapeHtml(player.tier)}</span>`;
  }

  return `
    <span class="tier ${tierClass(player.tier)}">${escapeHtml(player.tier)} ${escapeHtml(player.rank)}</span>
    <span class="lp"> | ${player.lp} LP</span>
  `;
}

function renderUpdatedAt(value) {
  if (!value) {
    updatedAt.textContent = "Esperando primera actualizacion desde GitHub Actions.";
    return;
  }

  const date = new Date(value);
  updatedAt.textContent = `Actualizado: ${date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadRanking();
