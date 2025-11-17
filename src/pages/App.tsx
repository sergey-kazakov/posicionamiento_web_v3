// src/pages/App.tsx
import React, { useState } from 'react';
import { AppProvider, useApp, exportJSON, importJSON } from '../store';
import { Home } from './Home';
import { Designer } from './Designer';
import { Survey } from './Survey';
import { Map2D } from '../components/Map2D';
import { Results } from './Results';
import { t } from '../i18n';

export function App() {
  return (
	<AppProvider>
	  <AppInner />
	</AppProvider>
  );
}

type View = 'home' | 'designer' | 'survey' | 'map2d' | 'results';

function AppInner() {
  const [view, setView] = useState<View>('home');
  const { project, setProject } = useApp();
  const tr = t(project.lang);

  return (
	<>
	  <header>
		<div
		  className="container"
		  style={{
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
		  }}
		>
		  {/* Логотип */}
		  <div className="app-logo">
			<div className="logo-wordmark">
			  <span className="logo-main">POSICIONA</span>
			  <span className="logo-dot" />
			  <span className="logo-tail">MIENTO</span>
			</div>
			<div className="logo-subtitle">Perceptual Mapping Lab</div>
		  </div>

		  {/* Язык + импорт/экспорт */}
		  <div
			className="print-hide"
			style={{ display: 'flex', gap: 8, alignItems: 'center' }}
		  >
			<span className="hint">{tr.language}:</span>
			<select
			  value={project.lang}
			  onChange={(e) =>
				setProject({ ...project, lang: e.target.value as any })
			  }
			>
			  <option value="es">{tr.es}</option>
			  <option value="en">{tr.en}</option>
			</select>

			<button className="btn" onClick={() => exportJSON(project)}>
			  {tr.export}
			</button>

			<label className="btn">
			  <input
				type="file"
				accept="application/json"
				style={{ display: 'none' }}
				onChange={(e) => {
				  const f = e.target.files?.[0];
				  if (f) importJSON(f, setProject);
				}}
			  />
			  {tr.import}
			</label>
		  </div>
		</div>
	  </header>

	  <div className="container">
		{/* Навигация по экранам */}
		<div className="grid print-hide">
		  <button className="btn" onClick={() => setView('home')}>
			Home
		  </button>
		  <button className="btn" onClick={() => setView('designer')}>
			{tr.designer}
		  </button>
		  <button className="btn" onClick={() => setView('survey')}>
			{tr.survey}
		  </button>
		  <button className="btn" onClick={() => setView('map2d')}>
			{tr.map2d}
		  </button>
		  <button className="btn" onClick={() => setView('results')}>
			{tr.results}
		  </button>
		</div>

		{/* Контент экранов */}
		{view === 'home' && <Home />}
		{view === 'designer' && <Designer />}
		{view === 'survey' && <Survey />}
		{view === 'map2d' && <Map2D />}
		{view === 'results' && <Results />}
	  </div>
	</>
  );
}