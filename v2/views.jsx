// Views: Picks (Producción) · Análisis Virtual · Modo Sombra

const { useState: useStateV, useMemo: useMemoV } = React;

/* ============== VALIDACIÓN DE DATOS ============== */
function safeNum(v, def = 0) {
  const n = parseFloat(v);
  return isNaN(n) || !isFinite(n) ? def : n;
}

function safeArray(arr, def = []) {
  return Array.isArray(arr) ? arr : def;
}

function safeObj(obj, def = {}) {
  return obj && typeof obj === "object" ? obj : def;
}

function ensureKPI(period) {
  if (!window.DASH || !window.DASH.kpis) return { roi: 0, profit: 0, picks: 0, wins: 0, edge: 0, yld: 0, win: 0 };
  return window.DASH.kpis[period] || window.DASH.kpis.since || { roi: 0, profit: 0, picks: 0, wins: 0, edge: 0, yld: 0, win: 0 };
}

/* ============== KPI HERO (compact, configurable) ============== */
function KPICard({ label, value, unit, sub, delta, spark, sparkColor, featured, danger }) {
  return (
    <div className={"kpi" + (featured ? " featured" : "") + (danger ? " danger" : "")}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}<span className="unit">{unit}</span>
      </div>
      <div className="kpi-sub">
        {delta && (
          <span className={`kpi-delta ${delta.v >= 0 ? "pos" : "neg"}`}>
            {delta.v >= 0 ? "▲" : "▼"} {delta.pct.toFixed(1)}%
          </span>
        )}
        {sub}
      </div>
      {spark && (
        <div className="kpi-spark">
          <Sparkline values={spark} w={80} h={32} color={sparkColor} />
        </div>
      )}
    </div>
  );
}

/* ============== CONFIDENCE BADGE (TIER 2) ============== */
function ConfidenceBadge({ pickCount = 67 }) {
  const target = 100;
  const confidence = pickCount >= target ? "Alto" : pickCount >= 50 ? "Medio" : "Bajo";
  const color = pickCount >= target ? "#22c55e" : pickCount >= 50 ? "#eab308" : "#ef4444";
  const icon = pickCount >= target ? "✓" : "⚠";
  return (
    <div style={{
      padding: "8px 12px",
      background: `${color}20`,
      border: `1px solid ${color}40`,
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      fontWeight: 500,
      color: color
    }}>
      <span style={{fontSize: 14}}>{icon}</span>
      <span>{pickCount} picks · {confidence} confianza ({target - pickCount > 0 ? `+${target - pickCount} necesarios` : "Suficiente"})</span>
    </div>
  );
}

function KPIHero({ period }) {
  const k = ensureKPI(period);
  const equityVals = safeArray(window.DASH?.equity, []).map(e => safeNum(e?.v, 0));
  let slice = equityVals;
  if (period === "today") slice = equityVals.slice(-2);
  else if (period === "yest") slice = equityVals.slice(-3, -1);
  else if (period === "weekend") slice = equityVals.slice(-4);
  else if (period === "7d") slice = equityVals.slice(-7);
  else if (period === "month") slice = equityVals.slice(-10);

  const bankCurrent = safeNum(window.DASH?.bank?.current, 100);
  const bankDiff = safeNum(window.DASH?.bank?.diff, 0);
  const bankRoi = safeNum(window.DASH?.bank?.roi, 0);
  const kRoi = safeNum(k.roi, 0);
  const kProfit = safeNum(k.profit, 0);
  const kYld = safeNum(k.yld, 0);
  const kEdge = safeNum(k.edge, 0);
  const kWin = safeNum(k.win, 0);
  const kPicks = Math.max(0, Math.round(k.picks || 0));
  const liveCt = safeArray(window.DASH?.livePicks, []).length;

  return (
    <>
      <ConfidenceBadge pickCount={safeNum(window.DASH?.meta?.totalPicks, 67)} />
      <div className="kpi-grid">
        <KPICard
          label="Banca actual" featured
          value={bankCurrent.toFixed(2)} unit="€"
          delta={{ v: bankDiff, pct: bankRoi }}
          sub={`Inicial 100€ · ${bankDiff > 0 ? "+" : ""}${bankDiff.toFixed(2)}€`}
          spark={equityVals} sparkColor="#ff5c7a"
        />
        <KPICard
          label={`ROI ${labelFor(period)}`}
          value={`${kRoi > 0 ? "+" : ""}${kRoi.toFixed(1)}`} unit="%"
          sub={`${kProfit > 0 ? "+" : ""}${kProfit.toFixed(2)}€ · ${kPicks} picks`}
          spark={slice} sparkColor={kRoi >= 0 ? "var(--green)" : "var(--red)"}
          danger={kRoi < 0}
        />
        <KPICard
          label="Yield / Edge medio"
          value={`${kYld > 0 ? "+" : ""}${kYld.toFixed(1)}`} unit="%"
          sub={<span>edge medio <b className="mono" style={{color:"var(--text-2)"}}>{kEdge.toFixed(1)}pp</b></span>}
        />
        <KPICard
          label="% Acierto"
          value={kWin} unit="%"
          sub={<span><WLStrip w={Math.round(kPicks * kWin / 100)} l={Math.max(0, kPicks - Math.round(kPicks * kWin / 100))} max={14}/></span>}
        />
        <KPICard
          label="Picks en juego hoy"
          value={liveCt} unit=""
          sub={<span className="green" style={{fontWeight:600}}>EN VIVO · próx 13:00</span>}
        />
      </div>
    </>
  );
}
function labelFor(p) {
  return ({ today: "hoy", yest: "ayer", weekend: "fin sem.", "7d": "7d", month: "mes", since: "desde 23-ABR", hist: "histórico" })[p] || p;
}

