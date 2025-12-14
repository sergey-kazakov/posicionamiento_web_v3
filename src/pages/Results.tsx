// src/pages/Results.tsx
import React, { useEffect, useRef } from 'react';
import { useApp } from '../store';
import { drawPerceptualMap } from '../utils/drawPerceptualMap';
import { t } from '../i18n';

export function Results() {
  const { project } = useApp();
  const tr = t(project.lang);
  const mapRef = useRef<HTMLCanvasElement | null>(null);

  const prefMap = project.prefMap;
  if (!prefMap) {
    return <div className="card">No results yet</div>;
  }

  // === DRAW MAP (READ-ONLY SNAPSHOT) ===
  useEffect(() => {
    const canvas = mapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawPerceptualMap({
      ctx,
      canvas,
      project,
      prefMap,
      zoom: 1,
      hoverBrandIndex: null,
      showAttributes: true,
      selectedAttrIds: project.attributes.map((a: any) => a.id),
    });
  }, [prefMap, project.lang]);

  return (
    <div id="report-root" className="card">
      {/* ===== HEADER (NOT PRINTED CONTROLS) ===== */}
      <div
        className="print-hide"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <h3>
          {project.lang === 'es'
            ? 'Resultados del análisis de posicionamiento de marcas'
            : 'Brands positioning analysis results'}
        </h3>

        <button className="btn" onClick={() => window.print()}>
          PDF / Print
        </button>
      </div>

      {/* ===== REPORT HEADER (PRINT) ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          marginBottom: 16,
        }}
      >
        <div className="print-only">
          <strong>
            {project.lang === 'es'
              ? 'Resultados del análisis de posicionamiento de marcas'
              : 'Brands positioning analysis results'}
          </strong>
        </div>

        <div className="print-only" style={{ textAlign: 'right' }}>
          <div>
            {project.lang === 'es'
              ? 'Nombre del estudiante / grupo:'
              : 'Student / Group name:'}
          </div>
          <div>___________________________</div>
        </div>
      </div>

      {/* ===== MAP ===== */}
      <div style={{ marginBottom: 16 }}>
        <canvas
          ref={mapRef}
          width={900}
          height={350}
          style={{
            width: '100%',
            height: '320px',
            border: '1px solid #dde3ee',
            borderRadius: 8,
          }}
        />
      </div>

      {/* ===== TABLES ===== */}
      <div className="grid results-grid">
        {/* === PERFORMANCE MEANS === */}
        <div>
          <h4>
            {project.lang === 'es'
              ? 'Medias de desempeño'
              : 'Performance means'}
          </h4>
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
              {[...prefMap.tables.performanceMeans]
                .sort((a, b) => {
                  const avgA =
                    a.values.reduce((s, v) => s + v, 0) / a.values.length;
                  const avgB =
                    b.values.reduce((s, v) => s + v, 0) / b.values.length;
                  return avgB - avgA; // по убыванию
                })
                .map((row, i) => (
                  <tr key={i}>
                    <td>{row.brand}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className="num">{v.toFixed(2)}</td>
                    ))}
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* === RIGHT COLUMN === */}
        <div>
          {/* ATTRIBUTE SENSITIVITY */}
          <h4>
            {project.lang === 'es'
              ? 'Sensibilidad de atributos'
              : 'Attribute sensitivity'}
          </h4>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{tr.attribute}</th>
                <th className="num">|vector|</th>
              </tr>
            </thead>
            <tbody>
              {[...prefMap.tables.attributeSensitivity]
                .sort((a, b) => b.magnitude - a.magnitude)
                .map((row, i) => (
                  <tr key={i}>
                    <td className="num">{i + 1}</td>
                    <td>{row.attribute}</td>
                    <td className="num">{row.magnitude.toFixed(2)}</td>
                  </tr>
              ))}
            </tbody>
          </table>

          {/* DISTANCE TO IDEAL */}
          <h4>
            {project.lang === 'es'
              ? 'Distancias a la marca IDEAL'
              : 'Distances to IDEAL brand'}
          </h4>
          <table>
            <thead>
              <tr>
                <th className="num">#</th>
                <th>{tr.brand}</th>
                <th className="num">
                  {project.lang === 'es' ? 'Distancia' : 'Dist.'}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                // IDEAL — всегда первым
                ...(project.benchmark
                  ? [{
                      brand: project.benchmark,
                      distance: 0,
                      __ideal: true,
                    }]
                  : []),
            
                // остальные бренды по возрастанию distance
                ...prefMap.tables.distancesToIdeal
                  .filter((r) => r.brand !== project.benchmark)
                  .sort((a, b) => a.distance - b.distance)
                  .map((r) => ({ ...r, __ideal: false })),
              ].map((row, i) => (
                <tr key={i} className={row.__ideal ? 'ideal-row' : undefined}>
                  <td className="num">{i + 1}</td>
                  <td>{row.brand}</td>
                  <td className="num">{row.distance.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}