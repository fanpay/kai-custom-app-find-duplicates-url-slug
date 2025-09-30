import './style.css';
import { getCustomAppContext } from '@kontent-ai/custom-app-sdk';

const app = document.getElementById('app');
if (app) {
  app.innerHTML = `
    <h1 style="color: green">¡Hola desde mi custom app!</h1>
    <div id="ctx">Cargando contexto de Kontent.ai...</div>
  `;
}

getCustomAppContext().then(response => {
  const ctxDiv = document.getElementById('ctx');
  if (!ctxDiv) return;
  if (response.isError) {
    ctxDiv.innerHTML = `<p style='color:red'>Error: ${response.description}</p>`;
  } else {
    ctxDiv.innerHTML = `
      <strong>Contexto:</strong>
      <pre>${JSON.stringify(response.context, null, 2)}</pre>
      <strong>Config:</strong>
      <pre>${JSON.stringify(response.config, null, 2)}</pre>
    `;
  }
});

// Puedes agregar aquí tu lógica de negocio después de obtener el contexto

// --- Lógica real comentada para pruebas ---
/*
const resultDiv = document.getElementById('result')!;
const findBtn = document.getElementById('find-btn')!;

findBtn.addEventListener('click', async () => {
  resultDiv.innerHTML = 'Buscando...';
  const result = await findDuplicateSlugs();
  if ('error' in result) {
    resultDiv.innerHTML = `<p style="color:red">${result.error}</p>`;
    return;
  }
  const duplicates = result.duplicates || [];
  if (duplicates.length === 0) {
    resultDiv.innerHTML = '<p>No hay coincidencias de slugs duplicados.</p>';
  } else {
    resultDiv.innerHTML = '<h2>Slugs duplicados:</h2>' +
      duplicates.map((d: any) => `<div><b>${d.slug}</b>:<ul>${d.items.map((i: string) => `<li>${i}</li>`).join('')}</ul></div>`).join('');
  }
});
*/

// Lógica para buscar duplicados (comentada para pruebas)
/*
async function findDuplicateSlugs() {
  // If using Vite, ensure vite-env.d.ts exists and import.meta.env is typed. Otherwise, use process.env only.
  const projectId = (import.meta as any).env?.VITE_KONTENT_PROJECT_ID || process.env.KONTENT_PROJECT_ID;
  const apiKey = (import.meta as any).env?.VITE_KONTENT_API_KEY || process.env.KONTENT_API_KEY;
  const environmentId = (import.meta as any).env?.VITE_KONTENT_ENVIRONMENT_ID || process.env.KONTENT_ENVIRONMENT_ID;

  if (!projectId) {
    return { error: 'Falta configurar el Project ID de Kontent.ai.' };
  }

  try {
    const url = `https://deliver.kontent.ai/${projectId}/items?system.type=page&elements=url_slug&limit=1000`;
    const res = await fetch(url, {
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
    if (!res.ok) {
      return { error: `Error al consultar la API: ${res.status} ${res.statusText}` };
    }
    const data = await res.json();
    const items = data.items || [];

    // Agrupar por slug
    const slugMap = new Map();
    for (const item of items) {
      const slug = item.elements.url_slug.value;
      if (!slugMap.has(slug)) slugMap.set(slug, []);
      slugMap.get(slug).push(item.system.name);
    }
    // Filtrar duplicados
    const duplicates = Array.from(slugMap.entries())
      .filter(([slug, arr]) => arr.length > 1)
      .map(([slug, arr]) => ({ slug, items: arr }));
    return { duplicates };
  } catch (err: any) {
    return { error: 'Error inesperado: ' + (err?.message || err) };
  }
}
*/

// Inicializar el custom app (opcional, para integración con Kontent)
// getCustomAppContext().then((response) => {
//   if (response.isError) {
//     console.error({ errorCode: response.code, description: response.description });
//   } else {
//     // Puedes usar response.config y response.context si lo necesitas
//     // console.log({ config: response.config, context: response.context });
//   }
// });
