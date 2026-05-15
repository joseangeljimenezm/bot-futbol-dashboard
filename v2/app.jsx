// Main app shell

const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA } = React;
const D2 = window.DASH;

function Logo() {
  return (
    <div className="logo-area">
      <div className="logo-mark">VB</div>
      <div className="logo-text">
        Value Betting Bot
        <small>Dashboard</small>
      </div>
    </div>
  );
}

const PERIODS = [
  { k: "today", l: "Hoy" },
  { k: "yest", l: "Ayer" },
  { k: "weekend", l: "Fin sem." },
  { k: "7d", l: "7d" },
  { k: "month", l: "Mes" },
  { k: "since", l: "Desde 23-ABR", star: true },
  { k: "hist", l: "Histórico" },
];

function TopBar({ period, setPeriod, tab }) {
  const tabName = ({picks:"Picks Reales", virtual:"Análisis Virtual", shadow:"Modo Sombra"})[tab];
  let updatedTime = "—";
  try {
    const dt = new Date(D2.meta.generated_at);
    const d = dt.getDate().toString().padStart(2,"0");
    const m = (dt.getMonth()+1).toString().padStart(2,"0");
    const y = dt.getFullYear();
    const h = dt.getHours().toString().padStart(2,"0");
    const min = dt.getMinutes().toString().padStart(2,"0");
    updatedTime = `${d}/${m}/${y} · ${h}:${min}`;
  } catch (e) {}
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="crumb">Dashboard <span className="text-3">/</span> <b>{tabName}</b></div>
        <span className="live-dot">en producción</span>
      </div>
      <div className="period-toggle">
        {PERIODS.map(p => (
          <button key={p.k} className={period === p.k ? "active" : ""}
                  onClick={() => setPeriod(p.k)}>
            {p.star && <span className="star">★</span>}{p.l}
          </button>
        ))}
      </div>
      <span className="updated-at">{updatedTime}</span>
      <button className="icon-btn" title="Exportar">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className="icon-btn" title="Ajustes">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M8 1v2m0 10v2M1 8h2m10 0h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function Nav({ tab, setTab }) {
  const items = [
    { k: "picks", l: "Picks Reales", icon: "⚽", badge: "5", badgeCls: "green" },
    { k: "virtual", l: "Análisis Virtual", icon: "🔬", badge: "362" },
    { k: "shadow", l: "Modo Sombra", icon: "👁", badge: "113" },
    { k: "cross", l: "Análisis Cruzado", icon: "🔍", badge: null },
  ];
  return (
    <nav className="nav">
      <div className="nav-section-label">Cockpit</div>
      {items.map(i => (
        <button key={i.k} className={"nav-item" + (tab === i.k ? " active" : "")}
                onClick={() => setTab(i.k)}>
          <span className="icon">{i.icon}</span>
          <span>{i.l}</span>
          {i.badge && <span className={"badge " + (i.badgeCls || "")}>{i.badge}</span>}
        </button>
      ))}
      <div className="nav-section-label">Control</div>
      <button className="nav-item">
        <span className="icon">⚙</span>
        <span>Configuración</span>
      </button>
      <button className="nav-item">
        <span className="icon">🔑</span>
        <span>API</span>
        <span className="badge">99%</span>
      </button>

      <div style={{marginTop:"auto", padding:"14px 10px 4px", borderTop:"1px solid var(--border)", marginLeft:-12, marginRight:-12, paddingLeft:22, paddingRight:22}}>
        <div className="text-3" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, fontWeight:600}}>Créditos API</div>
        <div className="row" style={{justifyContent:"space-between"}}>
          <span className="mono" style={{fontSize:14, fontWeight:600}}>{D2.api.used.toLocaleString("es")}</span>
          <span className="text-3 mono" style={{fontSize:11.5}}>/ {D2.api.total.toLocaleString("es")}</span>
        </div>
        <div style={{height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, marginTop:6, overflow:"hidden"}}>
          <div style={{width: `${(D2.api.used/D2.api.total)*100}%`, height:"100%", background:"var(--green)"}}></div>
        </div>
      </div>
    </nav>
  );
}

