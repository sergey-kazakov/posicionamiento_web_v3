// src/pages/Results.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../store';
import { t } from '../i18n';

// тот же расчёт, что в Map2D, но возвращаем ещё perf
type PrefMapSummary = {
  perf: number[][];
  brandCoords: number[][];
  attrCoords: number[][];
  idealIndex: number;
};

function computePrefMap(project: any): PrefMapSummary {
  const nB = project.brands.length;
  const nA = project.attributes.length;

  const sum: number[][] = Array.from({ length: nB }, () => Array(nA).fill(0));
  const cnt: number[][] = Array.from({ length: nB }, () => Array(nA).fill(0));

  for (const r of project.responses) {
    for (let bi = 0; bi < nB; bi++) {
      const bName = project.brands[bi].name;
      const perfBrand = r.performance?.[bName] || {};
      for (let ai = 0; ai < nA; ai++) {
        const attr = project.attributes[ai];
        const raw = perfBrand[attr.id];
        if (raw != null) {
          let v = raw as number;
          if (attr.reversed) v = 6 - v;
          sum[bi][ai] += v;
          cnt[bi][ai] += 1;
        }
      }
    }
  }

  const perf: number[][] = Array.from({ length: nB }, () => Array(nA).fill(3));
  for (let b = 0; b < nB; b++) {
    for (let a = 0; a < nA; a++) {
      perf[b][a] = cnt[b][a] ? sum[b][a] / cnt[b][a] : 3;
    }
  }

  const idealIndex =
    project.brands.findIndex(
      (b: any) =>
        b.name === project.benchmark || b.name.toUpperCase() === 'IDEAL',
    ) ?? -1;

  const usedRows: number[] = [];
  for (let b = 0; b < nB; b++) {
    if (b === idealIndex) continue;
    usedRows.push(b);
  }
  const usedB = usedRows.length ? usedRows : [...Array(nB).keys()];
  const nUsed = usedB.length;
  const nAttr = nA;

  const means = new Array(nAttr).fill(0);
  const sds = new Array(nAttr).fill(0);

  for (let a = 0; a < nAttr; a++) {
    let s = 0;
    for (const b of usedB) s += perf[b][a];
    means[a] = s / nUsed;
  }
  for (let a = 0; a < nAttr; a++) {
    let s = 0;
    const m = means[a];
    for (const b of usedB) {
      const d = perf[b][a] - m;
      s += d * d;
    }
    sds[a] = Math.sqrt(s / Math.max(nUsed - 1, 1)) || 1e-6;
  }

  const Z: number[][] = Array.from({ length: nB }, () => Array(nAttr).fill(0));
  for (let b = 0; b < nB; b++) {
    for (let a = 0; a < nAttr; a++) {
      Z[b][a] = (perf[b][a] - means[a]) / sds[a];
    }
  }

  function dot(a: number[], b: number[]): number {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }
  function matVec(M: number[][], v: number[]): number[] {
    const n = M.length;
    const res = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      const row = M[i];
      for (let j = 0; j < row.length; j++) s += row[j] * v[j];
      res[i] = s;
    }
    return res;
  }
  function norm(v: number[]): number {
    return Math.sqrt(dot(v, v));
  }
  function eigenSym2(S: number[][]) {
    const n = S.length;
    const B = S.map((r) => r.slice());
    const vecs: number[][] = [];
    const vals: number[] = [];

    for (let k = 0; k < 2; k++) {
      let v: number[] = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 1 : -1));
      for (let it = 0; it < 80; it++) {
        const Bv = matVec(B, v);
        const nv = norm(Bv);
        if (nv < 1e-10) break;
        v = Bv.map((x) => x / nv);
      }
      const Sv = matVec(S, v);
      const lambda = dot(v, Sv);
      vecs.push(v.slice());
      vals.push(lambda);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          B[i][j] -= lambda * v[i] * v[j];
        }
      }
    }
    return { vecs, vals };
  }

  const S: number[][] = Array.from({ length: nAttr }, () =>
    Array(nAttr).fill(0),
  );
  for (let j = 0; j < nAttr; j++) {
    for (let k = j; k < nAttr; k++) {
      let s = 0;
      for (const b of usedB) {
        s += Z[b][j] * Z[b][k];
      }
      const val = s / Math.max(nUsed - 1, 1);
      S[j][k] = val;
      S[k][j] = val;
    }
  }

  const { vecs } = eigenSym2(S);
  const V: number[][] = Array.from({ length: nAttr }, () => [0, 0]);
  for (let a = 0; a < nAttr; a++) {
    V[a][0] = vecs[0][a];
    V[a][1] = vecs[1][a];
  }

  const brandCoords: number[][] = Array.from({ length: nB }, () => [0, 0]);
  for (let b = 0; b < nB; b++) {
    for (let k = 0; k < 2; k++) {
      let s = 0;
      for (let a = 0; a < nAttr; a++) s += Z[b][a] * V[a][k];
      brandCoords[b][k] = s;
    }
  }

  const attrCoords: number[][] = Array.from({ length: nAttr }, () => [0, 0]);
  const usedBIndices = usedB;

  let meanX = 0,
    meanY = 0;
  for (const b of usedBIndices) {
    meanX += brandCoords[b][0];
    meanY += brandCoords[b][1];
  }
  meanX /= usedBIndices.length;
  meanY /= usedBIndices.length;

  const xc = usedBIndices.map((b) => brandCoords[b][0] - meanX);
  const yc = usedBIndices.map((b) => brandCoords[b][1] - meanY);

  for (let a = 0; a < nAttr; a++) {
    const sVals = usedBIndices.map((b) => (perf[b][a] - means[a]) / sds[a]);
    let meanS = 0;
    for (const v of sVals) meanS += v;
    meanS /= sVals.length;
    const sc = sVals.map((v) => v - meanS);

    let Sxx = 0,
      Syy = 0,
      Sxy = 0,
      Sxs = 0,
      Sys = 0;
    for (let i = 0; i < sc.length; i++) {
      const X = xc[i];
      const Y = yc[i];
      const Sval = sc[i];
      Sxx += X * X;
      Syy += Y * Y;
      Sxy += X * Y;
      Sxs += X * Sval;
      Sys += Y * Sval;
    }
    const det = Sxx * Syy - Sxy * Sxy;
    let bx = 0,
      by = 0;
    if (Math.abs(det) > 1e-8) {
      bx = (Sxs * Syy - Sys * Sxy) / det;
      by = (Sys * Sxx - Sxs * Sxy) / det;
    }
    attrCoords[a][0] = bx;
    attrCoords[a][1] = by;
  }

  let maxBrandR = 0;
  for (const p of brandCoords) {
    const r = Math.hypot(p[0], p[1]);
    if (r > maxBrandR) maxBrandR = r;
  }
  let maxAttrR = 0;
  for (const p of attrCoords) {
    const r = Math.hypot(p[0], p[1]);
    if (r > maxAttrR) maxAttrR = r;
  }
  const scaleAttr = maxAttrR > 0 ? (maxBrandR * 0.9) / maxAttrR : 1;
  for (const p of attrCoords) {
    p[0] *= scaleAttr;
    p[1] *= scaleAttr;
  }

  return { perf, brandCoords, attrCoords, idealIndex };
}

