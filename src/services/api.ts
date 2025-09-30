/**
 * Kontent.ai API service for content item operations
 */

import { ApiResult, PaginationInfo } from '../types';
import { appConfig, isConfigValid } from '../config';
import { 
  createApiHeaders, 
  createSearchConfigs, 
  filterItemsBySlug, 
  filterPageItemsWithSlugs,
  formatItem,
  getUniqueSlugValues,
  findSimilarSlugs,
  countItemsByFieldType,
  logItemDetails
} from '../utils';

const KONTENT_DELIVERY_API_BASE = 'https://deliver.kontent.ai';
const KONTENT_MANAGEMENT_API_BASE = 'https://manage.kontent.ai/v2';

/**
 * Search for items with specific slug using direct API filtering
 */
export async function searchWithDeliveryApi(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return createErrorResult('Missing Kontent.ai Project ID configuration.', 'delivery-api-direct');
  }

  try {
    console.log('\n--- Delivery API Direct Search ---');
    const headers = createApiHeaders(appConfig.deliveryApiKey);
    const searchConfigs = createSearchConfigs(targetSlug);
    
    for (const config of searchConfigs) {
      const url = `${KONTENT_DELIVERY_API_BASE}/${appConfig.projectId}/items?${config.params.toString()}`;
      console.log(`Trying URL (${config.field} field):`, url);
      
      const res = await fetch(url, { headers });
      console.log(`Response status for ${config.field} field:`, res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log(`Response data for ${config.field}:`, {
          itemCount: data.items?.length || 0,
          pagination: data.pagination
        });
        
        // Filter items and log details
        const items = filterItemsBySlug(data.items || [], targetSlug);
        
        // Log each item for debugging
        (data.items || []).forEach((item: any) => {
          logItemDetails(item, targetSlug);
        });
        
        if (items.length > 0) {
          console.log(`✅ Found ${items.length} items using ${config.field} field`);
          return {
            success: true,
            items: items.map(formatItem),
            method: 'delivery-api-direct',
            field: config.field,
            url
          };
        } else {
          console.log(`No matching items found using ${config.field} field`);
        }
      } else {
        console.log(`❌ Failed with ${config.field} field:`, res.status, res.statusText);
      }
    }
    
    return { success: false, items: [], method: 'delivery-api-direct' };
  } catch (error: any) {
    console.error('Delivery API direct search error:', error);
    return createErrorResult(error.message, 'delivery-api-direct');
  }
}

/**
 * Search by fetching all items and filtering client-side
 */
export async function searchAllItemsDeliveryApi(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return createErrorResult('Missing Kontent.ai Project ID configuration.', 'delivery-api-all-items');
  }

  try {
    console.log('\n--- Delivery API All Items Search ---');
    const headers = createApiHeaders(appConfig.deliveryApiKey);
    
    const allItems = await fetchAllPageItems(headers);
    const analysisResult = analyzeSlugData(allItems, targetSlug);
    
    return {
      success: true,
      items: analysisResult.matchingItems.map(formatItem),
      method: 'delivery-api-all-items',
      ...analysisResult.stats
    };
  } catch (error: any) {
    console.error('Delivery API all items search error:', error);
    return createErrorResult(error.message, 'delivery-api-all-items');
  }
}

/**
 * Search using Management API (placeholder for future implementation)
 */
export async function searchWithManagementApi(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return createErrorResult('Missing Kontent.ai Project ID configuration.', 'management-api');
  }

  try {
    console.log('\n--- Management API Search ---');
    const headers = createApiHeaders(appConfig.managementApiKey);
    
    const url = `${KONTENT_MANAGEMENT_API_BASE}/projects/${appConfig.projectId}/items`;
    console.log('Management API URL:', url);
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Management API Error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Management API response:', data);
    
    return {
      success: true,
      items: [], // Would need additional processing for language variants
      method: 'management-api',
      note: 'Management API integration needs additional implementation for language variants'
    };
  } catch (error: any) {
    console.error('Management API search error:', error);
    return createErrorResult(error.message, 'management-api');
  }
}