/* ============== LIVE PICKS ============== */
function LivePicks() {
  const picks = safeArray(D?.livePicks, []);
  if (picks.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)" }}>
        <div style={{ fontSize: 13 }}>Sin picks en vivo para hoy</div>
      </div>
    );
  }
  return (
    <div className="picks-grid">
      {picks.map((p, i) => {
        const conf = Math.max(0, Math.min(3, Math.round(p?.conf || 1)));
        const odds = safeNum(p?.odds, 1.0);
        return (
          <div className="pick" key={i}>
            <div className="pick-time">⏱ {p?.time || "—"}</div>
            <div className="pick-top">
              <span className="pick-league">{p?.league || "?"}</span>
              <span className="pick-conf">
                <span className="stars">{"★".repeat(conf + 1)}</span>
                {conf >= 1 ? "ALTA" : "MEDIA"}
              </span>
            </div>
            <div className="pick-match">
              {p?.home || "?"} <span className="text-3">vs</span> {p?.away || "?"}
            </div>
            <div className="pick-bet">
              <span className="pick-market">{p?.market || "?"}</span>
              <span className="pick-odds">@ {odds.toFixed(2)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============== HEATMAP PANEL (reusable) ============== */
function HeatmapPanel({ title, sub, rows, cols, matrix, selected, setSelected, disabled }) {
  // Validar datos
  const safeRows = safeArray(rows, []);
  const safeCols = safeArray(cols, []);
  const safeMatrix = safeArray(matrix, []);

  // Compute summary
  let totalN = 0, totalROI = 0, posCells = 0, negCells = 0;
  if (safeMatrix.length > 0) {
    safeMatrix.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(c => {
          if (c && typeof c === "object") {
            const n = safeNum(c.n, 0);
            const roi = safeNum(c.roi, 0);
            totalN += n;
            totalROI += roi * n;
            if (roi > 0) posCells++;
            else if (roi < 0) negCells++;
          }
        });
      }
    });
  }
  const wAvg = totalN ? totalROI / totalN : 0;

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>🔥 {title}</h3>
        <span className="sub">{sub}</span>
        <div className="right">
          <span className="chip" style={{background:"var(--bg-2)"}}>
            <span className="green">●</span><span className="mono">{posCells}</span>
            <span className="text-3" style={{margin:"0 4px"}}>·</span>
            <span className="red">●</span><span className="mono">{negCells}</span>
          </span>
          <div className="hm-legend">
            <span className="lbl">−30%</span>
            <div className="scale"></div>
            <span className="lbl">+30%</span>
          </div>
        </div>
      </div>
      <div className="panel-body" style={{paddingBottom: 12}}>
        <Heatmap rows={safeRows} cols={safeCols} matrix={safeMatrix}
                 selected={selected} onSelect={setSelected}
                 disabled={disabled}/>
        {selected && (
          <div style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "var(--bg-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: 8,
            display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap"
          }}>
            <div>
              <div className="text-3" style={{fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600}}>Selección</div>
              <div style={{fontWeight: 600, fontSize: 14, marginTop: 2}}>{selected.league} <span className="text-3" style={{margin:"0 6px"}}>×</span> {selected.market}</div>
            </div>
            <div>
              <div className="text-3" style={{fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600}}>ROI</div>
              <div className={"mono " + (selected.roi >= 0 ? "green" : "red")} style={{fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em"}}>
                {selected.roi > 0 ? "+" : ""}{selected.roi}%
              </div>
            </div>
            <div>
              <div className="text-3" style={{fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600}}>Volumen</div>
              <div className="mono" style={{fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em"}}>n={selected.n}</div>
            </div>
            <div style={{marginLeft:"auto", display:"flex", gap:8}}>
              <button onClick={() => setSelected(null)} style={{background:"transparent", color:"var(--text-2)", border:"1px solid var(--border-strong)", padding:"7px 12px", borderRadius:7, fontSize:12, fontWeight:500}}>
                Cerrar
              </button>
              <button style={{background:"var(--surface-hover)", color:"var(--text)", border:"1px solid var(--border-strong)", padding:"7px 12px", borderRadius:7, fontSize:12, fontWeight:600}}>
                Ver picks ({selected.n}) →
              </button>
            </div>
          </div>
        )}
        <div style={{
          marginTop: selected ? 12 : 14,
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
          display: "flex", gap: 24, fontSize: 12, color: "var(--text-3)"
        }}>
          <div><span className="text-3">Total muestra:</span> <span className="mono" style={{color:"var(--text)", fontWeight:600}}>{totalN} picks</span></div>
          <div><span className="text-3">ROI ponderado:</span> <span className={"mono " + (wAvg>=0?"green":"red")} style={{fontWeight:600}}>{wAvg>0?"+":""}{wAvg.toFixed(1)}%</span></div>
          <div><span className="text-3">Celdas verdes:</span> <span className="mono green" style={{fontWeight:600}}>{posCells}</span> <span className="text-3">·</span> <span className="text-3">rojas:</span> <span className="mono red" style={{fontWeight:600}}>{negCells}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ============== TABLES ============== */
function maxOf(arr, key) { return Math.max(...arr.map(r => r[key])); }

function LeagueTable({ disabled, onToggle, rows }) {
  const actualRows = rows || window.DASH?.byLeague || [];
  const max = maxOf(actualRows, "total");
  const cols = [
    { key: "name", label: "Liga", render: r => (
        <div style={{display:"flex", alignItems:"center", gap:9}}>
          <StatusDot status={r.status}/>
          <div>
            <div style={{fontWeight:500}}>{r.name}</div>
            {r.country && <div className="text-3" style={{fontSize:10.5}}>{r.country}</div>}
          </div>
        </div>
    )},
    { key: "total", label: "Picks", width: 110, render: r => <VolumeCell value={r.total} max={max}/> },
    { key: "winPct", label: "Resultado", width: 170, render: r => <ResultCell w={r.w} l={r.l} winPct={r.winPct}/> },
    { key: "roi", label: "ROI", align: "right", width: 170, render: r => <ROICell value={r.roi}/> },
    { key: "eur", label: "PnL", align: "right", width: 80, render: r => fmtEur(r.eur) },
    { key: "status", label: "", align: "center", width: 110, sortable: false, render: r => <StatusChip status={r.status}/> },
  ];
  return (
    <DataTable rows={actualRows} cols={cols} defaultSort={{key:"roi", dir:"desc"}}
               onToggle={onToggle} isOn={r => !disabled.has(r.name)}
               rowKey={r => r.name}
               disabledRow={r => disabled.has(r.name)}/>
  );
}

function MarketTable({ disabled, onToggle, rows }) {
  const actualRows = rows || window.DASH?.byMarket || [];
  const max = maxOf(actualRows, "total");
  const cols = [
    { key: "name", label: "Mercado", render: r => (
        <div style={{display:"flex", alignItems:"center", gap:9}}>
          <StatusDot status={r.status}/>{r.name}
        </div>
    )},
    { key: "total", label: "Picks", width: 110, render: r => <VolumeCell value={r.total} max={max}/> },
    { key: "winPct", label: "Resultado", width: 170, render: r => <ResultCell w={r.w} l={r.l} winPct={r.winPct}/> },
    { key: "roi", label: "ROI", align: "right", width: 170, render: r => <ROICell value={r.roi}/> },
    { key: "eur", label: "PnL", align: "right", width: 80, render: r => fmtEur(r.eur) },
    { key: "status", label: "", align: "center", width: 110, sortable: false, render: r => <StatusChip status={r.status}/> },
  ];
  return (
    <DataTable rows={actualRows} cols={cols} defaultSort={{key:"roi", dir:"desc"}}
               onToggle={onToggle} isOn={r => !disabled.has(r.name)}
               rowKey={r => r.name}
               disabledRow={r => disabled.has(r.name)}/>
  );
}

function OddsTable({ disabled, onToggle, rows }) {
  const actualRows = rows || window.DASH?.byOdds || [];
  const max = maxOf(actualRows, "total");
  const cols = [
    { key: "name", label: "Rango de Cuota", render: r => (
        <div style={{display:"flex", alignItems:"center", gap:9}}>
          <StatusDot status={r.status}/><span style={{fontWeight:500}}>{r.name}</span>
        </div>
    )},
    { key: "total", label: "Picks", width: 130, render: r => <VolumeCell value={r.total} max={max}/> },
    { key: "winPct", label: "Resultado", width: 200, render: r => <ResultCell w={r.w} l={r.l} winPct={r.winPct}/> },
    { key: "roi", label: "ROI", align: "right", width: 200, render: r => <ROICell value={r.roi}/> },
    { key: "eur", label: "PnL", align: "right", width: 100, render: r => fmtEur(r.eur) },
    { key: "status", label: "", align: "center", width: 110, sortable: false, render: r => <StatusChip status={r.status}/> },
  ];
  return (
    <DataTable rows={actualRows} cols={cols} defaultSort={{key:"roi", dir:"desc"}}
               onToggle={onToggle} isOn={r => !disabled.has(r.name)}
               rowKey={r => r.name}
               disabledRow={r => disabled.has(r.name)}/>
  );
}

function CornersTable({ disabled, onToggle, rows }) {
  const actualRows = rows || window.DASH?.byCorners || [];
  if (!actualRows || actualRows.length === 0) {
    return (
      <div className="panel">
        <div className="panel-h"><h3>🔄 Análisis de Corners</h3></div>
        <div className="panel-body"><div className="empty">Sin datos de corners</div></div>
      </div>
    );
  }
  const max = maxOf(actualRows, "total");
  const cols = [
    { key: "name", label: "Línea", render: r => (
        <div style={{display:"flex", alignItems:"center", gap:9}}>
          <StatusDot status={r.status}/>{r.name}
        </div>
    )},
    { key: "total", label: "Picks", width: 110, render: r => <VolumeCell value={r.total} max={max}/> },
    { key: "winPct", label: "Resultado", width: 170, render: r => <ResultCell w={r.w} l={r.l} winPct={r.winPct}/> },
    { key: "roi", label: "ROI", align: "right", width: 170, render: r => <ROICell value={r.roi}/> },
    { key: "eur", label: "PnL", align: "right", width: 80, render: r => fmtEur(r.eur) },
    { key: "status", label: "", align: "center", width: 110, sortable: false, render: r => <StatusChip status={r.status}/> },
  ];
  return (
    <DataTable rows={actualRows} cols={cols} defaultSort={{key:"roi", dir:"desc"}}
               onToggle={onToggle} isOn={r => !disabled.has(r.name)}
               rowKey={r => r.name}
               disabledRow={r => disabled.has(r.name)}/>
  );
}

function ReasonTable() {
  const reasonRows = window.DASH?.byReason || [];
  const max = maxOf(reasonRows, "total");
  const cols = [
    { key: "name", label: "Motivo", render: r => (
        <div style={{display:"flex", alignItems:"center", gap:9}}>
          <span style={{fontSize:14}}>{r.icon}</span>{r.name}
        </div>
    )},
    { key: "total", label: "Picks", width: 110, render: r => <VolumeCell value={r.total} max={max}/> },
    { key: "winPct", label: "Resultado", width: 170, render: r => <ResultCell w={r.w} l={r.l} winPct={r.winPct}/> },
    { key: "roi", label: "ROI", align: "right", width: 170, render: r => <ROICell value={r.roi}/> },
    { key: "eur", label: "PnL", align: "right", width: 80, render: r => fmtEur(r.eur) },
  ];
  return <DataTable rows={reasonRows} cols={cols} defaultSort={{key:"total", dir:"desc"}}/>;
}

/* ============== MODEL HEALTH PANEL (TIER 3) ============== */
function ModelHealthPanel() {
  const periods = [
    { key: "today", label: "Hoy", picks: safeNum(ensureKPI("today").picks, 0), roi: safeNum(ensureKPI("today").roi, 0) },
    { key: "yest", label: "Ayer", picks: safeNum(ensureKPI("yest").picks, 0), roi: safeNum(ensureKPI("yest").roi, 0) },
    { key: "7d", label: "Últimos 7d", picks: safeNum(ensureKPI("7d").picks, 0), roi: safeNum(ensureKPI("7d").roi, 0) },
    { key: "month", label: "Este mes", picks: safeNum(ensureKPI("month").picks, 0), roi: safeNum(ensureKPI("month").roi, 0) },
    { key: "hist", label: "Histórico", picks: safeNum(ensureKPI("hist").picks, 0), roi: safeNum(ensureKPI("hist").roi, 0) }
  ];

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>🏥 Salud del Modelo</h3>
        <span className="sub">ROI por período · confianza estadística</span>
      </div>
      <div className="panel-body">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)" }}>
            <tr>
              <td style={{ padding: "10px 12px", textAlign: "left" }}>Período</td>
              <td style={{ padding: "10px 12px", textAlign: "center" }}>Picks</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>ROI</td>
              <td style={{ padding: "10px 12px", textAlign: "center" }}>Confianza</td>
            </tr>
          </thead>
          <tbody>
            {periods.map(p => {
              const confidence = p.picks >= 100 ? "Alto" : p.picks >= 50 ? "Medio" : "Bajo";
              const color = p.picks >= 100 ? "#22c55e" : p.picks >= 50 ? "#eab308" : "#ef4444";
              const roiColor = p.roi >= 0 ? "#22c55e" : "#ef4444";
              return (
                <tr key={p.key} style={{ borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <td style={{ padding: "12px 12px", fontWeight: 500 }}>{p.label}</td>
                  <td style={{ padding: "12px 12px", textAlign: "center", color: "var(--text-2)" }}><span className="mono">{Math.round(p.picks)}</span></td>
                  <td style={{ padding: "12px 12px", textAlign: "right", color: roiColor, fontWeight: 600 }}><span className="mono">{p.roi > 0 ? "+" : ""}{p.roi.toFixed(1)}%</span></td>
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: `${color}20`,
                      border: `1px solid ${color}40`,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: color
                    }}>
                      {confidence}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
          fontSize: 12,
          color: "var(--text-3)",
          lineHeight: "1.6"
        }}>
          <div><strong style={{color:"var(--text)"}}>⚠ Diagnostico:</strong> Modelo muestra divergencia 7d/30d (-2.4% a -12.4% ROI). Posible drift en datos recientes. Acumula 100+ picks antes de tomar decisiones críticas.</div>
        </div>
      </div>
    </div>
  );
}

/* ============== RANKING PANEL (Liga / Mercado / Cuota) ============== */
function RankingPanel({ pd, title = "Ranking por filtro", sub = "ROI · ordenado por valor", topN = 8 }) {
  const [tab, setTab] = useStateV("league");
  const lg = [...pd.byLeague].filter(r => r.total >= 5).slice(0, topN).sort((a,b)=>b.roi-a.roi);
  const mk = [...pd.byMarket].filter(r => r.total >= 5).slice(0, topN).sort((a,b)=>b.roi-a.roi);
  const od = [...pd.byOdds].sort((a,b)=>b.roi-a.roi);
  const rows = tab === "league" ? lg : tab === "market" ? mk : od;
  const max = tab === "odds" ? 10 : 30;
  return (
    <div className="panel">
      <div className="panel-h">
        <h3>🏆 {title}</h3>
        <span className="sub">{sub}</span>
        <div className="right">
          <div className="tabs">
            <button className={tab==="league"?"active":""} onClick={()=>setTab("league")}>Liga</button>
            <button className={tab==="market"?"active":""} onClick={()=>setTab("market")}>Mercado</button>
            <button className={tab==="odds"?"active":""} onClick={()=>setTab("odds")}>Cuota</button>
          </div>
        </div>
      </div>
      <div className="panel-body">
        {rows.length ? (
          <RankedBars rows={rows} max={max}/>
        ) : (
          <div className="empty">Sin muestra suficiente para este período</div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  KPICard, KPIHero, ConfidenceBadge, ModelHealthPanel, LivePicks, HeatmapPanel, RankingPanel,
  LeagueTable, MarketTable, OddsTable, CornersTable, ReasonTable,
});
