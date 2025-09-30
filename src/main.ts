import './style.css';
import { getCustomAppContext } from '@kontent-ai/custom-app-sdk';

// Global configuration object
let appConfig = {
  projectId: '',
  deliveryApiKey: '',
  managementApiKey: ''
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
    managementApiKey: appConfig.managementApiKey ? '***PRESENT***' : 'NOT SET'
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

// Search by fetching all items and filtering - IMPROVED PAGINATION
async function searchAllItemsDeliveryApi(targetSlug: string) {
  try {
    console.log('\n--- Delivery API All Items Search (Full Pagination) ---');
    const headers: Record<string, string> = {};
    if (appConfig.deliveryApiKey) {
      headers['Authorization'] = `Bearer ${appConfig.deliveryApiKey}`;
    }
    
    let allItems: any[] = [];
    let skip = 0;
    const pageSize = 1000; // Max items per request
    let more = true;
    let totalRequests = 0;
    
    // Remove safety limit - fetch ALL items with proper pagination
    while (more) {
      totalRequests++;
      const url = `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements=url_slug,system&limit=${pageSize}&skip=${skip}`;
      console.log(`Request ${totalRequests}: ${url}`);
      
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Full API Response pagination:', data.pagination);
      
      const newItems = (data.items || []).filter(
        (item: any) => item.system?.type === 'page' && item.elements?.url_slug?.value
      );
      
      allItems = allItems.concat(newItems);
      console.log(`Request ${totalRequests}: Fetched ${newItems.length} page items with slugs, running total: ${allItems.length}`);
      console.log(`Raw items in this batch: ${data.items?.length || 0}`);
      
      // Better pagination logic based on Kontent.ai API
      if (data.pagination && data.pagination.next_page) {
        skip += pageSize;
        console.log(`More items available, next skip: ${skip}`);
      } else {
        console.log('No more pages available');
        more = false;
      }
      
      // Safety check to prevent infinite loops
      if (totalRequests > 50) {
        console.log('Safety limit reached (50 requests), stopping');
        break;
      }
    }
    
    console.log(`\n=== PAGINATION COMPLETE ===`);
    console.log(`Total API requests made: ${totalRequests}`);
    console.log(`Total page items with slugs: ${allItems.length}`);
    
    // Get all unique slugs for debugging
    const allSlugs = [...new Set(allItems.map(item => item.elements?.url_slug?.value).filter(Boolean))];
    console.log(`Total unique slugs: ${allSlugs.length}`);
    console.log('First 20 slugs:', allSlugs.slice(0, 20));
    
    // Look for the exact target slug
    const exactMatches = allSlugs.filter(slug => slug === targetSlug);
    console.log(`Exact slug matches for "${targetSlug}": ${exactMatches.length}`);
    
    // Look for similar slugs (case-insensitive)
    const similarSlugs = allSlugs.filter(slug => 
      slug && slug.toLowerCase().includes(targetSlug.toLowerCase())
    );
    console.log('Similar slugs (containing target):', similarSlugs);
    
    // Look for slugs containing 'meli' specifically
    const meliSlugs = allSlugs.filter(slug => 
      slug && slug.toLowerCase().includes('meli')
    );
    console.log('All slugs containing "meli":', meliSlugs);
    
    // Find exact matches in items
    const matchingItems = allItems.filter(
      (item: any) => item.elements?.url_slug?.value === targetSlug
    );
    
    console.log(`Found ${matchingItems.length} items with exact slug "${targetSlug}"`);
    
    // Also find case-insensitive matches
    const caseInsensitiveMatches = allItems.filter(
      (item: any) => item.elements?.url_slug?.value && 
                    item.elements.url_slug.value.toLowerCase() === targetSlug.toLowerCase()
    );
    
    console.log(`Found ${caseInsensitiveMatches.length} items with case-insensitive slug match`);
    
    return {
      success: true,
      items: matchingItems.map(formatItem),
      method: 'delivery-api-all-items',
      totalItems: allItems.length,
      totalRequests,
      exactMatches: exactMatches.length,
      similarSlugs,
      meliSlugs,
      caseInsensitiveMatches: caseInsensitiveMatches.length,
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
          Total API requests: ${debug.deliveryApiAllItems?.totalRequests || 0}<br>
          Total items fetched: ${debug.deliveryApiAllItems?.totalItems || 0}<br>
          Total unique slugs: ${debug.deliveryApiAllItems?.allSlugsCount || 0}<br>
          Exact slug matches: ${debug.deliveryApiAllItems?.exactMatches || 0}<br>
          Case-insensitive matches: ${debug.deliveryApiAllItems?.caseInsensitiveMatches || 0}<br>
          Similar slugs: ${debug.deliveryApiAllItems?.similarSlugs?.join(', ') || 'None'}<br>
          All "meli" slugs: ${debug.deliveryApiAllItems?.meliSlugs?.join(', ') || 'None'}<br>
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

// Find duplicate slugs with improved pagination
async function findDuplicateSlugs() {
  if (!appConfig.projectId) {
    return { error: 'Missing Kontent.ai Project ID configuration. Click "Show Config" to verify settings.' };
  }

  try {
    console.log('\n=== FINDING DUPLICATE SLUGS ===');
    const headers: Record<string, string> = {};
    if (appConfig.deliveryApiKey) {
      headers['Authorization'] = `Bearer ${appConfig.deliveryApiKey}`;
    }

    let items: any[] = [];
    let skip = 0;
    const pageSize = 1000;
    let more = true;
    let totalRequests = 0;

    // Fetch ALL page items with proper pagination
    while (more) {
      totalRequests++;
      const url = `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements=url_slug,system&limit=${pageSize}&skip=${skip}`;
      console.log(`Duplicate search request ${totalRequests}: ${url}`);
      
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return { error: `Error fetching from API: ${res.status} ${res.statusText}` };
      }
      
      const data = await res.json();
      console.log('Pagination info:', data.pagination);
      
      const newItems = (data.items || []).filter(
        (item: any) => item.system?.type === 'page' && item.elements?.url_slug?.value
      );
      
      items = items.concat(newItems);
      console.log(`Request ${totalRequests}: Found ${newItems.length} page items with slugs, total: ${items.length}`);
      
      // Better pagination logic
      if (data.pagination && data.pagination.next_page) {
        skip += pageSize;
        console.log(`More pages available, next skip: ${skip}`);
      } else {
        console.log('No more pages - pagination complete');
        more = false;
      }
      
      // Safety check
      if (totalRequests > 50) {
        console.log('Safety limit reached, stopping pagination');
        break;
      }
    }

    console.log(`\n=== DUPLICATE ANALYSIS ===`);
    console.log(`Total requests made: ${totalRequests}`);
    console.log(`Total page items with slugs: ${items.length}`);

    // Group by slug
    const slugMap = new Map();
    for (const item of items) {
      const slug = item.elements.url_slug.value;
      if (!slugMap.has(slug)) slugMap.set(slug, []);
      slugMap.get(slug).push({
        name: item.system.name,
        codename: item.system.codename,
        language: item.system.language
      });
    }
    
    // Filter duplicates
    const duplicates = Array.from(slugMap.entries())
      .filter(([slug, arr]) => arr.length > 1)
      .map(([slug, arr]) => ({ slug, items: arr }));
    
    console.log(`Found ${duplicates.length} duplicate slugs`);
    duplicates.forEach(d => {
      console.log(`- "${d.slug}": ${d.items.length} items`);
    });

    return { 
      duplicates,
      totalItems: items.length,
      totalRequests,
      uniqueSlugs: slugMap.size
    };
  } catch (err: any) {
    console.error('Duplicate search error:', err);
    return { error: 'Unexpected error: ' + (err?.message || err) };
  }
}

// Display duplicate results with enhanced statistics
function displayDuplicateResults(result: any) {
  if ('error' in result) {
    resultDiv.innerHTML = `<p style="color:red; background:#ffe6e6; padding:10px; border-radius:4px;"><strong>Error:</strong> ${result.error}</p>`;
    return;
  }
  
  const duplicates = result.duplicates || [];
  const stats = `
    <div style="background:#e7f3ff; padding:15px; margin-bottom:20px; border-radius:4px; border:1px solid #b3d9ff;">
      <h3 style="margin-top:0; color:#0066cc;">Search Statistics</h3>
      <div style="font-size:14px;">
        <strong>Total API requests:</strong> ${result.totalRequests || 'N/A'}<br>
        <strong>Total page items processed:</strong> ${result.totalItems || 'N/A'}<br>
        <strong>Unique slugs found:</strong> ${result.uniqueSlugs || 'N/A'}<br>
        <strong>Duplicate slugs found:</strong> ${duplicates.length}<br>
      </div>
      <div style="margin-top:10px; font-size:12px; color:#666;">
        Check browser console for detailed pagination logs
      </div>
    </div>
  `;
  
  if (duplicates.length === 0) {
    resultDiv.innerHTML = stats + `
      <div style="padding:20px; background:#fff3cd; border:1px solid #ffeaa7; border-radius:4px; color:#856404;">
        <h3 style="margin-top:0;">✅ No Duplicate Slugs Found</h3>
        <p>All page slugs in your environment are unique!</p>
      </div>
    `;
  } else {
    resultDiv.innerHTML = stats + `
      <div style="padding:20px; background:#f8d7da; border:1px solid #f5c6cb; border-radius:4px; color:#721c24;">
        <h2 style="margin-top:0;">⚠️ Found ${duplicates.length} Duplicate Slug${duplicates.length > 1 ? 's' : ''}</h2>
        ${duplicates.map((d: any) => `
          <div style="margin:15px 0; padding:15px; background:white; border:1px solid #ddd; border-radius:4px;">
            <div style="margin-bottom:10px;"><strong>Duplicate Slug:</strong> <span style="color:#0078d4; font-weight:bold; font-family:monospace;">${d.slug}</span></div>
            <div><strong>Pages using this slug (${d.items.length} total):</strong></div>
            <ul style="margin:10px 0; padding-left:20px;">
              ${d.items.map((item: any) => `
                <li style="margin:5px 0;">
                  <strong>${item.name || item}</strong>
                  ${item.codename ? `<br><small style="color:#666;">Codename: ${item.codename}</small>` : ''}
                  ${item.language ? `<br><small style="color:#666;">Language: ${item.language}</small>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;
  }
}