function PeriodChip({ period }) {
  const lbl = ({today:"Hoy", yest:"Ayer", weekend:"Fin de semana", "7d":"Últimos 7d", month:"Último mes", since:"Desde 23-ABR", hist:"Histórico"})[period];
  return (
    <span className="chip" style={{background:"rgba(106,166,255,0.1)", color:"var(--blue)", borderColor:"rgba(106,166,255,0.25)"}}>
      <span className="dot"></span>período: {lbl}
    </span>
  );
}

/* ============== IMPACT BANNER ============== */
function ImpactBanner({ impact, onApply, onDiscard }) {
  if (!impact) return null;
  const better = impact.deltaROI > 0;
  return (
    <div className="impact">
      <div>
        <div className="imp-label">Simulación de impacto</div>
        <div className="imp-cmp">aplicando los cambios actuales sobre el período seleccionado</div>
      </div>
      <div style={{marginLeft: "auto", display:"flex", gap:22, alignItems:"center"}}>
        <div>
          <div className="imp-label">ROI</div>
          <div className="imp-val">
            <span className="text-3">{D2.bank.roi.toFixed(1)}%</span>
            <span className="text-3" style={{margin:"0 6px", fontSize:14}}>→</span>
            <span className={better ? "green" : "red"}>
              {impact.newROI > 0 ? "+" : ""}{impact.newROI.toFixed(1)}%
            </span>
          </div>
        </div>
        <div>
          <div className="imp-label">PnL</div>
          <div className="imp-val">
            <span className={better ? "green" : "red"}>
              {impact.newPnL > 0 ? "+" : ""}{impact.newPnL.toFixed(2)}€
            </span>
          </div>
        </div>
        <div>
          <div className="imp-label">Picks</div>
          <div className="imp-val">{impact.picks}</div>
        </div>
      </div>
      <button className="ghost" onClick={onDiscard}>Descartar</button>
      <button onClick={onApply}>Aplicar</button>
    </div>
  );
}

/* ============== ACTIVATION PANEL ============== */
function ActivationPanel({ tblTab, setTblTab, disabled, pd, onToggleLeague, onToggleMarket, onToggleOdds, onToggleCorners, title = "Activación de filtros", sub = "toggle = activar/desactivar · ordena haciendo click en columna" }) {
  return (
    <div className="panel">
      <div className="panel-h">
        <h3>🛠 {title}</h3>
        <span className="sub">{sub}</span>
        <div className="right">
          <div className="tabs">
            <button className={tblTab==="league"?"active":""} onClick={()=>setTblTab("league")}>Liga</button>
            <button className={tblTab==="market"?"active":""} onClick={()=>setTblTab("market")}>Mercado</button>
            <button className={tblTab==="odds"?"active":""} onClick={()=>setTblTab("odds")}>Cuota</button>
            <button className={tblTab==="corners"?"active":""} onClick={()=>setTblTab("corners")}>Corners</button>
          </div>
        </div>
      </div>
      <div className="panel-body flush">
        <div style={{maxHeight: 440, overflowY: "auto"}}>
          {tblTab === "league" && <LeagueTable rows={pd.byLeague} disabled={disabled.leagues} onToggle={onToggleLeague}/>}
          {tblTab === "market" && <MarketTable rows={pd.byMarket} disabled={disabled.markets} onToggle={onToggleMarket}/>}
          {tblTab === "odds" && <OddsTable rows={pd.byOdds} disabled={disabled.odds} onToggle={onToggleOdds}/>}
          {tblTab === "corners" && <CornersTable rows={pd.byCorners} disabled={disabled.corners} onToggle={onToggleCorners}/>}
        </div>
      </div>
    </div>
  );
}

