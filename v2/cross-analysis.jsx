// Cross-Analysis Views: Liga×Mercado | Timeline | Scatter
// Nuevas vistas de análisis para Dashboard v2

const { useState: useStateCA, useMemo: useMemoCA } = React;

/* ============== LIGA × MERCADO PIVOT TABLE ============== */
function LigaByMercadoView({ period }) {
  const data = useMemoCA(() => {
    // Construir matriz: liga × mercado con ROI
    const picks = window.DASH?.periods[period]?.picks || [];
    if (!picks.length) return { matrix: [], ligas: [], mercados: [] };

    const byLM = {};
    picks.forEach(p => {
      const key = `${p.liga}|${p.mercado}`;
      if (!byLM[key]) byLM[key] = { picks: 0, roi: 0, ganada: 0 };
      byLM[key].picks++;
      byLM[key].roi += (p.resultado === 'GANADA' ? p.odd - 1 : -1) * p.stake;
      if (p.resultado === 'GANADA') byLM[key].ganada++;
    });

    // Agrupar por liga
    const byLiga = {};
    Object.entries(byLM).forEach(([key, stats]) => {
      const [liga, mercado] = key.split('|');
      if (!byLiga[liga]) byLiga[liga] = {};
      byLiga[liga][mercado] = {
        n: stats.picks,
        roi: stats.roi,
        hit: Math.round(100 * stats.ganada / stats.picks),
      };
    });

    return { byLiga, ligas: Object.keys(byLiga).sort() };
  }, [period]);

  return (
    <div className="analysis-view">
      <div className="view-header">
        <h3>📊 Liga × Mercado</h3>
        <span className="text-3">ROI desagregado por combinación liga-mercado</span>
      </div>
      <div className="scroll-table">
        <table className="cross-table">
          <thead>
            <tr>
              <th>Liga</th>
              <th>Mercado</th>
              <th style={{textAlign:"right"}}>Picks</th>
              <th style={{textAlign:"right"}}>Hit %</th>
              <th style={{textAlign:"right"}}>ROI</th>
            </tr>
          </thead>
          <tbody>
            {data.ligas.map(liga => {
              const mercados = Object.entries(data.byLiga[liga] || {});
              return mercados.map(([ mercado, stats ], idx) => (
                <tr key={`${liga}-${mercado}`} className={stats.roi >= 0 ? "row-win" : "row-loss"}>
                  {idx === 0 && <td rowSpan={mercados.length}><b>{liga}</b></td>}
                  <td><span className="text-3">{mercado}</span></td>
                  <td style={{textAlign:"right"}}>{stats.n}</td>
                  <td style={{textAlign:"right"}}><span className="mono">{stats.hit}%</span></td>
                  <td style={{textAlign:"right"}}>
                    <span className={`mono ${stats.roi >= 0 ? "green" : "red"}`}>
                      {stats.roi >= 0 ? "+" : ""}{stats.roi.toFixed(2)}€
                    </span>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============== TIMELINE ROI ACUMULADO ============== */
function TimelineView({ period }) {
  const chartData = useMemoCA(() => {
    const daily = D3.dailyResults || [];
    let cumulative = 0;
    return daily.map((val, idx) => {
      cumulative += val;
      return { day: idx + 1, cumulative, daily: val };
    });
  }, []);

  if (!chartData.length) {
    return <div className="analysis-view"><p className="text-3">Sin datos para este período</p></div>;
  }

  const maxCum = Math.max(...chartData.map(d => d.cumulative));
  const minCum = Math.min(...chartData.map(d => d.cumulative));
  const range = maxCum - minCum || 1;

  return (
    <div className="analysis-view">
      <div className="view-header">
        <h3>📈 Timeline ROI Acumulado</h3>
        <span className="text-3">Equity curve: PnL acumulado día a día</span>
      </div>
      <div style={{height: 240, position:"relative", marginTop:20}}>
        <svg width="100%" height="100%" style={{display:"block"}}>
          {/* Y-axis labels */}
          <text x="30" y="20" fontSize="11" className="text-3">{maxCum.toFixed(1)}€</text>
          <text x="30" y="120" fontSize="11" className="text-3">0€</text>
          <text x="30" y="220" fontSize="11" className="text-3">{minCum.toFixed(1)}€</text>

          {/* Grid lines */}
          <line x1="50" y1="20" x2="50" y2="220" stroke="var(--border)" strokeWidth="1"/>
          <line x1="50" y1="120" x2="100%" y2="120" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3"/>

          {/* Path */}
          {chartData.map((d, i) => {
            const x1 = 50 + (i / chartData.length) * (100 - 8) + "%";
            const y1 = 220 - ((d.cumulative - minCum) / range) * 200;
            const x2 = 50 + ((i + 1) / chartData.length) * (100 - 8) + "%";
            const y2 = i + 1 < chartData.length ? 220 - ((chartData[i+1].cumulative - minCum) / range) * 200 : y1;

            return i < chartData.length - 1 ? (
              <line key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={d.cumulative >= 0 ? "var(--green)" : "var(--red)"}
                    strokeWidth="2" opacity="0.7"/>
            ) : null;
          })}
        </svg>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:16}}>
        <div className="chip" style={{background:"rgba(34,197,94,0.1)", color:"var(--green)"}}>
          <span className="mono"><b>+{chartData[chartData.length-1].cumulative.toFixed(2)}€</b></span>
          <span className="text-3">acumulado</span>
        </div>
        <div className="chip" style={{background:"rgba(59,130,246,0.1)", color:"var(--blue)"}}>
          <span className="mono"><b>{chartData.length}</b></span>
          <span className="text-3">días registrados</span>
        </div>
      </div>
    </div>
  );
}

/* ============== SCATTER: CUOTA vs ROI ============== */
function ScatterView({ period }) {
  const points = useMemoCA(() => {
    const picks = D3.periods[period]?.picks || [];
    return picks.map(p => ({
      odd: p.odd,
      roi: p.resultado === 'GANADA' ? (p.odd - 1) * 100 : -100,
      mercado: p.mercado,
      color: p.resultado === 'GANADA' ? "var(--green)" : "var(--red)",
    }));
  }, [period]);

  if (!points.length) {
    return <div className="analysis-view"><p className="text-3">Sin datos para este período</p></div>;
  }

  const oddMin = Math.min(...points.map(p => p.odd));
  const oddMax = Math.max(...points.map(p => p.odd));
  const roiMin = -150, roiMax = 150;

  return (
    <div className="analysis-view">
      <div className="view-header">
        <h3>🎯 Scatter: Cuota vs ROI</h3>
        <span className="text-3">Dispersión picks por mercado (color: W=verde, L=rojo)</span>
      </div>
      <div style={{height: 300, position:"relative", marginTop:20, paddingLeft:40, paddingBottom:30}}>
        <svg width="100%" height="100%" style={{display:"block", position:"absolute", left:0, top:0}}>
          {/* Axes */}
          <line x1="40" y1="280" x2="95%" y2="280" stroke="var(--border)" strokeWidth="1.5"/>
          <line x1="40" y1="20" x2="40" y2="280" stroke="var(--border)" strokeWidth="1.5"/>

          {/* X-axis labels (cuotas) */}
          {[1.5, 2.0, 2.5, 3.0, 3.5].map((odd, i) => {
            const x = 40 + ((odd - oddMin) / (oddMax - oddMin)) * (100 - 10) + "%";
            return (
              <g key={`x-${odd}`}>
                <line x1={x} y1="275" x2={x} y2="285" stroke="var(--border)"/>
                <text x={x} y="300" fontSize="10" textAnchor="middle" className="text-3">{odd}</text>
              </g>
            );
          })}

          {/* Y-axis labels (ROI%) */}
          {[-150, -75, 0, 75, 150].map((roi, i) => {
            const y = 280 - ((roi - roiMin) / (roiMax - roiMin)) * 260;
            return (
              <g key={`y-${roi}`}>
                <line x1="35" y1={y} x2="45" y2={y} stroke="var(--border)"/>
                <text x="25" y={y + 3} fontSize="10" textAnchor="end" className="text-3">{roi}%</text>
              </g>
            );
          })}

          {/* Center line (0% ROI) */}
          <line x1="40" y1="150" x2="95%" y2="150" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3" opacity="0.3"/>

          {/* Points */}
          {points.map((p, i) => {
            const x = 40 + ((p.odd - oddMin) / (oddMax - oddMin)) * (100 - 10) + "%";
            const y = 280 - ((p.roi - roiMin) / (roiMax - roiMin)) * 260;
            return (
              <circle key={`pt-${i}`} cx={x} cy={y} r="3.5" fill={p.color} opacity="0.6"/>
            );
          })}
        </svg>
      </div>
      <div style={{marginTop:20, paddingLeft:40}}>
        <p className="text-3" style={{fontSize:11}}>
          <b>Eje X:</b> Cuota (más derecha = cuota más alta)<br/>
          <b>Eje Y:</b> ROI por pick (arriba = ganancia, abajo = pérdida)
        </p>
      </div>
    </div>
  );
}

/* ============== MAIN CROSS ANALYSIS COMPONENT ============== */
function CrossAnalysisPanel({ period }) {
  const [subview, setSubview] = useStateCA("liga-mercado");

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>
      <div style={{display:"flex", gap:8, borderBottom:"1px solid var(--border)", paddingBottom:12}}>
        <button
          className={`tab-btn ${subview === "liga-mercado" ? "active" : ""}`}
          onClick={() => setSubview("liga-mercado")}>
          📊 Liga × Mercado
        </button>
        <button
          className={`tab-btn ${subview === "timeline" ? "active" : ""}`}
          onClick={() => setSubview("timeline")}>
          📈 Timeline
        </button>
        <button
          className={`tab-btn ${subview === "scatter" ? "active" : ""}`}
          onClick={() => setSubview("scatter")}>
          🎯 Scatter
        </button>
      </div>

      {subview === "liga-mercado" && <LigaByMercadoView period={period} />}
      {subview === "timeline" && <TimelineView period={period} />}
      {subview === "scatter" && <ScatterView period={period} />}
    </div>
  );
}
