// src/i18n.ts

export type Lang = 'es' | 'en';

type Dict = {
  appTitle: string;
  homeTitle: string;
  homeIntro: string;

  language: string;
  es: string;
  en: string;

  designer: string;
  survey: string;
  map2d: string;
  map3d: string;
  results: string;

  brands: string;
  attributes: string;
  add: string;
  name: string;
  reversed: string;
  priceNote: string;

  importance: string;
  performance: string;
  brand: string;
  attribute: string;
  submit: string;
  responses: string;
  export: string;
  import: string;
  clear: string;

  distToIdeal: string;
  benchmark: string;
  print: string;

  mapHint: string;
};

const ES: Dict = {
  appTitle: 'Posicionamiento (Web)',
  homeTitle: 'Mapa perceptual',
  homeIntro: `Bienvenido/a a POSICIONAMIENTO (PCA / PrefMap).
  
  Esta aplicación permite generar mapas perceptuales en 2D mediante PCA y PrefMap.
  
  Cómo empezar:
  1. Introduce marcas y atributos manualmente en la sección DATOS.
  2. Si tienes un análisis previo, puedes cargarlo con la opción Importar JSON.
  3. Revisa o edita la matriz de atributos.
  4. Ve a RESULTADOS para generar el mapa PCA.
  5. Si el archivo JSON incluye preferencias, se mostrarán vectores PrefMap.
  6. Guarda mapas y tablas usando Imprimir / PDF.
  
  Para más detalles, consulta el Manual Técnico.`,

  language: 'Idioma',
  es: 'Español',
  en: 'English',

  designer: 'Diseñador',
  survey: 'Encuesta',
  map2d: 'Mapa de Posicionamiento',
  map3d: 'Mapa 3D (futuro)',      // ← ДОБАВЬ ЭТУ СТРОКУ
  results: 'Resultados',

  brands: 'Marcas',
  attributes: 'Atributos',
  add: 'Añadir',
  name: 'Nombre',
  reversed: 'Inverso',
  priceNote: 'Para el precio, valores más bajos se interpretan como mejores.',
  attrNote:
      'Cuando añadas un nuevo atributo, introduce siempre su nombre en español e inglés. Estos textos se usan en los cuestionarios y en los gráficos.',
    attrError:
      'Por favor, introduce el nombre del atributo en español e inglés.',
      
  importance: 'Importancia (1–5)',
  performance: 'Desempeño (1–5)',
  brand: 'Marca',
  attribute: 'Atributo',
  submit: 'Enviar respuesta',
  responses: 'Respuestas',
  export: 'Exportar JSON',
  import: 'Importar JSON',
  clear: 'Limpiar',
  
  distToIdeal: 'Distancias a la marca IDEAL',
  benchmark: 'Marca de referencia',
  print: 'Imprimir / PDF',

  mapHint:
    'Pasa el ratón por las marcas para ver distancias a IDEAL y a los atributos seleccionados.',
};

const EN: Dict = {
  appTitle: 'Positioning (Web)',
  homeTitle: 'Perceptual map',
  homeIntro: `Welcome to POSICIONAMIENTO (PCA / PrefMap).
  
  This lab lets you generate 2D perceptual maps using PCA and PrefMap.
  
  Getting started:
  1. Enter brands and attributes manually in the DATA section.
  2. If you have a previous analysis, load it using the Import JSON option.
  3. Review or edit the attribute matrix.
  4. Go to RESULTS to generate the PCA map.
  5. If your JSON file includes preferences, PrefMap vectors will be displayed.
  6. Save maps and tables using Print / PDF.
  
  For more details, see the Technical Manual.`,

  language: 'Language',
  es: 'Spanish',
  en: 'English',

  designer: 'Designer',
  survey: 'Survey',
  map2d: 'Positioning Map',
  map3d: '3D map (future)',      // ← ДОБАВЬ ЭТУ СТРОКУ
  results: 'Results',
  
  brands: 'Brands',
  attributes: 'Attributes',
  add: 'Add',
  name: 'Name',
  reversed: 'Reversed',
  priceNote: 'For price, lower values are interpreted as better.',
  attrNote:
    'When adding a new attribute, always provide both Spanish and English names. These labels are used in the survey and on the maps.',
  attrError:
    'Please enter the attribute name in both Spanish and English.',

  importance: 'Importance (1–5)',
  performance: 'Performance (1–5)',
  brand: 'Brand',
  attribute: 'Attribute',
  submit: 'Submit response',
  responses: 'Responses',
  export: 'Export JSON',
  import: 'Import JSON',
  clear: 'Clear',
  
  distToIdeal: 'Distances to IDEAL brand',
  benchmark: 'Benchmark brand',
  print: 'Print / PDF',

  mapHint:
    'Hover over brands to see distances to IDEAL and to selected attributes.',
};

export function t(lang: Lang): Dict {
  return lang === 'en' ? EN : ES;
}