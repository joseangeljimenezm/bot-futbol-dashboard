// Charts: pure SVG, no library

const { useState, useMemo, useRef, useEffect } = React;

/* ========== Sparkline ========== */
function Sparkline({ values, w = 70, h = 28, color = "var(--green)", fill = true }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => [i * stepX, h - ((v - min) / range) * (h - 2) - 1]);
  const d = points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = d + ` L${w},${h} L0,${h} Z`;
  const gid = `sp-${Math.random().toString(36).slice(2,8)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {fill && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="2.2" fill={color} />
    </svg>
  );
}

/* ========== Equity Curve ========== */
function EquityCurve({ data, initial = 100, height = 240 }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const [size, setSize] = useState({ w: 800, h: height });

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: height });
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [height]);

  const padL = 48, padR = 14, padT = 16, padB = 28;
  const { w, h } = size;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const values = data.map(d => d.v);
  const min = Math.min(...values, initial) - 1.2;
  const max = Math.max(...values, initial) + 1.2;
  const range = max - min || 1;

  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * innerW;
    const y = padT + (1 - (d.v - min) / range) * innerH;
    return { x, y, ...d };
  });

  const linePath = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L${pts[pts.length-1].x},${padT + innerH} L${pts[0].x},${padT + innerH} Z`;
  const initialY = padT + (1 - (initial - min) / range) * innerH;
  const lineColor = data[data.length-1].v >= initial ? "#1ed498" : "#ff5c7a";
  const areaId = data[data.length-1].v >= initial ? "eq-area-pos" : "eq-area";

  const yTicks = [min, min + range/2, max].map(v => ({
    v, y: padT + (1 - (v - min) / range) * innerH,
  }));
  const xTicks = pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1);

  function onMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let nearest = pts[0]; let dist = 1e9;
    pts.forEach(p => { const d = Math.abs(p.x - px); if (d < dist) { dist = d; nearest = p; } });
    setHover(nearest);
  }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height }}
         onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={h}>
        <defs>
          <linearGradient id="eq-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5c7a" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ff5c7a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="eq-area-pos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1ed498" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#1ed498" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={t.y} x2={w - padR} y2={t.y}
                  stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />
            <text x={padL - 8} y={t.y + 4} textAnchor="end"
                  fill="var(--text-3)" fontSize="11" fontFamily="var(--mono)">
              {t.v.toFixed(0)}€
            </text>
          </g>
        ))}

        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={h - 8} textAnchor="middle"
                fill="var(--text-3)" fontSize="11" fontFamily="var(--mono)">
            {t.d}
          </text>
        ))}

        <line x1={padL} y1={initialY} x2={w - padR} y2={initialY}
              stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
        <text x={w - padR - 4} y={initialY - 5} textAnchor="end"
              fill="var(--text-3)" fontSize="10" fontFamily="var(--mono)">
          inicial 100€
        </text>

        <path d={areaPath} fill={`url(#${areaId})`} />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {hover && (
          <g>
            <line x1={hover.x} y1={padT} x2={hover.x} y2={padT + innerH}
                  stroke="rgba(255,255,255,0.2)" />
            <circle cx={hover.x} cy={hover.y} r="4.5" fill={lineColor} stroke="#0c111c" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover && (
        <div style={{
          position: "absolute",
          left: Math.min(hover.x + 10, w - 140),
          top: Math.max(hover.y - 44, 4),
          background: "var(--bg-2)",
          border: "1px solid var(--border-strong)",
          borderRadius: 7,
          padding: "7px 10px",
          fontFamily: "var(--mono)",
          fontSize: 12,
          pointerEvents: "none",
          boxShadow: "var(--shadow)",
          minWidth: 120,
        }}>
          <div style={{color: "var(--text-3)", fontSize: 10}}>{hover.d}</div>
          <div style={{fontWeight: 600, fontSize: 14}}>{hover.v.toFixed(2)}€</div>
          <div style={{color: hover.v >= initial ? "var(--green)" : "var(--red)", fontSize: 11}}>
            {hover.v >= initial ? "+" : ""}{((hover.v - initial)).toFixed(2)}€ · {((hover.v / initial - 1) * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== Daily PnL strip ========== */
function DailyStrip({ days }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 36 }}>
      {days.map((d, i) => {
        const height = d === 0 ? 4 : 8 + Math.abs(d) * 14;
        const bg = d > 0 ? "var(--green)" : d < 0 ? "var(--red)" : "rgba(255,255,255,0.12)";
        return <div key={i} title={d > 0 ? "Día ganador" : d < 0 ? "Día perdedor" : "Sin picks"}
                    style={{ width: 7, height, background: bg, borderRadius: 1.5, opacity: d === 0 ? 0.4 : 0.95 }} />;
      })}
    </div>
  );
}

/* ========== Heatmap (with volume) ========== */
function Heatmap({ rows, cols, matrix, onSelect, selected, disabled, cellHeight = 64 }) {
  // Validate matrix structure
  const isValidMatrix = Array.isArray(matrix) && matrix.length === rows.length &&
    matrix.every(row => Array.isArray(row) && row.length === cols.length);

  if (!isValidMatrix) {
    return <div style={{padding: "20px", textAlign: "center", color: "#ff5c7a"}}>
      Matriz de datos inválida: {rows.length} ligas pero {matrix ? matrix.length : 0} filas
    </div>;
  }

  function color(v) {
    if (v == null) return "rgba(255,255,255,0.025)";
    const intensity = Math.min(Math.abs(v) / 30, 1);
    if (v >= 0) return `rgba(30, 212, 152, ${0.14 + intensity * 0.62})`;
    return `rgba(255, 92, 122, ${0.14 + intensity * 0.62})`;
  }
  function textColor(v) {
    if (v == null) return "var(--text-4)";
    return Math.abs(v) > 20 ? "#fff" : "var(--text)";
  }

  // max picks for sizing the volume dot
  let maxN = 1;
  matrix.forEach(row => row.forEach(c => { if (c && c.n > maxN) maxN = c.n; }));

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `150px repeat(${cols.length}, minmax(72px, 1fr))`,
      gap: 4,
    }}>
      <div></div>
      {cols.map((c, i) => (
        <div key={i} className="heatmap-col-label" style={{height: 88}}>{c}</div>
      ))}

      {rows.map((r, ri) => (
        <React.Fragment key={ri}>
          <div className="heatmap-row-label" title={r}>
            <span style={{
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              opacity: disabled?.has(r) ? 0.4 : 1,
              fontSize: 12.5, fontWeight: 500,
            }}>{r}</span>
          </div>
          {matrix[ri].map((cell, ci) => {
            const v = cell?.roi;
            const n = cell?.n;
            const isSel = selected?.row === ri && selected?.col === ci;
            const isDis = disabled?.has(r);
            const dotSize = cell ? 4 + (n / maxN) * 14 : 0;
            return (
              <div key={ci}
                   className={"heatmap-cell" + (cell == null ? " empty" : "")}
                   onClick={() => cell != null && onSelect?.({row: ri, col: ci, ...cell, league: r, market: cols[ci]})}
                   style={{
                     background: color(v),
                     color: textColor(v),
                     boxShadow: isSel ? "0 0 0 2px var(--accent)" : (cell == null ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.18)"),
                     opacity: isDis ? 0.3 : 1,
                     cursor: cell == null ? "default" : "pointer",
                     height: cellHeight,
                     borderRadius: 6,
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     justifyContent: "center",
                     gap: 2,
                     padding: "4px 6px",
                     position: "relative",
                   }}
                   title={cell == null ? "sin datos" : `${r} · ${cols[ci]}: ${v > 0 ? "+" : ""}${v}% ROI · n=${n}`}
              >
                {cell == null ? (
                  <span style={{fontSize: 14, opacity: 0.4}}>·</span>
                ) : (
                  <>
                    <span style={{
                      fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700,
                      lineHeight: 1, fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.02em",
                    }}>
                      {v > 0 ? "+" : ""}{v}%
                    </span>
                    <span style={{
                      fontFamily: "var(--mono)", fontSize: 10.5,
                      opacity: 0.75, fontWeight: 500, lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      n={n}
                    </span>
                    <span style={{
                      position: "absolute", bottom: 4, right: 5,
                      width: dotSize, height: 3, borderRadius: 2,
                      background: "rgba(255,255,255,0.45)",
                    }}></span>
                  </>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ========== Mini horizontal bar ========== */
function InlineBar({ value, max = 30 }) {
  const pct = Math.min(Math.abs(value) / max, 1) * 50;
  const positive = value >= 0;
  return (
    <div className="bar-cell">
      <div className="bar">
        <div className="bar-mid"></div>
        <div className={`bar-fill ${positive ? "pos" : "neg"}`} style={{ width: `${pct}%`}}></div>
      </div>
    </div>
  );
}

/* ========== Win/Loss strip ========== */
function WLStrip({ w, l, p = 0, max = 12 }) {
  const items = [];
  for (let i = 0; i < w && items.length < max; i++) items.push("w");
  for (let i = 0; i < l && items.length < max; i++) items.push("l");
  for (let i = 0; i < p && items.length < max; i++) items.push("p");
  return (
    <div className="wl-strip">
      {items.map((c, i) => <div key={i} className={c}></div>)}
    </div>
  );
}

/* ========== Donut ========== */
function Donut({ value, max, label, color = "var(--green)", size = 64 }) {
  const r = (size / 2) - 6;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke={color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${c * pct} ${c}`}
              transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
            fill="var(--text)" fontFamily="var(--mono)" fontSize="13" fontWeight="700">
        {label}
      </text>
    </svg>
  );
}

/* ========== Horizontal bar chart (ranked leagues / markets by ROI) ========== */
function RankedBars({ rows, max = 30, valueKey = "roi", labelKey = "name", volumeKey = "total", height = 22, onClick, disabled }) {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 4}}>
      {rows.map((r, i) => {
        const v = r[valueKey];
        const pct = Math.min(Math.abs(v) / max, 1) * 50;
        const positive = v >= 0;
        const isDis = disabled?.has(r[labelKey]);
        return (
          <div key={i}
               onClick={() => onClick?.(r)}
               style={{
                 display: "grid",
                 gridTemplateColumns: "130px 1fr 60px 60px",
                 alignItems: "center",
                 gap: 10,
                 padding: "5px 0",
                 cursor: onClick ? "pointer" : "default",
                 opacity: isDis ? 0.4 : 1,
                 borderRadius: 4,
               }}>
            <span style={{fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
              {r[labelKey]}
            </span>
            <div style={{position: "relative", height, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden"}}>
              <div style={{position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "rgba(255,255,255,0.15)"}}></div>
              <div style={{
                position: "absolute", top: 2, bottom: 2,
                left: positive ? "50%" : `${50 - pct}%`,
                width: `${pct}%`,
                background: positive ? "var(--green)" : "var(--red)",
                borderRadius: 3,
                opacity: 0.85,
              }}></div>
            </div>
            <span className="mono" style={{
              textAlign: "right", fontWeight: 700, fontSize: 13.5,
              color: positive ? "var(--green)" : "var(--red)",
            }}>
              {positive ? "+" : ""}{v.toFixed(1)}%
            </span>
            <span className="mono text-3" style={{textAlign: "right", fontSize: 11.5}}>
              n={r[volumeKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Sparkline, EquityCurve, DailyStrip, Heatmap, InlineBar, WLStrip, Donut, RankedBars });
