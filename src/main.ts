import './style.css';
import { getCustomAppContext } from '@kontent-ai/custom-app-sdk';

// Global configuration object
let appConfig = {
  projectId: '',
  deliveryApiKey: '',
  managementApiKey: '',
  previewApiKey: ''
};

const app = document.getElementById('app');
if (app) {
  app.innerHTML = `
    <h1 style="color: green">Find Duplicate Slugs - Debug Version</h1>
    <div style="margin-bottom: 20px;">
      <button id="config-btn" style="background-color: #007ACC; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">Show Config</button>
      <button id="test-btn" style="background-color: #f0ad4e; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">Test: meli-qa-page-2</button>
      <button id="find-btn" style="background-color: #5cb85c; color: white; border: none; padding: 8px 16px; border-radius: 4px;">Find All Duplicates</button>
    </div>
    <div id="result"></div>
  `;
}

const resultDiv = document.getElementById('result')!;
const configBtn = document.getElementById('config-btn')!;
const testBtn = document.getElementById('test-btn')!;
const findBtn = document.getElementById('find-btn')!;

// Initialize configuration on load
initializeConfig();

configBtn.addEventListener('click', async () => {
  resultDiv.innerHTML = 'Loading configuration...';
  await initializeConfig();
  displayConfiguration();
});

testBtn.addEventListener('click', async () => {
  resultDiv.innerHTML = 'Searching for specific slug: meli-qa-page-2...';
  await initializeConfig();
  const result = await searchSpecificSlug('meli-qa-page-2');
  displaySearchResults(result, 'meli-qa-page-2');
});

findBtn.addEventListener('click', async () => {
  resultDiv.innerHTML = 'Searching for duplicate slugs...';
  await initializeConfig();
  const result = await findDuplicateSlugs();
  displayDuplicateResults(result);
});

// Initialize configuration from environment and Kontent.ai context
async function initializeConfig() {
  // Get environment variables
  appConfig.projectId = (import.meta as any).env?.VITE_KONTENT_PROJECT_ID || process.env.KONTENT_PROJECT_ID || '';
  appConfig.deliveryApiKey = (import.meta as any).env?.VITE_KONTENT_API_KEY || process.env.KONTENT_API_KEY || '';
  appConfig.managementApiKey = (import.meta as any).env?.VITE_KONTENT_MANAGEMENT_API_KEY || process.env.KONTENT_MANAGEMENT_API_KEY || '';
  appConfig.previewApiKey = (import.meta as any).env?.VITE_KONTENT_PREVIEW_API_KEY || process.env.KONTENT_PREVIEW_API_KEY || '';

  // Try to get context from Kontent.ai Custom App SDK
  try {
    const ctx = await getCustomAppContext();
    console.log('Custom App Context:', ctx);
    if (!ctx.isError && ctx.context?.environmentId) {
      appConfig.projectId = ctx.context.environmentId;
      console.log('Using project ID from Kontent.ai context:', appConfig.projectId);
    }
  } catch (error) {
    console.log('Could not get Custom App context:', error);
  }

  console.log('Final configuration:', {
    projectId: appConfig.projectId || 'NOT SET',
    deliveryApiKey: appConfig.deliveryApiKey ? '***PRESENT***' : 'NOT SET',
    managementApiKey: appConfig.managementApiKey ? '***PRESENT***' : 'NOT SET',
    previewApiKey: appConfig.previewApiKey ? '***PRESENT***' : 'NOT SET'
  });
}

// Display current configuration
function displayConfiguration() {
  resultDiv.innerHTML = `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
      <h2 style="color: #495057; margin-top: 0;">Current Configuration</h2>
      
      <div style="margin-bottom: 15px;">
        <strong>Environment/Project ID:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${appConfig.projectId || '<span style="color: red;">NOT SET</span>'}
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Delivery API Key:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${appConfig.deliveryApiKey ? '<span style="color: green;">✓ Present</span>' : '<span style="color: red;">✗ Not Set</span>'}
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Management API Key:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${appConfig.managementApiKey ? '<span style="color: green;">✓ Present</span>' : '<span style="color: red;">✗ Not Set</span>'}
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Preview API Key:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${appConfig.previewApiKey ? '<span style="color: green;">✓ Present</span>' : '<span style="color: red;">✗ Not Set</span>'}
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 10px; background: #d1ecf1; border-radius: 4px; font-size: 14px;">
        <strong>Note:</strong> Check the browser console for detailed configuration logs.
      </div>
    </div>
  `;
}

