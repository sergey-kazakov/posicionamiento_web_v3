// src/pages/Designer.tsx
import React, { useState } from 'react';
import { useApp, Attribute, BrandStyle } from '../store';
import { t } from '../i18n';

export function Designer() {
  const { project, setProject } = useApp();
  const tr = t(project.lang);

  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('#0D1B2A');

  const [attrEs, setAttrEs] = useState('');
  const [attrEn, setAttrEn] = useState('');
  const [rev, setRev] = useState(false);
  const [attrError, setAttrError] = useState<string>('');

  // ───────── БРЕНДЫ ─────────

  function addBrand() {
	if (!brand.trim()) return;

	const b: BrandStyle = {
	  name: brand.trim(),
	  color,
	};

	setProject({
	  ...project,
	  brands: [...project.brands, b],
	});

	setBrand('');
  }

  function delBrand(name: string) {
	const newBrands = project.brands.filter((b) => b.name !== name);
	const newBenchmark =
	  project.benchmark === name ? '' : project.benchmark;

	setProject({
	  ...project,
	  brands: newBrands,
	  benchmark: newBenchmark,
	});
  }

  // ───────── АТРИБУТЫ ─────────

  function addAttr() {
	if (!attrEs.trim() || !attrEn.trim()) {
	  // текст ошибки из i18n — меняется с языком
	  setAttrError(tr.attrError);
	  return;
	}
	setAttrError('');

	const id =
	  attrEn.toLowerCase().replace(/[^a-z0-9]+/g, '_') +
	  '_' +
	  ((Math.random() * 1e4) | 0);

	const a: Attribute = {
	  id,
	  labelEs: attrEs,
	  labelEn: attrEn,
	  reversed: rev,
	};

	setProject({
	  ...project,
	  attributes: [...project.attributes, a],
	});

	setAttrEs('');
	setAttrEn('');
	setRev(false);
  }

  function delAttr(id: string) {
	setProject({
	  ...project,
	  attributes: project.attributes.filter((a) => a.id !== id),
	});
  }

  // ───────── РЕНДЕР ─────────

  return (
	<div className="card">
	  <div className="grid">
		{/* Бренды */}
		<div>
		  <h3>{tr.brands}</h3>

		  <div
			style={{
			  display: 'flex',
			  gap: 8,
			  marginBottom: 8,
			}}
		  >
			<input
			  value={brand}
			  onChange={(e) => setBrand(e.target.value)}
			  placeholder={tr.name}
			/>
			<input
			  type="color"
			  value={color}
			  onChange={(e) => setColor(e.target.value)}
			/>
			<button className="btn" onClick={addBrand}>
			  {tr.add}
			</button>
		  </div>

		  <div className="grid">
			{project.brands.map((b) => (
			  <span
				key={b.name}
				className="badge"
				style={{
				  background: '#eef',
				  borderLeft: `8px solid ${b.color || '#2CAFBF'}`,
				}}
			  >
				{b.name}
				<button
				  onClick={() => delBrand(b.name)}
				  style={{ marginLeft: 6 }}
				>
				  ×
				</button>
			  </span>
			))}
		  </div>

		  <div style={{ marginTop: 8 }}>
			<label>{tr.benchmark}: </label>
			<select
			  value={project.benchmark || ''}
			  onChange={(e) =>
				setProject({
				  ...project,
				  benchmark: e.target.value,
				})
			  }
			>
			  <option value=""></option>
			  {project.brands.map((b) => (
				<option key={b.name} value={b.name}>
				  {b.name}
				</option>
			  ))}
			</select>
		  </div>
		</div>

		{/* Атрибуты */}
		<div>
		  <h3>{tr.attributes}</h3>

		  <div
			className="grid"
			style={{ alignItems: 'flex-end' }}
		  >
			<div>
			  <label>ES</label>
			  <input
				value={attrEs}
				onChange={(e) => setAttrEs(e.target.value)}
				placeholder="Etiqueta"
			  />
			</div>

			<div>
			  <label>EN</label>
			  <input
				value={attrEn}
				onChange={(e) => setAttrEn(e.target.value)}
				placeholder="Label"
			  />
			</div>

			<div>
			  <label>{tr.reversed}</label>
			  <input
				type="checkbox"
				checked={rev}
				onChange={(e) => setRev(e.target.checked)}
			  />
			</div>

			<div>
			  <button className="btn" onClick={addAttr}>
				{tr.add}
			  </button>
			  {attrError && (
				<div
				  style={{
					color: '#c0392b',
					fontSize: 12,
					marginTop: 4,
				  }}
				>
				  {attrError}
				</div>
			  )}
			</div>
		  </div>

		  <div className="grid" style={{ marginTop: 8 }}>
			{project.attributes.map((a) => (
			  <span key={a.id} className="badge">
				{project.lang === 'es' ? a.labelEs : a.labelEn}
				{a.reversed ? ' (rev)' : ''}
				<button
				  onClick={() => delAttr(a.id)}
				  style={{ marginLeft: 6 }}
				>
				  ×
				</button>
			  </span>
			))}
		  </div>

		  {/* Инструкция по атрибутам — из i18n, меняется по языку */}
		  <p className="hint" style={{ marginTop: 8 }}>
			{tr.attrNote}
		  </p>

		  {/* Примечание про цену (как было раньше, тоже через i18n) */}
		  <p className="hint">{tr.priceNote}</p>
		</div>
	  </div>
	</div>
  );
}