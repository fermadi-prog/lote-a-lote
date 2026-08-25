const express = require('express');

const router = express.Router();
const SOURCE_URL = 'https://www.cambioschaco.com.py/';
const CACHE_MS = 30 * 60 * 1000; // 30 minutos — no tiene sentido pegarle al sitio en cada visita.
const SOURCE_LABEL = 'Cambios Chaco (cambioschaco.com.py)';

let cache = null; // { compra, venta, fetchedAt } | null
let lastDebug = null; // diagnóstico del último intento fallido, se expone en la respuesta 503 (temporal, para depurar)

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Paraguay usa "." como separador de miles y "," como decimal (ej: "5.900" = 5900).
function parseNumberEsPy(raw) {
  const cleaned = String(raw).replace(/\./g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function fetchRate() {
  let res;
  try {
    res = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
  } catch (err) {
    lastDebug = { stage: 'fetch_error', message: err.message };
    throw err;
  }
  if (!res.ok) {
    lastDebug = { stage: 'http_status', status: res.status };
    throw new Error('http_' + res.status);
  }
  const html = await res.text();
  const text = stripHtml(html);
  const idx = text.toLowerCase().indexOf('lar american'); // detecta "dólar americano" o "dolar americano"
  const match = text.match(/d[oó]lar\s+american[oa][^0-9]{0,80}([\d.,]+)[^0-9]{0,40}([\d.,]+)/i);
  if (!match) {
    lastDebug = {
      stage: 'no_match',
      htmlLength: html.length,
      textLength: text.length,
      foundPhrase: idx !== -1,
      contextSnippet: idx !== -1 ? text.slice(Math.max(0, idx - 30), idx + 200) : text.slice(0, 300)
    };
    throw new Error('formato_no_encontrado');
  }
  const compra = parseNumberEsPy(match[1]);
  const venta = parseNumberEsPy(match[2]);
  // Sanity check: el USD/Gs. ronda varios miles — si el número no cae en un rango razonable,
  // es más probable que el sitio haya cambiado de formato que un valor real.
  if (!(compra > 2000 && compra < 20000) || !(venta > 2000 && venta < 20000)) {
    lastDebug = { stage: 'out_of_range', compra, venta, matched: match[0] };
    throw new Error('valores_fuera_de_rango');
  }
  lastDebug = null;
  cache = { compra, venta, fetchedAt: new Date().toISOString() };
  return cache;
}

// GET /api/exchange-rate — público. Sirve el valor cacheado si está fresco; si no, intenta
// actualizarlo; si la actualización falla, sirve el último valor conocido marcado como "stale".
router.get('/', async (req, res) => {
  const isFresh = cache && (Date.now() - new Date(cache.fetchedAt).getTime() < CACHE_MS);
  if (isFresh) return res.json({ rate: cache, source: SOURCE_LABEL, stale: false });
  try {
    const fresh = await fetchRate();
    res.json({ rate: fresh, source: SOURCE_LABEL, stale: false });
  } catch (err) {
    if (cache) return res.json({ rate: cache, source: SOURCE_LABEL, stale: true });
    res.status(503).json({ error: 'no_disponible', message: 'No se pudo obtener la cotización en este momento.', debug: lastDebug });
  }
});

module.exports = router;
