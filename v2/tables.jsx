// Tables: sortable, with inline bars, semáforos, toggles

const { useState: useStateT, useMemo: useMemoT } = React;

function StatusDot({ status }) {
  const map = {
    green: { c: "var(--green)", t: "Activar" },
    amber: { c: "var(--amber)", t: "Acumular" },
    red: { c: "var(--red)", t: "Descartar" },
    insuf: { c: "var(--text-4)", t: "Insuficiente" },
  };
  const s = map[status] || map.insuf;
  return <span title={s.t} style={{
    display: "inline-block", width: 7, height: 7, borderRadius: "50%",
    background: s.c, marginRight: 6, verticalAlign: "middle",
    boxShadow: status === "green" ? `0 0 6px ${s.c}` : "none",
  }}></span>;
}

function StatusChip({ status }) {
  const map = {
    green: { cls: "green", label: "Activar" },
    amber: { cls: "amber", label: "Acumular" },
    red: { cls: "red", label: "Descartar" },
    insuf: { cls: "", label: "Insuf." },
  };
  const s = map[status] || map.insuf;
  return <span className={`chip ${s.cls}`}><span className="dot"></span>{s.label}</span>;
}

function Toggle({ on, onClick, warn }) {
  return <button className={`tgl ${on ? "on" : ""} ${warn ? "warn" : ""}`} onClick={onClick} aria-pressed={on}></button>;
}

/* ========== Generic data table ========== */
function DataTable({
  rows,
  cols,             // [{key, label, align, sortable, render}]
  defaultSort,
  total,            // optional totals row
  onToggle,         // (rowKey) => void  — show toggle column
  isOn,             // (row) => bool
  rowKey,           // (row) => string
  disabledRow,      // (row) => bool
  highlight,        // row.key — emphasize
}) {
  const [sortKey, setSortKey] = useStateT(defaultSort?.key || "roi");
  const [sortDir, setSortDir] = useStateT(defaultSort?.dir || "desc");

  const sorted = useMemoT(() => {
    const r = [...rows];
    r.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return r;
  }, [rows, sortKey, sortDir]);

  function clickSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  return (
    <table className="tbl">
      <thead>
        <tr>
          {onToggle && <th style={{width: 36}}></th>}
          {cols.map(c => (
            <th key={c.key}
                className={c.sortable !== false ? "sortable" : ""}
                style={{textAlign: c.align || "left", width: c.width}}
                onClick={() => c.sortable !== false && clickSort(c.key)}>
              {c.label}
              {sortKey === c.key && <span className="arrow">{sortDir === "asc" ? "▲" : "▼"}</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => {
          const k = rowKey ? rowKey(row) : i;
          const dis = disabledRow?.(row);
          const on = isOn?.(row);
          return (
            <tr key={k}
                className={(dis ? "disabled " : "") + (highlight === k ? "highlight" : "")}>
              {onToggle && (
                <td style={{textAlign: "center", padding: "8px 8px"}}>
                  <Toggle on={on} onClick={() => onToggle(k)} />
                </td>
              )}
              {cols.map(c => (
                <td key={c.key} style={{textAlign: c.align || "left"}}>
                  {c.render ? c.render(row, dis) : row[c.key]}
                </td>
              ))}
            </tr>
          );
        })}
        {total && (
          <tr className="totals">
            {onToggle && <td></td>}
            {cols.map(c => (
              <td key={c.key} style={{textAlign: c.align || "left"}}>
                {c.renderTotal ? c.renderTotal(total) : (c.render ? c.render(total) : total[c.key])}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

/* ========== Renderers ========== */
function fmtROI(v) {
  const sign = v > 0 ? "+" : "";
  const cls = v > 0 ? "green" : v < 0 ? "red" : "text-3";
  return <span className={cls}>{sign}{v.toFixed(1)}%</span>;
}
function fmtEur(v) {
  const sign = v > 0 ? "+" : "";
  const cls = v > 0 ? "green" : v < 0 ? "red" : "text-3";
  return <span className={cls}>{sign}{v.toFixed(2)}€</span>;
}

function ROICell({ value, max = 30 }) {
  const pct = Math.min(Math.abs(value) / max, 1) * 50;
  const positive = value >= 0;
  return (
    <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8}}>
      <div style={{
        width: 60, height: 4, background: "rgba(255,255,255,0.05)",
        borderRadius: 2, position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: "50%", width: 1,
          background: "rgba(255,255,255,0.18)"
        }}></div>
        <div style={{
          position: "absolute", top: 0, bottom: 0,
          left: positive ? "50%" : `${50 - pct}%`,
          width: `${pct}%`,
          background: positive ? "var(--green)" : "var(--red)",
          borderRadius: 2,
        }}></div>
      </div>
      <span className={`mono ${positive ? "green" : "red"}`} style={{minWidth: 50, textAlign: "right", fontWeight: 600}}>
        {positive ? "+" : ""}{value.toFixed(1)}%
      </span>
    </div>
  );
}

function VolumeCell({ value, max }) {
  const pct = (value / max) * 100;
  return (
    <div style={{display: "flex", alignItems: "center", gap: 8}}>
      <span className="mono tnum" style={{minWidth: 28, textAlign: "right"}}>{value}</span>
      <div style={{
        width: 50, height: 3, background: "rgba(255,255,255,0.05)",
        borderRadius: 2, overflow: "hidden", flexShrink: 0
      }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: "var(--blue)",
          opacity: 0.7,
        }}></div>
      </div>
    </div>
  );
}

function ResultCell({ w, l, winPct }) {
  return (
    <div style={{display: "flex", alignItems: "center", gap: 8}}>
      <WLStrip w={w} l={l} max={10} />
      <span className="mono text-2" style={{fontSize: 11, minWidth: 36}}>
        <span className="green">{w}</span><span style={{color: "var(--text-4)"}}>/</span><span className="red">{l}</span>
      </span>
      <span className="mono text-3" style={{fontSize: 11}}>{winPct}%</span>
    </div>
  );
}

Object.assign(window, { DataTable, StatusDot, StatusChip, Toggle, fmtROI, fmtEur, ROICell, VolumeCell, ResultCell });
