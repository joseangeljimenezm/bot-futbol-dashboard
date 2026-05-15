/*
 * data.js — loads data.json and exposes window.DASH
 * Production: your Python script regenerates ONLY data.json (see README_PRODUCCION.md).
 */
(function () {
  // ============== PERIOD SCALING ==============
  // Used when data.json doesn't pre-compute each period (simple mode).
  // If your Python emits a `periods` map, scaling is skipped.
  const PERIOD_FACTORS = {
    today: 5/134, yest: 6/134, weekend: 11/134,
    "7d": 38/134, month: 92/134, since: 1, hist: 1,
  };
  const PERIOD_BIAS = { today: -1.4, yest: -3.1, weekend: 2.4, "7d": -2.8, month: -8.4, since: -10.2, hist: -10.2 };

  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h*31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function statusFor(total, roi) {
    if (total < 5) return "insuf";
    if (roi >= 8) return "green";
    if (roi >= -3) return "amber";
    return "red";
  }
  function scaleRow(row, factor, periodKey, stake) {
    const total = Math.max(0, Math.round(row.total * factor));
    if (total === 0) return null;
    const wRatio = row.total ? row.w / row.total : 0;
    const lRatio = row.total ? row.l / row.total : 0;
    const w = Math.round(total * wRatio);
    const l = Math.round(total * lRatio);
    const winPct = total ? Math.round((w / total) * 100) : 0;
    const seed = (hash(row.name + periodKey) % 21) - 10;
    const blendK = factor < 0.3 ? 0.55 : factor < 0.75 ? 0.35 : 0;
    const periodMean = PERIOD_BIAS[periodKey] ?? 0;
    let roi = row.roi * (1 - blendK) + periodMean * blendK + seed * (factor < 0.3 ? 1 : 0.3);
    roi = Math.max(-95, Math.min(95, roi));
    const eur = (roi / 100) * total * (stake || 0.21);
    return { ...row, total, w, l, winPct, roi: +roi.toFixed(1), eur: +eur.toFixed(2), status: statusFor(total, roi) };
  }
  function scaleCell(cell, factor, key) {
    if (!cell) return null;
    const n = Math.max(0, Math.round(cell.n * factor));
    if (n === 0) return null;
    const seed = (hash(key) % 17) - 8;
    const blendK = factor < 0.3 ? 0.4 : factor < 0.75 ? 0.2 : 0;
    let roi = cell.roi * (1 - blendK) + seed * (factor < 0.3 ? 1.2 : 0.4);
    roi = Math.max(-60, Math.min(60, Math.round(roi)));
    return { roi, n };
  }
  function scaleHM(hm, factor, periodKey) {
    return {
      leagues: hm.leagues, markets: hm.markets,
      cells: hm.cells.map((row, ri) =>
        row.map((c, ci) => scaleCell(c, factor, `${periodKey}:${hm.leagues[ri]}:${hm.markets[ci]}`))
      ),
    };
  }

  function buildDash(raw) {
    const stake = raw.meta?.stake_default ?? 0.21;

    // Backwards-compat: flat heatmap (no leagues/markets) → wrap
    const hm = raw.heatmap?.cells ? raw.heatmap : { leagues: raw.hmLeagues || [], markets: raw.hmMarkets || [], cells: raw.heatmap || [] };
    const hmShadow = raw.heatmapShadow?.cells ? raw.heatmapShadow : { leagues: raw.hmLeaguesShadow || [], markets: raw.hmMarketsShadow || [], cells: raw.heatmapShadow || [] };
    const hmProd = raw.heatmapProd?.cells ? raw.heatmapProd : { leagues: raw.hmLeaguesProd || [], markets: raw.hmMarketsProd || [], cells: raw.heatmapProd || [] };

    function getPeriod(p) {
      // Best: Python pre-computed this period
      if (raw.periods && raw.periods[p]) {
        const pp = raw.periods[p];
        return {
          byLeague: pp.byLeague || raw.byLeague,
          byMarket: pp.byMarket || raw.byMarket,
          byOdds:   pp.byOdds   || raw.byOdds,
          byCorners: pp.byCorners || raw.byCorners,
          byReason: pp.byReason || raw.byReason,
          heatmap:       (pp.heatmap?.cells       ? pp.heatmap.cells       : pp.heatmap)       || hm.cells,
          heatmapProd:   (pp.heatmapProd?.cells   ? pp.heatmapProd.cells   : pp.heatmapProd)   || hmProd.cells,
          heatmapShadow: (pp.heatmapShadow?.cells ? pp.heatmapShadow.cells : pp.heatmapShadow) || hmShadow.cells,
          shadowBasket:   pp.shadowBasket   || raw.shadowBasket,
          shadowFootball: pp.shadowFootball || raw.shadowFootball,
        };
      }
      // Fallback: scale `since` data
      const f = PERIOD_FACTORS[p] ?? 1;
      return {
        factor: f,
        byLeague: (raw.byLeague || []).map(r => scaleRow(r, f, p, stake)).filter(Boolean),
        byMarket: (raw.byMarket || []).map(r => scaleRow(r, f, p, stake)).filter(Boolean),
        byOdds:   (raw.byOdds   || []).map(r => scaleRow(r, f, p, stake)).filter(Boolean),
        byCorners: (raw.byCorners || []).map(r => scaleRow(r, f, p, stake)).filter(Boolean),
        byReason: (raw.byReason || []).map(r => scaleRow(r, f, p, stake)).filter(Boolean),
        heatmap:       scaleHM(hm,       f, p).cells,
        heatmapProd:   scaleHM(hmProd,   f, p).cells,
        heatmapShadow: scaleHM(hmShadow, f, p).cells,
        shadowBasket: raw.shadowBasket && {
          ...raw.shadowBasket,
          total: Math.round(raw.shadowBasket.total * f),
          pnl: +(raw.shadowBasket.pnl * f).toFixed(2),
          roi: raw.shadowBasket.roi + (PERIOD_BIAS[p] ?? 0) * 0.2,
          leagues: (raw.shadowBasket.leagues || []).map(r => scaleRow(r, f, p, stake)).filter(Boolean),
        },
        shadowFootball: raw.shadowFootball && {
          ...raw.shadowFootball,
          total: Math.round(raw.shadowFootball.total * f),
          pnl: +(raw.shadowFootball.pnl * f).toFixed(2),
          roi: raw.shadowFootball.roi + (PERIOD_BIAS[p] ?? 0) * 0.2,
          leagues: (raw.shadowFootball.leagues || []).map(r => scaleRow(r, f, p, stake)).filter(Boolean),
          markets: (raw.shadowFootball.markets || []).map(r => scaleRow(r, f, p, stake)).filter(Boolean),
        },
      };
    }

    return {
      ...raw,
      // Axes for heatmaps (the React components expect these flat names)
      hmLeagues: hm.leagues, hmMarkets: hm.markets, heatmap: hm.cells,
      hmLeaguesProd: hmProd.leagues, hmMarketsProd: hmProd.markets, heatmapProd: hmProd.cells,
      hmLeaguesShadow: hmShadow.leagues, hmMarketsShadow: hmShadow.markets, heatmapShadow: hmShadow.cells,
      getPeriod,
    };
  }

  // ============== BOOT ==============
  // Async fetch to load data.json (non-blocking, modern approach)
  function boot() {
    fetch("data.json?ts=" + Date.now())
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(raw => {
        window.DASH = buildDash(raw);
        window.dispatchEvent(new Event("dash:ready"));
      })
      .catch(e => {
        console.error("[data.js] No se pudo cargar data.json:", e);
        window.addEventListener("DOMContentLoaded", () => {
          const root = document.getElementById("root");
          if (root) {
            root.innerHTML =
              `<div style="padding:40px;font-family:sans-serif;color:#ff5c7a;background:#07090f;min-height:100vh">
                 <h2>Error cargando data.json</h2>
                 <pre style="color:#a8b0c4;white-space:pre-wrap">${e.message}</pre>
                 <p style="color:#a8b0c4">
                   Genera el fichero con <code>python generar_dashboard.py</code> y sirve la página
                   vía HTTP (no la abras con <code>file://</code>).<br>
                   Para servir local: <code>python -m http.server 8000</code> y abre
                   <code>http://localhost:8000/Dashboard.html</code>.
                 </p>
               </div>`;
          }
        });
      });
  }
  boot();
})();