export function Results() {
  const { project } = useApp();
  const tr = t(project.lang);

  const summary = useMemo(() => computePrefMap(project), [project]);
  const { perf, brandCoords, attrCoords, idealIndex } = summary;

  // расстояния до IDEAL
  const distToIdeal: number[] = [];
  if (idealIndex >= 0) {
    const [ix, iy] = brandCoords[idealIndex];
    for (let b = 0; b < brandCoords.length; b++) {
      const [x, y] = brandCoords[b];
      distToIdeal[b] = Math.hypot(x - ix, y - iy);
    }
  }

  // чувствительность атрибутов = длина вектора
  const attrSens = attrCoords.map((p) => Math.hypot(p[0], p[1]));

  const mapRef = useRef<HTMLCanvasElement | null>(null);

  // мини-карта между таблицами (статичная, без интерактива)
  useEffect(() => {
    const canvas = mapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#eef2f7';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const cx = W / 2;
    const cy = H / 2;

    ctx.strokeStyle = '#C7D4E2';
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.stroke();

    let maxR = 1e-6;
    [...brandCoords, ...attrCoords].forEach((p) => {
      const r = Math.hypot(p[0], p[1]);
      if (r > maxR) maxR = r;
    });
    const scale = (Math.min(W, H) / 2.6 / maxR) * 0.9;

    ctx.font = '11px system-ui, -apple-system, BlinkMacSystemFont, Arial';
    ctx.textBaseline = 'bottom';

    // бренды
    project.brands.forEach((b: any, i: number) => {
      const [vx, vy] = brandCoords[i];
      const x = cx + vx * scale;
      const y = cy - vy * scale;
      const isIdeal = i === idealIndex;

      ctx.fillStyle = isIdeal ? '#0080ff' : '#111827';
      ctx.beginPath();
      ctx.arc(x, y, isIdeal ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillText(b.name, x + 5, y - 4);
    });

    // атрибуты
    for (let a = 0; a < project.attributes.length; a++) {
      const [vx, vy] = attrCoords[a];
      const x = cx + vx * scale;
      const y = cy - vy * scale;
      ctx.fillStyle = '#0EA5E9';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      const lbl =
        project.lang === 'es'
          ? project.attributes[a].labelEs
          : project.attributes[a].labelEn;
      ctx.fillText(lbl, x + 4, y - 2);
    }
  }, [project, brandCoords, attrCoords, idealIndex]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="card">
      <div
        className="print-hide"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <h3>{tr.results}</h3>
        <button className="btn" onClick={handlePrint}>
          Imprimir / PDF
        </button>
      </div>

      <div className="grid">
        {/* Левая колонка: таблица performance */}
        <div>
          <h4>{tr.perfMeansTitle}</h4>
          <table>
            <thead>
              <tr>
                <th>{tr.brand}</th>
                {project.attributes.map((a: any) => (
                  <th key={a.id}>
                    {project.lang === 'es' ? a.labelEs : a.labelEn}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.brands.map((b: any, bi: number) => (
                <tr key={b.name}>
                  <td>{b.name}</td>
                  {perf[bi].map((v: number, ai: number) => (
                    <td key={ai}>{v.toFixed(2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Правая колонка: расстояние до IDEAL + чувствительность */}
        <div>
          <h4>{tr.distToIdeal}</h4>
          <table>
            <thead>
              <tr>
                <th>{tr.brand}</th>
                <th>dist</th>
              </tr>
            </thead>
            <tbody>
              {project.brands.map((b: any, bi: number) => (
                <tr key={b.name}>
                  <td>{b.name}</td>
                  <td>
                    {idealIndex >= 0 ? distToIdeal[bi].toFixed(3) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ marginTop: 16 }}>{tr.attrSensitivityTitle}</h4>
          <table>
            <thead>
              <tr>
                <th>{tr.attribute}</th>
                <th>|vector|</th>
              </tr>
            </thead>
            <tbody>
              {project.attributes.map((a: any, ai: number) => (
                <tr key={a.id}>
                  <td>
                    {project.lang === 'es' ? a.labelEs : a.labelEn}
                  </td>
                  <td>{attrSens[ai].toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* мини-карта между таблицами, попадает в PDF */}
      <div style={{ marginTop: 20 }}>
        <h4>Mapa 2D (resumen)</h4>
        <canvas
          ref={mapRef}
          width={900}
          height={350}
          style={{ borderRadius: 12, border: '1px solid #dde3ee' }}
        />
      </div>
    </div>
  );
}