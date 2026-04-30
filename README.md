# Ranking Elo League of Graphs

Pagina estatica para GitHub Pages que muestra un ranking de jugadores y se actualiza con la API oficial de Riot Games.

## Como activar la actualizacion automatica

1. Crea una API key en https://developer.riotgames.com/.
2. Sube este proyecto a GitHub.
3. En tu repo entra a `Settings > Secrets and variables > Actions > New repository secret`.
4. Crea un secreto llamado `RIOT_API_KEY` y pega tu API key.
5. En `Actions`, ejecuta manualmente `Update Riot Ranking` la primera vez.

Despues de eso, el workflow se ejecuta cada hora y actualiza `data/ranking.json` y `data/ranking.js`.

## Editar jugadores

Los jugadores estan en `data/players.json`. Usa Riot ID:

```json
{
  "gameName": "chj7",
  "tagLine": "LAN",
  "platform": "la1",
  "regional": "americas",
  "leagueOfGraphsUrl": "https://www.leagueofgraphs.com/summoner/lan/chj7-LAN"
}
```

Para LAN/LAS normalmente:

- `platform`: `la1` para LAN, `la2` para LAS
- `regional`: `americas`
