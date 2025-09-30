/**
 * UI components and rendering functions
 */

import { ApiResult, ContentItem, DuplicateResult } from '../types';
import { getConfigStatus } from '../config';

/**
 * Create and inject CSS styles into the page
 */
export function addStyles(): void {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    .title {
      color: #2c5282;
      margin-bottom: 24px;
    }
    
    .button-group {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .button {
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, box-shadow 0.2s, transform 0.02s;
    }
    
    .button:hover {
      opacity: 0.95;
    }

    .button:active {
      transform: translateY(1px);
    }
    
    .button-primary {
      background-color: #3182ce;
      color: white;
    }
    
    .button-warning {
      background-color: #ed8936;
      color: white;
    }
    
    .button-success {
      background-color: #38a169;
      color: white;
    }

    .button-search {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .button-search:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transform: translateY(-1px);
    }

    /* Search section styles */
    .search-section {
      margin: 20px 0;
      padding: 20px;
      background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 12px;
      border: 1px solid #cbd5e0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .search-input-group {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Slug search input styles */
    .slug-input {
      min-width: 300px;
      padding: 12px 16px;
      border: 2px solid #cbd5e0;
      border-radius: 8px;
      font-size: 16px;
      outline: none;
      transition: all 0.3s ease;
      background: #fff;
      color: #1a202c;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
    }

    .slug-input::placeholder {
      color: #a0aec0;
      font-style: italic;
    }

    .slug-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.25), inset 0 1px 3px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }

    @media (max-width: 640px) {
      .search-input-group {
        flex-direction: column;
        gap: 16px;
      }
      
      .slug-input {
        min-width: 100%;
        width: 100%;
      }
      
      .button-search {
        width: 100%;
        padding: 12px 16px;
      }
    }
    
    .result-container {
      margin-top: 20px;
      padding: 20px;
      border-radius: 8px;
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
    }
    
    .config-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
      margin-bottom: 20px;
    }
    
    .debug-section {
      background: #f8f9fa;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
      border: 1px solid #dee2e6;
      font-size: 14px;
    }
    
    .status-success {
      padding: 20px;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      color: #155724;
    }
    
    .status-warning {
      padding: 20px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      color: #856404;
    }
    
    .status-error {
      padding: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      color: #721c24;
    }
    
    .item-card {
      margin: 15px 0;
      padding: 15px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .slug-value {
      color: #0078d4;
      font-weight: bold;
      font-family: monospace;
    }
    
    .stats-box {
      background: #e7f3ff;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
      border: 1px solid #b3d9ff;
    }

    /* Language grouping styles */
    .language-group {
      margin: 20px 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .language-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      padding: 12px 16px;
      font-size: 16px;
      font-weight: 600;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .language-badge {
      background: #667eea;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .item-details {
      display: grid;
      gap: 4px;
      font-size: 14px;
    }

    /* Duplicate cards styles */
    .duplicate-card {
      margin: 20px 0;
      background: white;
      border: 2px solid #fed7d7;
      border-radius: 8px;
      overflow: hidden;
    }

    .duplicate-header {
      background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .duplicate-header h4 {
      margin: 0;
      font-size: 18px;
    }

    .duplicate-stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .stat-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
    }

    .stat-danger {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .stat-info {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .duplicate-languages {
      padding: 16px;
    }

    .language-section {
      margin: 16px 0;
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .language-title {
      margin: 0 0 8px 0;
      color: #4a5568;
      font-size: 14px;
      font-weight: 600;
    }

    .items-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .duplicate-item {
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .duplicate-item:last-child {
      border-bottom: none;
    }

    .item-name {
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 4px;
    }

    .item-meta {
      font-size: 12px;
      color: #718096;
      margin: 2px 0;
    }

    .field-type {
      background: #e2e8f0;
      padding: 1px 6px;
      border-radius: 3px;
      font-family: monospace;
    }

    /* Search statistics styles */
    .search-stats {
      display: flex;
      gap: 20px;
      margin: 16px 0;
      padding: 16px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .stat-item {
      text-align: center;
      flex: 1;
    }

    .stat-number {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: #22543d;
      line-height: 1;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #4a5568;
      font-weight: 500;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .languages-found {
      margin: 16px 0;
      padding: 12px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .lang-pill {
      display: inline-block;
      background: #4299e1;
      color: white;
      padding: 4px 12px;
      margin: 0 4px 4px 0;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
    }
  `;
  document.head.appendChild(styleElement);
}

/**
 * Create the main UI structure
 */
export function createMainUI(): string {
  return `
    <div class="container">
      <h1 class="title">Find Duplicate Slugs - Kontent.ai</h1>
      
      <div class="button-group">
        <button id="config-btn" class="button button-primary">Show Config</button>
        <button id="search-btn" class="button button-warning">Search Slug</button>
        <button id="find-btn" class="button button-success">Find All Duplicates</button>
      </div>
      
      <div id="search-section" class="search-section" style="display: none;">
        <div class="search-input-group">
          <input id="slug-input" type="text" placeholder="Enter slug to search..." class="slug-input" />
          <button id="execute-search-btn" class="button button-search">🔍 Execute Search</button>
        </div>
      </div>
      
      <div id="result" class="result-container"></div>
    </div>
  `;
}

/**
 * Render configuration display
 */
export function renderConfiguration(): string {
  const config = getConfigStatus();
  
  return `
    <div class="config-section">
      <h2 style="color: #495057; margin-top: 0;">Current Configuration</h2>
      
      <div style="margin-bottom: 15px;">
        <strong>Environment/Project ID:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${config.projectId || '<span style="color: red;">NOT SET</span>'}
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Delivery API Key:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${config.deliveryApiKey ? '<span style="color: green;">✓ Present</span>' : '<span style="color: red;">✗ Not Set</span>'}
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Management API Key:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${config.managementApiKey ? '<span style="color: green;">✓ Present</span>' : '<span style="color: red;">✗ Not Set</span>'}
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Preview API Key:</strong>
        <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 5px;">
          ${config.previewApiKey ? '<span style="color: green;">✓ Present</span>' : '<span style="color: red;">✗ Not Set</span>'}
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 10px; background: #d1ecf1; border-radius: 4px; font-size: 14px;">
        <strong>Note:</strong> Check the browser console for detailed configuration logs.
      </div>
    </div>
  `;
}

/**
 * Render search results
 */
export function renderSearchResults(result: ApiResult, targetSlug: string): string {
  if ('error' in result && result.error) {
    return `<p style="color:red; background:#ffe6e6; padding:10px; border-radius:4px;"><strong>Error:</strong> ${result.error}</p>`;
  }
  
  const items = result.items || [];
  const debugInfo = renderDebugInfo(result);
  
  if (items.length === 0) {
    return `
      <div class="status-warning">
        <h3 style="margin-top:0;">No Results Found</h3>
        <p>No pages found with slug "<strong>${targetSlug}</strong>" in any language.</p>
        <p style="color:#666; font-style:italic; margin-top:12px;">The search looks for exact matches across all available languages in your Kontent.ai project.</p>
      </div>
      ${debugInfo}
    `;
  } else {
    // Calculate language statistics
    const languageCount = new Set(items.map(item => item.language)).size;
    const languageList = [...new Set(items.map(item => item.language))].sort();
    
    return `
      <div class="status-success">
        <h2 style="margin-top:0;">✅ Found ${items.length} page(s) with slug "${targetSlug}"</h2>
        <div class="search-stats">
          <div class="stat-item">
            <span class="stat-number">${items.length}</span>
            <span class="stat-label">Total Items</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${languageCount}</span>
            <span class="stat-label">Language${languageCount > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="languages-found">
          <strong>Languages found:</strong> ${languageList.map(lang => `<span class="lang-pill">${lang}</span>`).join(' ')}
        </div>
        ${renderItemCards(items)}
      </div>
      ${debugInfo}
    `;
  }
}

/**
 * Render duplicate results
 */
export function renderDuplicateResults(result: DuplicateResult): string {
  if ('error' in result && result.error) {
    return `<p style="color:red; background:#ffe6e6; padding:10px; border-radius:4px;"><strong>Error:</strong> ${result.error}</p>`;
  }
  
  const duplicates = result.duplicates || [];
  const statsHtml = renderStatsBox(result);
  
  if (duplicates.length === 0) {
    return statsHtml + `
      <div class="status-warning">
        <h3 style="margin-top:0;">✅ No Duplicate Slugs Found</h3>
        <p>All page slugs in your environment are unique!</p>
      </div>
    `;
  } else {
    return statsHtml + `
      <div class="status-error">
        <h2 style="margin-top:0;">⚠️ Found ${duplicates.length} Duplicate Slug${duplicates.length > 1 ? 's' : ''}</h2>
        ${renderDuplicateCards(duplicates)}
      </div>
    `;
  }
}

/**
 * Render debug information section
 */
function renderDebugInfo(result: ApiResult): string {
  const debug = result as any;
  
  if (!debug) return '';
  
  return `
    <div class="debug-section">
      <h3 style="margin-top:0; color:#495057;">Debug Information</h3>
      
      <h4>Delivery API Direct Search:</h4>
      <div style="font-size:12px; margin-bottom:10px;">
        Success: ${debug.deliveryApi?.success ? '✅' : '❌'}<br>
        Items found: ${debug.deliveryApi?.items?.length || 0}<br>
        Method: ${debug.deliveryApi?.method}<br>
        Field used: ${debug.deliveryApi?.field || 'None'}<br>
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

/**
 * Render item cards
 */
function renderItemCards(items: ContentItem[]): string {
  // Group items by language for better organization
  const itemsByLanguage = items.reduce((acc, item) => {
    const lang = item.language || 'Unknown';
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  // Generate HTML for each language group
  const languageGroups = Object.entries(itemsByLanguage)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([language, langItems]) => `
      <div class="language-group">
        <h4 class="language-header">🌐 Language: ${language} (${langItems.length} item${langItems.length > 1 ? 's' : ''})</h4>
        ${langItems.map((item: ContentItem) => `
          <div class="item-card">
            <div class="item-header">
              <strong>${item.name}</strong>
              <span class="language-badge">${item.language}</span>
            </div>
            <div class="item-details">
              <div><strong>Codename:</strong> <code>${item.codename}</code></div>
              <div><strong>Type:</strong> ${item.type}</div>
              <div><strong>Slug:</strong> <span class="slug-value">${item.slug}</span></div>
              <div><strong>Field type:</strong> <span style="font-family:monospace; color:#666;">${item.slugField}</span></div>
            </div>
          </div>
        `).join('')}
      </div>
    `);

  return languageGroups.join('');
}

/**
 * Render duplicate cards
 */
function renderDuplicateCards(duplicates: any[]): string {
  return duplicates.map((d: any) => {
    // Group items by language for better visualization
    const itemsByLanguage = d.items.reduce((acc: any, item: any) => {
      const lang = item.language || 'Unknown';
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(item);
      return acc;
    }, {});

    const languageCount = Object.keys(itemsByLanguage).length;
    const totalItems = d.items.length;

    return `
      <div class="duplicate-card">
        <div class="duplicate-header">
          <h4><span class="slug-value">${d.slug}</span></h4>
          <div class="duplicate-stats">
            <span class="stat-badge stat-danger">${totalItems} duplicates</span>
            <span class="stat-badge stat-info">${languageCount} language${languageCount > 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div class="duplicate-languages">
          ${Object.entries(itemsByLanguage)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([language, langItems]) => {
              const itemsArray = langItems as any[];
              return `
                <div class="language-section">
                  <h5 class="language-title">🌐 ${language} (${itemsArray.length} item${itemsArray.length > 1 ? 's' : ''})</h5>
                  <ul class="items-list">
                    ${itemsArray.map((item: any) => `
                      <li class="duplicate-item">
                        <div class="item-name">${item.name || item}</div>
                        ${item.codename ? `<div class="item-meta">Codename: <code>${item.codename}</code></div>` : ''}
                        ${item.slugField ? `<div class="item-meta">Field: <span class="field-type">${item.slugField}</span></div>` : ''}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `;
            }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render statistics box
 */
function renderStatsBox(result: DuplicateResult): string {
  const duplicates = result.duplicates || [];
  
  return `
    <div class="stats-box">
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
}