// Search for items with specific slug using multiple API approaches
async function searchSpecificSlug(targetSlug: string) {
  if (!appConfig.projectId) {
    return { error: 'Missing Kontent.ai Project ID configuration. Click "Show Config" to verify settings.' };
  }

  try {
    console.log(`\n=== SEARCHING FOR SLUG: "${targetSlug}" ===`);
    
    // Try multiple API endpoints and approaches
    const results = {
      deliveryApi: await searchWithDeliveryApi(targetSlug),
      deliveryApiAllItems: await searchAllItemsDeliveryApi(targetSlug),
      managementApi: appConfig.managementApiKey ? await searchWithManagementApi(targetSlug) : null
    };
    
    console.log('All search results:', results);
    
    // Combine all results
    const allItems = [];
    if (results.deliveryApi.items) allItems.push(...results.deliveryApi.items);
    if (results.deliveryApiAllItems.items) allItems.push(...results.deliveryApiAllItems.items);
    if (results.managementApi?.items) allItems.push(...results.managementApi.items);
    
    // Remove duplicates based on codename
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex(i => i.codename === item.codename)
    );
    
    return {
      items: uniqueItems,
      debug: {
        deliveryApi: results.deliveryApi,
        deliveryApiAllItems: results.deliveryApiAllItems,
        managementApi: results.managementApi,
        totalUniqueItems: uniqueItems.length
      }
    };
  } catch (err: any) {
    return { error: 'Unexpected error: ' + (err?.message || err) };
  }
}

// Search using Delivery API with direct filtering
async function searchWithDeliveryApi(targetSlug: string) {
  try {
    console.log('\n--- Delivery API Direct Search ---');
    const headers: Record<string, string> = {};
    if (appConfig.deliveryApiKey) {
      headers['Authorization'] = `Bearer ${appConfig.deliveryApiKey}`;
    }
    
    // Try different URL parameter approaches
    const searchUrls = [
      `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements.url_slug=${encodeURIComponent(targetSlug)}`,
      `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements.url_slug[eq]=${encodeURIComponent(targetSlug)}`,
      `https://deliver.kontent.ai/${appConfig.projectId}/items?elements.url_slug=${encodeURIComponent(targetSlug)}`
    ];
    
    for (const url of searchUrls) {
      console.log('Trying URL:', url);
      const res = await fetch(url, { headers });
      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Response data:', data);
        
        const items = (data.items || []).filter(
          (item: any) => item.system?.type === 'page' && 
                        item.elements?.url_slug?.value === targetSlug
        );
        
        if (items.length > 0) {
          return {
            success: true,
            items: items.map(formatItem),
            method: 'delivery-api-direct',
            url
          };
        }
      }
    }
    
    return { success: false, items: [], method: 'delivery-api-direct' };
  } catch (error) {
    console.error('Delivery API direct search error:', error);
    return { 
      success: false, 
      items: [], 
      error: error instanceof Error ? error.message : String(error), 
      method: 'delivery-api-direct' 
    };
  }
}

// Search by fetching all items and filtering
async function searchAllItemsDeliveryApi(targetSlug: string) {
  try {
    console.log('\n--- Delivery API All Items Search ---');
    const headers: Record<string, string> = {};
    if (appConfig.deliveryApiKey) {
      headers['Authorization'] = `Bearer ${appConfig.deliveryApiKey}`;
    }
    
    let allItems: any[] = [];
    let skip = 0;
    const pageSize = 1000;
    let more = true;
    
    while (more && allItems.length < 5000) { // Safety limit
      const url = `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements=url_slug&limit=${pageSize}&skip=${skip}`;
      console.log('Fetching:', url);
      
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const newItems = (data.items || []).filter(
        (item: any) => item.system?.type === 'page' && item.elements?.url_slug?.value
      );
      
      allItems = allItems.concat(newItems);
      console.log(`Fetched ${newItems.length} items, total: ${allItems.length}`);
      
      if (data.pagination?.next_page && newItems.length === pageSize) {
        skip += pageSize;
      } else {
        more = false;
      }
    }
    
    // Get all unique slugs for debugging
    const allSlugs = [...new Set(allItems.map(item => item.elements?.url_slug?.value).filter(Boolean))];
    console.log(`Total unique slugs: ${allSlugs.length}`);
    console.log('Sample slugs:', allSlugs.slice(0, 20));
    
    // Look for similar slugs
    const similarSlugs = allSlugs.filter(slug => 
      slug && (slug.toLowerCase().includes(targetSlug.toLowerCase()) || 
              targetSlug.toLowerCase().includes(slug.toLowerCase()))
    );
    console.log('Similar slugs:', similarSlugs);
    
    // Find exact matches
    const matchingItems = allItems.filter(
      (item: any) => item.elements?.url_slug?.value === targetSlug
    );
    
    console.log(`Found ${matchingItems.length} exact matches for "${targetSlug}"`);
    
    return {
      success: true,
      items: matchingItems.map(formatItem),
      method: 'delivery-api-all-items',
      totalItems: allItems.length,
      similarSlugs,
      allSlugsCount: allSlugs.length
    };
  } catch (error) {
    console.error('Delivery API all items search error:', error);
    return { 
      success: false, 
      items: [], 
      error: error instanceof Error ? error.message : String(error), 
      method: 'delivery-api-all-items' 
    };
  }
}

