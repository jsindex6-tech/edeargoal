const express = require('express');
const router = express.Router();

const API_TOKEN = '0215bd6b928e4a2d91c227d17dc61374';

router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://api.football-data.org/v4/matches', {
      headers: {
        'X-Auth-Token': API_TOKEN
      }
    });

    const data = await response.json();

    if (data.matches) {
      const partidosMapeados = data.matches.map((m, index) => ({
        id: m.id || index,
        pais: m.area?.name || 'Internacional',
        liga: m.competition?.name || 'Fútbol Mundial',
        local: m.homeTeam?.name || 'Local',
        visitante: m.awayTeam?.name || 'Visitante',
        marcador: `${m.score?.fullTime?.home ?? 0} - ${m.score?.fullTime?.away ?? 0}`,
        estadoPartido: m.status === 'IN_PLAY' ? 'EN VIVO' : m.status
      }));

      res.json(partidosMapeados);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error al obtener partidos reales:", error);
    res.status(500).json({ error: "No se pudieron cargar los partidos reales" });
  }
});

module.exports = router;