/* ============== TAB: PICKS ============== */
function PicksTab({ period, pd, disabled, onToggleLeague, onToggleMarket, onToggleOdds, onToggleCorners }) {
  const [hmSel, setHmSel] = useStateA(null);
  const [tblTab, setTblTab] = useStateA("league");
  const totalPicks = pd.byLeague.reduce((s,r)=>s+r.total, 0);

  return (
    <>
      <div className="page-header">
        <h2>⚽ Picks Reales</h2>
        <span className="chip green"><span className="dot"></span>EN PRODUCCIÓN</span>
        <PeriodChip period={period}/>
        <span className="sub" style={{marginLeft:"auto"}}>{totalPicks} picks · stake fijo 0.21€</span>
      </div>

      <KPIHero period={period} />

      <div className="row-2">
        <div className="panel">
          <div className="panel-h">
            <h3>📈 Evolución de banca</h3>
            <span className="sub">{D2.bank.diff > 0 ? "+" : ""}{D2.bank.diff.toFixed(2)}€ · ROI {D2.bank.roi.toFixed(1)}%</span>
          </div>
          <div className="panel-body">
            <EquityCurve data={D2.equity} initial={D2.bank.initial} height={260}/>
          </div>
        </div>
        <div className="panel">
          <div className="panel-h">
            <h3>🎯 En juego hoy</h3>
            <span className="sub">{D2.livePicks.length} picks</span>
          </div>
          <div className="panel-body" style={{padding: 12}}>
            <LivePicks/>
          </div>
        </div>
      </div>

      <div className="row-12">
        <HeatmapPanel
          title="Heatmap Liga × Mercado"
          sub="ROI % y volumen por celda · click para detalle"
          rows={D2.hmLeagues} cols={D2.hmMarkets} matrix={pd.heatmap}
          selected={hmSel} setSelected={setHmSel}
          disabled={new Set([...disabled.leagues])}
        />
      </div>

      <div className="row-2">
        <RankingPanel pd={pd} title="Ranking · top 8" sub="ordenado por ROI · cambia entre Liga / Mercado / Cuota"/>
        <div className="panel">
          <div className="panel-h">
            <h3>📅 Últimos 30 días</h3>
            <span className="sub">verde = día ganador</span>
          </div>
          <div className="panel-body" style={{display:"flex", flexDirection:"column", gap:18}}>
            <DailyStrip days={D2.dailyResults}/>
            <div style={{display:"flex", gap:24, paddingTop:14, borderTop:"1px solid var(--border)"}}>
              <div>
                <div className="text-3" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>Drawdown</div>
                <div className={`mono ${D2.drawdown < -5 ? "red" : "amber"}`} style={{fontSize:22, fontWeight:700, letterSpacing:"-0.02em"}}>{D2.drawdown}%</div>
              </div>
              <div>
                <div className="text-3" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>Racha actual</div>
                <div className={`mono ${D2.currentStreak.type === "W" ? "green" : "red"}`} style={{fontSize:22, fontWeight:700, letterSpacing:"-0.02em"}}>{D2.currentStreak.status}</div>
              </div>
              <div>
                <div className="text-3" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>Mejor racha</div>
                <div className={`mono ${D2.bestStreak.type === "W" ? "green" : "red"}`} style={{fontSize:22, fontWeight:700, letterSpacing:"-0.02em"}}>{D2.bestStreak.status}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivationPanel
        tblTab={tblTab} setTblTab={setTblTab}
        pd={pd} disabled={disabled}
        onToggleLeague={onToggleLeague}
        onToggleMarket={onToggleMarket}
        onToggleOdds={onToggleOdds}
        onToggleCorners={onToggleCorners}
      />
    </>
  );
}