// Search using Management API (if key is available)
async function searchWithManagementApi(targetSlug: string) {
  try {
    console.log('\n--- Management API Search ---');
    const headers = {
      'Authorization': `Bearer ${appConfig.managementApiKey}`,
      'Content-Type': 'application/json'
    };
    
    const url = `https://manage.kontent.ai/v2/projects/${appConfig.projectId}/items`;
    console.log('Management API URL:', url);
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Management API Error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Management API response:', data);
    
    // Note: Management API returns different structure, you'd need to fetch language variants too
    return {
      success: true,
      items: [], // Would need additional processing
      method: 'management-api',
      note: 'Management API integration needs additional implementation for language variants'
    };
  } catch (error) {
    console.error('Management API search error:', error);
    return { 
      success: false, 
      items: [], 
      error: error instanceof Error ? error.message : String(error), 
      method: 'management-api' 
    };
  }
}

// Format item for consistent display
function formatItem(item: any) {
  return {
    name: item.system?.name || 'Unknown',
    codename: item.system?.codename || 'Unknown',
    type: item.system?.type || 'Unknown',
    language: item.system?.language || 'Unknown',
    slug: item.elements?.url_slug?.value || 'No slug'
  };
}

// Display search results
function displaySearchResults(result: any, targetSlug: string) {
  if ('error' in result) {
    resultDiv.innerHTML = `<p style="color:red; background:#ffe6e6; padding:10px; border-radius:4px;"><strong>Error:</strong> ${result.error}</p>`;
    return;
  }
  
  const items = result.items || [];
  const debug = result.debug;
  
  let debugInfo = '';
  if (debug) {
    debugInfo = `
      <div style="background:#f8f9fa; padding:15px; margin:15px 0; border-radius:4px; border:1px solid #dee2e6;">
        <h3 style="margin-top:0; color:#495057;">Debug Information</h3>
        
        <h4>Delivery API Direct Search:</h4>
        <div style="font-size:12px; margin-bottom:10px;">
          Success: ${debug.deliveryApi?.success ? '✅' : '❌'}<br>
          Items found: ${debug.deliveryApi?.items?.length || 0}<br>
          Method: ${debug.deliveryApi?.method}<br>
          ${debug.deliveryApi?.url ? `URL: ${debug.deliveryApi.url}` : ''}
        </div>
        
        <h4>Delivery API All Items Search:</h4>
        <div style="font-size:12px; margin-bottom:10px;">
          Success: ${debug.deliveryApiAllItems?.success ? '✅' : '❌'}<br>
          Items found: ${debug.deliveryApiAllItems?.items?.length || 0}<br>
          Total items fetched: ${debug.deliveryApiAllItems?.totalItems || 0}<br>
          Similar slugs: ${debug.deliveryApiAllItems?.similarSlugs?.join(', ') || 'None'}<br>
        </div>
        
        ${debug.managementApi ? `
          <h4>Management API Search:</h4>
          <div style="font-size:12px;">
            Success: ${debug.managementApi.success ? '✅' : '❌'}<br>
            Note: ${debug.managementApi.note || 'No additional info'}
          </div>
        ` : ''}
        
        <div style="margin-top:10px; font-size:11px; color:#6c757d;">
          Check browser console for detailed logs
        </div>
      </div>
    `;
  }
  
  if (items.length === 0) {
    resultDiv.innerHTML = `
      <div style="padding:20px; background:#fff3cd; border:1px solid #ffeaa7; border-radius:4px; color:#856404;">
        <h3 style="margin-top:0;">No Results Found</h3>
        <p>No pages found with slug "<strong>${targetSlug}</strong>".</p>
        ${debugInfo}
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div style="padding:20px; background:#d4edda; border:1px solid #c3e6cb; border-radius:4px; color:#155724;">
        <h2 style="margin-top:0;">✅ Found ${items.length} page(s) with slug "${targetSlug}"</h2>
        ${items.map((item: any) => `
          <div style="margin:15px 0; padding:15px; background:white; border:1px solid #ddd; border-radius:4px;">
            <div><strong>Name:</strong> ${item.name}</div>
            <div><strong>Codename:</strong> ${item.codename}</div>
            <div><strong>Type:</strong> ${item.type}</div>
            <div><strong>Language:</strong> ${item.language}</div>
            <div><strong>Slug:</strong> <span style="color:#0078d4; font-weight:bold;">${item.slug}</span></div>
          </div>
        `).join('')}
      </div>
      ${debugInfo}
    `;
  }
}

// Original duplicate finding function (simplified)
async function findDuplicateSlugs() {
  if (!appConfig.projectId) {
    return { error: 'Missing Kontent.ai Project ID configuration. Click "Show Config" to verify settings.' };
  }

  try {
    const headers: Record<string, string> = {};
    if (appConfig.deliveryApiKey) {
      headers['Authorization'] = `Bearer ${appConfig.deliveryApiKey}`;
    }

    let items: any[] = [];
    let skip = 0;
    const pageSize = 1000;
    let more = true;

    while (more) {
      const url = `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements=url_slug&limit=${pageSize}&skip=${skip}`;
      const res = await fetch(url, { headers });
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

// Display duplicate results
function displayDuplicateResults(result: any) {
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
}
