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
    console.log(`\n=== SEARCHING FOR SLUG: "${targetSlug}" (ALL LANGUAGES) ===`);
    
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
    
    // Remove duplicates based on codename+language combination to preserve multilingual variants
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
    console.log('\n=== FINDING DUPLICATE SLUGS (ALL LANGUAGES) ===');
    
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
      // Special logging for lorem-ipsum and tutorial_mari_page debugging
      if (d.slug === 'lorem-ipsum' || d.items.some((item: any) => item.codename === 'tutorial_mari_page')) {
        console.log(`  🔍 DEBUG - ${d.slug} items:`, d.items.map((item: any) => `${item.codename}(${item.language})`).join(', '));
      }
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
    const url = `https://deliver.kontent.ai/${appConfig.projectId}/items?system.type=page&elements=url_slug,slug,system&limit=${pageSize}&skip=${skip}&system.language=*`;
    console.log(`Duplicate search request ${totalRequests}: ${url}`);
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Error fetching from API: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Pagination info:', data.pagination);
    
    const newItems = filterPageItemsWithSlugs(data.items || []);
    items = items.concat(newItems);
    
    // Log language statistics for this batch
    const languagesInBatch = [...new Set(newItems.map((item: any) => item.system?.language).filter(Boolean))];
    console.log(`Request ${totalRequests}: Found ${newItems.length} page items with slugs, total: ${items.length}`);
    console.log(`Languages in this batch: ${languagesInBatch.join(', ')}`);
    
    // Special check for tutorial_mari_page
    const mariPages = newItems.filter((item: any) => item.system?.codename === 'tutorial_mari_page');
    if (mariPages.length > 0) {
      console.log(`🔍 Found tutorial_mari_page in batch ${totalRequests}:`, 
        mariPages.map((item: any) => 
          `${item.system.codename}(${item.system.language}) slug: ${item.elements?.url_slug?.value || item.elements?.slug?.value || 'none'}`
        ).join(', ')
      );
    }
    
    // Update pagination
    if (data.pagination?.next_page) {
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