/* ============== TAB: VIRTUAL ============== */
function VirtualTab({ period, pd, disabled, onToggleLeague, onToggleMarket, onToggleOdds, onToggleCorners }) {
  const [hmSel, setHmSel] = useStateA(null);
  const [tblTab, setTblTab] = useStateA("league");

  const totalRej = pd.byLeague.reduce((s,r)=>s+r.total,0);
  const totalN = totalRej || 1;
  const wRoi = pd.byLeague.reduce((s,r)=>s+r.roi*r.total,0)/totalN;
  const wEur = pd.byLeague.reduce((s,r)=>s+r.eur,0);

  const cards = [
    { l: "Total rechazados", v: totalRej, u: "" },
    { l: "ROI virtual", v: wRoi, u: "%", danger: wRoi < 0 },
    { l: "PnL virtual", v: wEur, u: "€", danger: wEur < 0 },
    { l: "Mejor liga", custom: true },
  ];

  const bestLeague = [...pd.byLeague].filter(r=>r.total>=5).sort((a,b)=>b.roi-a.roi)[0];

  return (
    <>
      <div className="page-header">
        <h2>🚫 Análisis Virtual</h2>
        <span className="chip blue"><span className="dot"></span>SIN RIESGO</span>
        <PeriodChip period={period}/>
        <span className="sub" style={{marginLeft:"auto"}}>picks fuera de rango · qué dejaste fuera y si valdría reactivarlo</span>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        <KPICard label="Total rechazados" value={totalRej} unit=""
          sub={`${pd.byLeague.length} ligas · ${pd.byMarket.length} mercados`}/>
        <KPICard label="ROI virtual" danger={wRoi<0}
          value={`${wRoi>0?"+":""}${wRoi.toFixed(1)}`} unit="%"/>
        <KPICard label="PnL virtual" danger={wEur<0}
          value={`${wEur>0?"+":""}${wEur.toFixed(2)}`} unit="€"/>
        <KPICard label="Mejor liga rechazada"
          value={bestLeague?bestLeague.name.length>11?bestLeague.name.slice(0,11)+"…":bestLeague.name:"—"} unit=""
          sub={bestLeague?<><span className="green" style={{fontWeight:600}}>+{bestLeague.roi}%</span> · n={bestLeague.total}</>:"sin datos"}/>
      </div>

      <div className="row-12">
        <HeatmapPanel
          title="Heatmap Liga × Mercado · rechazados"
          sub="dónde estaríamos ganando si activáramos"
          rows={D2.hmLeagues} cols={D2.hmMarkets} matrix={pd.heatmap}
          selected={hmSel} setSelected={setHmSel}/>
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-h">
            <h3>🏷️ Por motivo de rechazo</h3>
            <span className="sub">qué filtro está dejando fuera más picks</span>
          </div>
          <div className="panel-body flush">
            <ReasonTable rows={pd.byReason}/>
          </div>
        </div>
        <RankingPanel pd={pd} title="Ranking rechazados" sub="por ROI virtual · top 8"/>
      </div>

      <ActivationPanel
        tblTab={tblTab} setTblTab={setTblTab}
        pd={pd} disabled={disabled}
        onToggleLeague={onToggleLeague}
        onToggleMarket={onToggleMarket}
        onToggleOdds={onToggleOdds}
        onToggleCorners={onToggleCorners}
        title="Activar filtros rechazados"
        sub="🟢 activar · 🟡 acumular · 🔴 mantener fuera"
      />
    </>
  );
}

