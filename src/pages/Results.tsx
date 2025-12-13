// src/pages/Results.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { drawPerceptualMap } from '../utils/drawPerceptualMap';
import { useApp } from '../store';
import { t } from '../i18n';

type PrefMapSummary = {
  perf: number[][];
  brandCoords: number[][];
  attrCoords: number[][];
  idealIndex: number;
};

function computePrefMap(project: any): PrefMapSummary {
  const nB = project.brands.length;
  const nA = project.attributes.length;

  // --- 1. Performance means ---
  const sum = Array.from({ length: nB }, () => Array(nA).fill(0));
  const cnt = Array.from({ length: nB }, () => Array(nA).fill(0));

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

  const perf = Array.from({ length: nB }, () => Array(nA).fill(3));
  for (let b = 0; b < nB; b++) {
    for (let a = 0; a < nA; a++) {
      perf[b][a] = cnt[b][a] ? sum[b][a] / cnt[b][a] : 3;
    }
  }

  // --- 2. Ideal index ---
  const idealIndex =
    project.brands.findIndex(
      (b: any) =>
        b.name === project.benchmark || b.name.toUpperCase() === 'IDEAL',
    ) ?? -1;

  // --- 3. Z-score ---
  const means = new Array(nA).fill(0);
  const sds = new Array(nA).fill(0);

  for (let a = 0; a < nA; a++) {
    let s = 0;
    for (let b = 0; b < nB; b++) s += perf[b][a];
    means[a] = s / nB;
  }

  for (let a = 0; a < nA; a++) {
    let s = 0;
    for (let b = 0; b < nB; b++) {
      const d = perf[b][a] - means[a];
      s += d * d;
    }
    sds[a] = Math.sqrt(s / Math.max(nB - 1, 1)) || 1e-6;
  }

  const Z = Array.from({ length: nB }, () => Array(nA).fill(0));
  for (let b = 0; b < nB; b++) {
    for (let a = 0; a < nA; a++) {
      Z[b][a] = (perf[b][a] - means[a]) / sds[a];
    }
  }

  // --- 4. PCA (2D, symmetric) ---
  function dot(a: number[], b: number[]) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }
  function matVec(M: number[][], v: number[]) {
    return M.map((row) => dot(row, v));
  }
  function norm(v: number[]) {
    return Math.sqrt(dot(v, v));
  }

  const S = Array.from({ length: nA }, () => Array(nA).fill(0));
  for (let j = 0; j < nA; j++) {
    for (let k = j; k < nA; k++) {
      let s = 0;
      for (let b = 0; b < nB; b++) s += Z[b][j] * Z[b][k];
      const v = s / Math.max(nB - 1, 1);
      S[j][k] = v;
      S[k][j] = v;
    }
  }

  let v1 = Array.from({ length: nA }, (_, i) => (i % 2 ? -1 : 1));
  for (let i = 0; i < 60; i++) {
    const w = matVec(S, v1);
    const n = norm(w);
    if (n < 1e-10) break;
    v1 = w.map((x) => x / n);
  }

  let v2 = Array.from({ length: nA }, (_, i) => (i % 2 ? 1 : -1));
  for (let i = 0; i < 60; i++) {
    const w = matVec(S, v2);
    const n = norm(w);
    if (n < 1e-10) break;
    v2 = w.map((x) => x / n);
  }

  // --- 5. Coordinates ---
  const brandCoords = Array.from({ length: nB }, () => [0, 0]);
  for (let b = 0; b < nB; b++) {
    brandCoords[b][0] = dot(Z[b], v1);
    brandCoords[b][1] = dot(Z[b], v2);
  }

  const attrCoordsRaw = Array.from({ length: nA }, () => [0, 0]);
  for (let a = 0; a < nA; a++) {
    attrCoordsRaw[a][0] = v1[a];
    attrCoordsRaw[a][1] = v2[a];
  }

  // --- 6. Scaling attributes (NON-MUTATING) ---
  let maxBrandR = 0;
  for (const p of brandCoords) {
    const r = Math.hypot(p[0], p[1]);
    if (r > maxBrandR) maxBrandR = r;
  }

  let maxAttrR = 0;
  for (const p of attrCoordsRaw) {
    const r = Math.hypot(p[0], p[1]);
    if (r > maxAttrR) maxAttrR = r;
  }

  const scaleAttr = maxAttrR > 0 ? (maxBrandR * 0.9) / maxAttrR : 1;

  const attrCoords = attrCoordsRaw.map(([x, y]) => [
    x * scaleAttr,
    y * scaleAttr,
  ]);

  return { perf, brandCoords, attrCoords, idealIndex };
}

export function Results() {
  const { project } = useApp();
  const tr = t(project.lang);

  const summary = useMemo(() => computePrefMap(project), [project]);
  const { perf, brandCoords, attrCoords, idealIndex } = summary;

  const distToIdeal: number[] = [];
  if (idealIndex >= 0) {
    const [ix, iy] = brandCoords[idealIndex];
    for (let b = 0; b < brandCoords.length; b++) {
      const [x, y] = brandCoords[b];
      distToIdeal[b] = Math.hypot(x - ix, y - iy);
    }
  }

  const attrSens = attrCoords.map((p) => Math.hypot(p[0], p[1]));

  const mapRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = mapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawPerceptualMap({
      ctx,
      canvas,
      project,
      prefMap: { brandCoords, attrCoords, idealIndex },
      zoom: 1,
      hoverBrandIndex: null,
      showAttributes: true,
      selectedAttrIds: project.attributes.map((a: any) => a.id),
    });
  }, [project, brandCoords, attrCoords, idealIndex]);

  return (
    <div className="card">
      <div className="print-hide" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>{tr.results}</h3>
        <button className="btn" onClick={() => window.print()}>
          Imprimir / PDF
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>{tr.mapSummaryTitle}</h4>
        <canvas
          ref={mapRef}
          width={900}
          height={350}
          style={{ borderRadius: 12, border: '1px solid #dde3ee' }}
        />
      </div>

      <div className="page-break"></div>

      <div className="grid">
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

        <div>
          <h4>{tr.attrSensitivityTitle}</h4>
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
                  <td>{project.lang === 'es' ? a.labelEs : a.labelEn}</td>
                  <td>{attrSens[ai].toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ marginTop: 20 }}>{tr.distToIdeal}</h4>
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
                  <td>{idealIndex >= 0 ? distToIdeal[bi].toFixed(3) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}