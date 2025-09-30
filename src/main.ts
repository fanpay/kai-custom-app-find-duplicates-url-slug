import './style.css';
import { getCustomAppContext } from '@kontent-ai/custom-app-sdk';

const app = document.getElementById('app');
if (app) {
  app.innerHTML = `
    <h1 style="color: green">Find duplicate slugs</h1>
    <button id="find-btn">Find duplicates</button>
    <div id="result"></div>
  `;
}

const resultDiv = document.getElementById('result')!;
const findBtn = document.getElementById('find-btn')!;

findBtn.addEventListener('click', async () => {
  resultDiv.innerHTML = 'Searching...';
  const result = await findDuplicateSlugs();
  if ('error' in result) {
    resultDiv.innerHTML = `<p style="color:red">${result.error}</p>`;
    return;
  }
  const duplicates = result.duplicates || [];
  if (duplicates.length === 0) {
    resultDiv.innerHTML = '<p>No duplicate slug matches found.</p>';
  } else {
    resultDiv.innerHTML = '<h2>Duplicate slugs:</h2>' +
      duplicates.map((d: any) => `<div><b>${d.slug}</b>:<ul>${d.items.map((i: string) => `<li>${i}</li>`).join('')}</ul></div>`).join('');
  }
});

async function findDuplicateSlugs() {
  // Use the Kontent.ai context if available
  let projectId = (import.meta as any).env?.VITE_KONTENT_PROJECT_ID || process.env.KONTENT_PROJECT_ID;
  let apiKey = (import.meta as any).env?.VITE_KONTENT_API_KEY || process.env.KONTENT_API_KEY;

  try {
    const ctx = await getCustomAppContext();
    if (!ctx.isError && ctx.context?.environmentId) {
      projectId = ctx.context.environmentId;
    }
    // If you have config with apiKey, you can use it here
    // if (ctx.config?.apiKey) apiKey = ctx.config.apiKey;
  } catch {}

  if (!projectId) {
    return { error: 'Missing Kontent.ai Project ID configuration.' };
  }

  try {
    const url = `https://deliver.kontent.ai/${projectId}/items?system.type=page&elements=url_slug&limit=1000`;
    const res = await fetch(url, {
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
    if (!res.ok) {
      return { error: `Error fetching from API: ${res.status} ${res.statusText}` };
    }
    const data = await res.json();
    const items = data.items || [];

    // Group by slug
    const slugMap = new Map();
    for (const item of items) {
        const slug = item.elements?.url_slug?.value;
      if (!slugMap.has(slug)) slugMap.set(slug, []);
      slugMap.get(slug).push(item.system.name);
    }
    // Filter duplicates
    const duplicates = Array.from(slugMap.entries())
      .filter(([slug, arr]) => arr.length > 1)
      .map(([slug, arr]) => ({ slug, items: arr }));
    return { duplicates };
  } catch (err: any) {
    return { error: 'Unexpected error: ' + (err?.message || err) };
  }
}