/* ============== TAB: SHADOW ============== */
function ShadowTab({ period, pd }) {
  const [hmSel, setHmSel] = useStateA(null);
  const [tblTab, setTblTab] = useStateA("league");
  const sb = pd.shadowBasket;
  const sf = pd.shadowFootball;
  // Combine shadow league + market data into a synthetic "pd" for the ranking panel.
  const shadowPd = {
    byLeague: [...sb.leagues, ...sf.leagues],
    byMarket: sf.markets,
    byOdds: pd.byOdds, // odds blocks not split shadow-only; reuse virtual approximation
  };

  return (
    <>
      <div className="page-header">
        <h2>👁 Modo Sombra</h2>
        <span className="chip"><span className="dot"></span>0€ RIESGO</span>
        <PeriodChip period={period}/>
        <span className="sub" style={{marginLeft:"auto"}}>calibración paralela · objetivo 50+ picks por liga</span>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        <KPICard label="Basket — picks" value={sb.total} unit=""
          sub={<><span className={sb.roi>=0?"green":"red"} style={{fontWeight:600}}>{sb.roi>0?"+":""}{sb.roi.toFixed(1)}%</span> ROI · {sb.pnl.toFixed(2)}€</>}/>
        <KPICard label="Basket — falta calibrar" value={Math.max(0, 150-sb.total)} unit=""
          sub={<>para 150 picks objetivo</>}/>
        <KPICard label="Fútbol filtrado — picks" value={sf.total} unit=""
          danger
          sub={<><span className={sf.roi>=0?"green":"red"} style={{fontWeight:600}}>{sf.roi>0?"+":""}{sf.roi.toFixed(1)}%</span> ROI · {sf.pnl.toFixed(2)}€</>}/>
        <KPICard label="Total muestra sombra" value={sb.total + sf.total} unit=""
          sub={<>{sb.pending + sf.pending} pendientes</>}/>
      </div>

      <div className="row-12">
        <HeatmapPanel
          title="Heatmap sombra · Liga × Mercado"
          sub="picks no-jugados · sólo análisis"
          rows={D2.hmLeaguesShadow} cols={D2.hmMarketsShadow} matrix={pd.heatmapShadow}
          selected={hmSel} setSelected={setHmSel}/>
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-h">
            <h3>🏀 Basket</h3>
            <span className="sub">NBA · Euroleague</span>
            <div className="right">
              <span className="chip red"><span className="dot"></span>{sb.roi.toFixed(1)}% ROI</span>
            </div>
          </div>
          <div className="panel-body flush">
            <DataTable rows={sb.leagues}
              cols={[
                { key:"name", label:"Liga", render: r => <span style={{fontWeight:500}}>{r.icon} {r.name}</span>},
                { key:"total", label:"Picks", width:90, render: r => <VolumeCell value={r.total} max={Math.max(...sb.leagues.map(x=>x.total),1)}/> },
                { key:"winPct", label:"Resultado", width:160, render: r => <ResultCell w={r.w} l={r.l} winPct={r.winPct}/>},
                { key:"roi", label:"ROI", align:"right", width:170, render: r => <ROICell value={r.roi} max={50}/>},
                { key:"eur", label:"PnL", align:"right", width:80, render: r => fmtEur(r.eur)},
              ]} defaultSort={{key:"total", dir:"desc"}}/>
          </div>
        </div>
        <RankingPanel pd={shadowPd} title="Ranking sombra" sub="liga · mercado · cuota"/>
      </div>

      <div className="panel" style={{marginTop:12}}>
        <div className="panel-h">
          <h3>⚽ Fútbol filtrado · mercados sombra</h3>
          <span className="sub">resultado por mercado</span>
          <div className="right">
            <span className="chip red"><span className="dot"></span>{sf.roi.toFixed(1)}% ROI</span>
          </div>
        </div>
        <div className="panel-body flush">
          <DataTable rows={sf.markets}
            cols={[
              { key:"name", label:"Mercado", render: r => <span><StatusDot status={r.status}/>{r.name}</span>},
              { key:"total", label:"Picks", width: 110, render: r => <VolumeCell value={r.total} max={Math.max(...sf.markets.map(x=>x.total),1)}/>},
              { key:"winPct", label:"Resultado", width: 170, render: r => <ResultCell w={r.w} l={r.l} winPct={r.winPct}/>},
              { key:"roi", label:"ROI", align: "right", width: 200, render: r => <ROICell value={r.roi} max={150}/>},
              { key:"eur", label:"PnL", align: "right", width: 80, render: r => fmtEur(r.eur)},
              { key:"status", label:"", align: "center", width: 110, sortable:false, render: r => <StatusChip status={r.status}/>},
            ]} defaultSort={{key:"total", dir:"desc"}}/>
        </div>
      </div>
    </>
  );
}

