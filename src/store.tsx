import React, { createContext, useContext, useState } from 'react';
import type { Lang } from './i18n';

/* ========= Types ========= */

export type Attribute = {
  id: string;
  labelEs: string;
  labelEn: string;
  reversed?: boolean;
};

export type BrandStyle = {
  name: string;
  color?: string;
};

export type SurveyResponse = {
  importance: Record<string, number>;
  performance: Record<string, Record<string, number>>;
  ts: number;
};

export type Project = {
  id: string;
  lang: Lang;
  brands: BrandStyle[];
  attributes: Attribute[];
  benchmark?: string;
  responses: SurveyResponse[];
};

type Ctx = {
  project: Project;
  setProject: (p: Project) => void;
};

/* ========= Default seed ========= */

const seed: Project = {
  id: 'demo',
  lang: 'es',
  brands: [
	{ name: 'Don Simon', color: '#0D1B2A' },
	{ name: 'Hacendado' },
	{ name: 'Alpiendo' },
	{ name: 'Granini' },
	{ name: 'IDEAL', color: '#2CAFBF' },
  ],
  attributes: [
	{ id: 'taste', labelEs: 'Sabor', labelEn: 'Taste' },
	{ id: 'pack', labelEs: 'Envase útil', labelEn: 'Convenient packaging' },
	{ id: 'nat', labelEs: 'Naturalidad (%)', labelEn: 'Naturalness (%)' },
	{ id: 'nopulp', labelEs: 'Sin poso', labelEn: 'No pulp/residue' },
	{ id: 'color', labelEs: 'Color', labelEn: 'Color' },
	{ id: 'price', labelEs: 'Precio', labelEn: 'Price', reversed: true },
	{ id: 'aroma', labelEs: 'Aroma', labelEn: 'Smell' },
  ],
  benchmark: 'IDEAL',
  responses: [],
};

/* ========= Context ========= */

export const AppCtx = createContext<Ctx>({
  project: seed,
  setProject: () => {},
});

export function useApp() {
  return useContext(AppCtx);
}

/* ========= Provider ========= */

const STORAGE_KEY = 'posicionamiento_project_v3';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = localStorage.getItem(STORAGE_KEY);

  let initialProject: Project = seed;
  if (saved) {
	try {
	  const parsed = JSON.parse(saved);
	  if (parsed && typeof parsed === 'object') {
		initialProject = parsed;
	  }
	} catch {
	  localStorage.removeItem(STORAGE_KEY);
	  initialProject = seed;
	}
  }

  const [project, setProjectState] = useState<Project>(initialProject);

  function setProject(p: Project) {
	if (!p || typeof p !== 'object') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
	setProjectState(p);
  }

  return (
	<AppCtx.Provider value={{ project, setProject }}>
	  {children}
	</AppCtx.Provider>
  );
}

/* ========= Import / Export ========= */

export function exportJSON(p: Project) {
  const blob = new Blob([JSON.stringify(p, null, 2)], {
	type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'posicionamiento_project.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file: File, cb: (p: Project) => void) {
  const r = new FileReader();
  r.onload = () => {
	try {
	  const parsed = JSON.parse(String(r.result));
	  if (parsed && typeof parsed === 'object') {
		cb(parsed);
	  } else {
		alert('JSON inválido');
	  }
	} catch {
	  alert('JSON inválido');
	}
  };
  r.readAsText(file);
}