/**
 * Fetch all page items with pagination
 */
async function fetchAllPageItems(headers: Record<string, string>): Promise<any[]> {
  let allItems: any[] = [];
  const pagination: PaginationInfo = {
    skip: 0,
    pageSize: 1000,
    totalRequests: 0,
    more: true
  };

  while (pagination.more) {
    pagination.totalRequests++;
    const url = `${KONTENT_DELIVERY_API_BASE}/${appConfig.projectId}/items?system.type=page&elements=url_slug,slug,system&limit=${pagination.pageSize}&skip=${pagination.skip}`;
    
    console.log(`Request ${pagination.totalRequests}: ${url}`);
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('API Response pagination:', data.pagination);
    
    const newItems = filterPageItemsWithSlugs(data.items || []);
    allItems = allItems.concat(newItems);
    
    console.log(`Request ${pagination.totalRequests}: Fetched ${newItems.length} page items with slugs, running total: ${allItems.length}`);
    console.log(`Raw items in this batch: ${data.items?.length || 0}`);
    
    // Update pagination
    if (data.pagination?.next_page) {
      pagination.skip += pagination.pageSize;
      console.log(`More items available, next skip: ${pagination.skip}`);
    } else {
      console.log('No more pages available');
      pagination.more = false;
    }
    
    // Safety check
    if (pagination.totalRequests > 50) {
      console.log('Safety limit reached (50 requests), stopping');
      break;
    }
  }

  console.log(`\n=== PAGINATION COMPLETE ===`);
  console.log(`Total API requests made: ${pagination.totalRequests}`);
  console.log(`Total page items with slugs: ${allItems.length}`);

  return allItems;
}

/**
 * Analyze slug data and find matches
 */
function analyzeSlugData(allItems: any[], targetSlug: string) {
  const allSlugs = getUniqueSlugValues(allItems);
  const fieldCounts = countItemsByFieldType(allItems);
  
  console.log(`Total unique slugs: ${allSlugs.length}`);
  console.log('First 20 slugs:', allSlugs.slice(0, 20));
  console.log(`Items with url_slug field: ${fieldCounts.urlSlugCount}`);
  console.log(`Items with slug field: ${fieldCounts.slugCount}`);
  
  // Find matches
  const exactMatches = allSlugs.filter(slug => slug === targetSlug);
  const similarSlugs = findSimilarSlugs(allSlugs, targetSlug);
  const meliSlugs = findSimilarSlugs(allSlugs, 'meli');
  
  console.log(`Exact slug matches for "${targetSlug}": ${exactMatches.length}`);
  console.log('Similar slugs (containing target):', similarSlugs);
  console.log('All slugs containing "meli":', meliSlugs);
  
  // Find matching items
  const matchingItems = allItems.filter((item: any) => {
    const slugValue = item.elements?.url_slug?.value || item.elements?.slug?.value;
    return slugValue === targetSlug;
  });
  
  // Case-insensitive matches
  const caseInsensitiveMatches = allItems.filter((item: any) => {
    const slugValue = item.elements?.url_slug?.value || item.elements?.slug?.value;
    return slugValue && slugValue.toLowerCase() === targetSlug.toLowerCase();
  });
  
  console.log(`Found ${matchingItems.length} items with exact slug "${targetSlug}"`);
  console.log(`Found ${caseInsensitiveMatches.length} items with case-insensitive slug match`);
  
  return {
    matchingItems,
    stats: {
      totalItems: allItems.length,
      totalRequests: 0, // Will be set by caller
      exactMatches: exactMatches.length,
      similarSlugs,
      meliSlugs,
      caseInsensitiveMatches: caseInsensitiveMatches.length,
      allSlugsCount: allSlugs.length
    }
  };
}

/**
 * Create error result object
 */
function createErrorResult(message: string, method: string): ApiResult {
  return {
    success: false,
    items: [],
    error: message,
    method
  };
}