/* ============== APP ============== */
function App() {
  const [tab, setTab] = useStateA("picks");
  const [period, setPeriod] = useStateA("since");
  const [disabled, setDisabled] = useStateA({
    leagues: new Set(), markets: new Set(), odds: new Set(), corners: new Set(),
  });
  const [impact, setImpact] = useStateA(null);

  // SCALED data for current period — flows into every panel
  const pd = useMemoA(() => D2.getPeriod(period), [period]);

  function toggleIn(group) {
    return (key) => {
      setDisabled(d => {
        const next = new Set(d[group]);
        if (next.has(key)) next.delete(key); else next.add(key);
        return { ...d, [group]: next };
      });
    };
  }
  const onToggleLeague = toggleIn("leagues");
  const onToggleMarket = toggleIn("markets");
  const onToggleOdds = toggleIn("odds");
  const onToggleCorners = toggleIn("corners");

  useEffectA(() => {
    const total = disabled.leagues.size + disabled.markets.size + disabled.odds.size + disabled.corners.size;
    if (total === 0) { setImpact(null); return; }
    let kept = pd.byLeague.filter(r => !disabled.leagues.has(r.name));
    const keptMarkets = new Set(pd.byMarket.filter(r => !disabled.markets.has(r.name)).map(r=>r.name));
    const keptOdds = new Set(pd.byOdds.filter(r => !disabled.odds.has(r.name)).map(r=>r.name));
    const keptCorners = new Set(pd.byCorners.filter(r => !disabled.corners.has(r.name)).map(r=>r.name));
    const sumPicks = kept.reduce((s, r) => s + r.total, 0);
    const mktArr = pd.byMarket.filter(r => keptMarkets.has(r.name));
    const mktN = mktArr.reduce((s, r) => s + r.total, 0);
    const mktRoi = mktN ? mktArr.reduce((s, r) => s + r.roi * r.total, 0) / mktN : 0;
    const oddsArr = pd.byOdds.filter(r => keptOdds.has(r.name));
    const oddsN = oddsArr.reduce((s, r) => s + r.total, 0);
    const oddsRoi = oddsN ? oddsArr.reduce((s, r) => s + r.roi * r.total, 0) / oddsN : 0;
    const cornersArr = pd.byCorners.filter(r => keptCorners.has(r.name));
    const cornersN = cornersArr.reduce((s, r) => s + r.total, 0);
    const cornersRoi = cornersN ? cornersArr.reduce((s, r) => s + r.roi * r.total, 0) / cornersN : 0;
    const lgRoi = sumPicks ? kept.reduce((s, r) => s + r.roi * r.total, 0) / sumPicks : 0;
    const newROI = (lgRoi + mktRoi + oddsRoi + cornersRoi) / 4;
    const newPnL = (newROI / 100) * sumPicks * 0.21;
    setImpact({ newROI, newPnL, picks: sumPicks, deltaROI: newROI - D2.bank.roi });
  }, [disabled, pd]);

  function applyImpact() { setImpact(null); }
  function discardImpact() {
    setDisabled({ leagues: new Set(), markets: new Set(), odds: new Set(), corners: new Set() });
    setImpact(null);
  }

  return (
    <div className="app">
      <Logo/>
      <TopBar period={period} setPeriod={setPeriod} tab={tab}/>
      <Nav tab={tab} setTab={setTab}/>
      <main className="main">
        {tab === "picks" && <PicksTab period={period} pd={pd} disabled={disabled}
                                       onToggleLeague={onToggleLeague}
                                       onToggleMarket={onToggleMarket}
                                       onToggleOdds={onToggleOdds}
                                       onToggleCorners={onToggleCorners}/>}
        {tab === "virtual" && <VirtualTab period={period} pd={pd} disabled={disabled}
                                          onToggleLeague={onToggleLeague}
                                          onToggleMarket={onToggleMarket}
                                          onToggleOdds={onToggleOdds}
                                          onToggleCorners={onToggleCorners}/>}
        {tab === "shadow" && <ShadowTab period={period} pd={pd}/>}
        {tab === "cross" && <CrossAnalysisPanel period={period}/>}
        <ImpactBanner impact={impact} onApply={applyImpact} onDiscard={discardImpact}/>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
