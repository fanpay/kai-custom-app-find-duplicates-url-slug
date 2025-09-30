import './style.css';
import { getCustomAppContext } from '@kontent-ai/custom-app-sdk';

const app = document.getElementById('app');
if (app) {
  app.innerHTML = `
    <h1 style="color: green">Find duplicate slugs</h1>
    <button id="find-btn">Find duplicates</button>
    <button id="test-btn" style="margin-left: 10px; background-color: #f0ad4e; color: white; border: none; padding: 8px 16px; border-radius: 4px;">Test: meli-qa-page-2</button>
    <div id="result"></div>
  `;
}

const resultDiv = document.getElementById('result')!;
const findBtn = document.getElementById('find-btn')!;
const testBtn = document.getElementById('test-btn')!;

findBtn.addEventListener('click', async () => {
  resultDiv.innerHTML = 'Searching...';
  const result = await findDuplicateSlugs();
  if ('error' in result) {
    resultDiv.innerHTML = `<p style="color:red">${result.error}</p>`;
    return;
  }
  const duplicates = result.duplicates || [];
  if (duplicates.length === 0) {
    resultDiv.innerHTML = '<p>There are no duplicate slug matches.</p>';
  } else {
    resultDiv.innerHTML = '<h2>Duplicate slugs found:</h2>' +
      duplicates.map((d: any) => `
        <div style="margin-bottom:1.5em;">
          <div><b>Slug:</b> <span style="color:#0078d4">${d.slug}</span></div>
          <div><b>Pages with this slug:</b></div>
          <ul>${d.items.map((i: string) => `<li>${i}</li>`).join('')}</ul>
        </div>
      `).join('');
  }
});

testBtn.addEventListener('click', async () => {
  resultDiv.innerHTML = 'Searching for specific slug: meli-qa-page-2...';
  const result = await searchSpecificSlug('meli-qa-page-2');
  if ('error' in result) {
    resultDiv.innerHTML = `<p style="color:red">${result.error}</p>`;
    return;
  }
  const items = result.items || [];
  if (items.length === 0) {
    resultDiv.innerHTML = '<p>No pages found with slug "meli-qa-page-2".</p>';
  } else {
    resultDiv.innerHTML = `<h2>Pages found with slug "meli-qa-page-2" (${items.length} items):</h2>` +
      items.map((item: any) => `
        <div style="margin-bottom:1em; padding:10px; border:1px solid #ddd; border-radius:4px;">
          <div><b>Name:</b> ${item.name}</div>
          <div><b>Codename:</b> ${item.codename}</div>
          <div><b>Type:</b> ${item.type}</div>
          <div><b>Language:</b> ${item.language}</div>
          <div><b>Slug:</b> <span style="color:#0078d4">${item.slug}</span></div>
        </div>
      `).join('');
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
    // if (ctx.config?.apiKey) apiKey = ctx.config.apiKey;
  } catch {}

  if (!projectId) {
    return { error: 'Missing Kontent.ai Project ID configuration.' };
  }

  try {
    let items: any[] = [];
    let skip = 0;
    const pageSize = 1000;
    let more = true;

    while (more) {
      const url = `https://deliver.kontent.ai/${projectId}/items?system.type=page&elements=url_slug&limit=${pageSize}&skip=${skip}`;
      const res = await fetch(url, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
      });
      if (!res.ok) {
        return { error: `Error fetching from API: ${res.status} ${res.statusText}` };
      }
      const data = await res.json();
      const newItems = (data.items || []).filter(
        (item: any) => item.system?.type === 'page' && item.elements?.url_slug?.value
      );
      items = items.concat(newItems);
      if (data.pagination?.next_page) {
        skip += pageSize;
      } else {
        more = false;
      }
    }

    // Group by slug
    const slugMap = new Map();
    for (const item of items) {
      const slug = item.elements.url_slug.value;
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

async function searchSpecificSlug(targetSlug: string) {
  // Use the Kontent.ai context if available
  let projectId = (import.meta as any).env?.VITE_KONTENT_PROJECT_ID || process.env.KONTENT_PROJECT_ID;
  let apiKey = (import.meta as any).env?.VITE_KONTENT_API_KEY || process.env.KONTENT_API_KEY;

  try {
    const ctx = await getCustomAppContext();
    if (!ctx.isError && ctx.context?.environmentId) {
      projectId = ctx.context.environmentId;
    }
    // if (ctx.config?.apiKey) apiKey = ctx.config.apiKey;
  } catch {}

  if (!projectId) {
    return { error: 'Missing Kontent.ai Project ID configuration.' };
  }

  try {
    let items: any[] = [];
    let skip = 0;
    const pageSize = 1000;
    let more = true;

    while (more) {
      // Search for content items with specific slug and type 'page'
      const url = `https://deliver.kontent.ai/${projectId}/items?system.type=page&elements.url_slug=${encodeURIComponent(targetSlug)}&elements=url_slug&limit=${pageSize}&skip=${skip}`;
      const res = await fetch(url, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
      });
      if (!res.ok) {
        return { error: `Error fetching from API: ${res.status} ${res.statusText}` };
      }
      const data = await res.json();
      const newItems = (data.items || []).filter(
        (item: any) => item.system?.type === 'page' && 
                      item.elements?.url_slug?.value &&
                      item.elements.url_slug.value === targetSlug
      );
      items = items.concat(newItems);
      if (data.pagination?.next_page) {
        skip += pageSize;
      } else {
        more = false;
      }
    }

    // Map items to more readable format
    const formattedItems = items.map(item => ({
      name: item.system.name,
      codename: item.system.codename,
      type: item.system.type,
      language: item.system.language,
      slug: item.elements.url_slug.value
    }));

    return { items: formattedItems };
  } catch (err: any) {
    return { error: 'Unexpected error: ' + (err?.message || err) };
  }
}
