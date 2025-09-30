/**
 * Search service for finding duplicate slugs and specific items
 */

import { ApiResult, DuplicateResult } from '../types';
import { appConfig, isConfigValid } from '../config';
import { 
  searchWithDeliveryApi, 
  searchAllItemsDeliveryApi, 
  searchWithManagementApi 
} from './api';
import { 
  removeDuplicateItems,
  groupItemsBySlug,
  filterDuplicates,
  createApiHeaders,
  filterPageItemsWithSlugs
} from '../utils';

/**
 * Search for items with specific slug using multiple API approaches
 */
export async function searchSpecificSlug(targetSlug: string): Promise<ApiResult> {
  if (!isConfigValid()) {
    return { 
      success: false, 
      items: [], 
      error: 'Missing Kontent.ai Project ID configuration. Click "Show Config" to verify settings.',
      method: 'none'
    };
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
    const allItems = [
      ...(results.deliveryApi.items || []),
      ...(results.deliveryApiAllItems.items || []),
      ...(results.managementApi?.items || [])
    ];
    
    // Remove duplicates based on codename
    const uniqueItems = removeDuplicateItems(allItems);
    
    return {
      success: true,
      items: uniqueItems,
      method: 'combined',
      deliveryApi: results.deliveryApi,
      deliveryApiAllItems: results.deliveryApiAllItems,
      managementApi: results.managementApi,
      totalItems: uniqueItems.length
    } as ApiResult;
  } catch (err: any) {
    return { 
      success: false, 
      items: [], 
      error: 'Unexpected error: ' + (err?.message || err),
      method: 'error' 
    };
  }
}

/**
 * Find duplicate slugs across all content items
 */
export async function findDuplicateSlugs(): Promise<DuplicateResult> {
  if (!isConfigValid()) {
    return { 
      duplicates: [],
      error: 'Missing Kontent.ai Project ID configuration. Click "Show Config" to verify settings.' 
    };
  }

  try {
    console.log('\n=== FINDING DUPLICATE SLUGS ===');
    
    const headers = createApiHeaders(appConfig.deliveryApiKey);
    const allItems = await fetchAllPageItemsForDuplicateCheck(headers);
    
    console.log(`\n=== DUPLICATE ANALYSIS ===`);
    console.log(`Total page items with slugs: ${allItems.length}`);

    // Group by slug and find duplicates
    const slugMap = groupItemsBySlug(allItems);
    const duplicates = filterDuplicates(slugMap);
    
    console.log(`Found ${duplicates.length} duplicate slugs`);
    duplicates.forEach(d => {
      console.log(`- "${d.slug}": ${d.items.length} items`);
    });

    return { 
      duplicates,
      totalItems: allItems.length,
      totalRequests: 0, // Will be updated by fetchAllPageItemsForDuplicateCheck
      uniqueSlugs: slugMap.size
    };
  } catch (err: any) {
    console.error('Duplicate search error:', err);
    return { 
      duplicates: [],
      error: 'Unexpected error: ' + (err?.message || err)
    };
  }
}

/**
 * Fetch all page items for duplicate checking with pagination
 */
async function fetchAllPageItemsForDuplicateCheck(headers: Record<string, string>): Promise<any[]> {
  let items: any[] = [];
  let skip = 0;
  const pageSize = 1000;
  let more = true;
  let totalRequests = 0;

  while (more) {
    totalRequests++;
    const url = `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements=url_slug,slug,system&limit=${pageSize}&skip=${skip}`;
    console.log(`Duplicate search request ${totalRequests}: ${url}`);
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Error fetching from API: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Pagination info:', data.pagination);
    
    const newItems = filterPageItemsWithSlugs(data.items || []);
    items = items.concat(newItems);
    
    console.log(`Request ${totalRequests}: Found ${newItems.length} page items with slugs, total: ${items.length}`);
    
    // Update pagination
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

  console.log(`Total requests made: ${totalRequests}`);
  return items;
}