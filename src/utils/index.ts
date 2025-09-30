/**
 * Utility functions for data manipulation and formatting
 */

import { ContentItem, SearchConfig } from '../types';

/**
 * Format API item to standardized ContentItem interface
 */
export function formatItem(item: any): ContentItem {
  const slugValue = item.elements?.url_slug?.value || item.elements?.slug?.value || 'No slug';
  
  return {
    name: item.system?.name || 'Unknown',
    codename: item.system?.codename || 'Unknown',
    type: item.system?.type || 'Unknown',
    language: item.system?.language || 'Unknown',
    slug: slugValue,
    slugField: item.elements?.url_slug?.value ? 'url_slug' : 'slug'
  };
}

/**
 * Remove duplicate items based on codename
 */
export function removeDuplicateItems(items: ContentItem[]): ContentItem[] {
  return items.filter((item, index, self) => 
    index === self.findIndex(i => i.codename === item.codename)
  );
}

/**
 * Get unique slugs from items array
 */
export function getUniqueSlugValues(items: any[]): string[] {
  return [...new Set(
    items.map(item => 
      item.elements?.url_slug?.value || item.elements?.slug?.value
    ).filter(Boolean)
  )];
}

/**
 * Create search configurations for different field types
 */
export function createSearchConfigs(targetSlug: string): SearchConfig[] {
  return [
    // Try 'slug' field with type filter
    {
      params: new URLSearchParams({
        'system.type': 'page',
        'elements.slug': targetSlug,
        'depth': '0',
        'limit': '100'
      }),
      field: 'slug'
    },
    // Try 'url_slug' field with type filter
    {
      params: new URLSearchParams({
        'system.type': 'page',
        'elements.url_slug': targetSlug,
        'depth': '0',
        'limit': '100'
      }),
      field: 'url_slug'
    },
    // Try 'slug' field without type filter
    {
      params: new URLSearchParams({
        'elements.slug': targetSlug,
        'depth': '0',
        'limit': '100'
      }),
      field: 'slug'
    },
    // Try 'url_slug' field without type filter
    {
      params: new URLSearchParams({
        'elements.url_slug': targetSlug,
        'depth': '0',
        'limit': '100'
      }),
      field: 'url_slug'
    }
  ];
}

/**
 * Create HTTP headers for Kontent.ai API requests
 */
export function createApiHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  return headers;
}

/**
 * Filter items by matching slug value
 */
export function filterItemsBySlug(items: any[], targetSlug: string): any[] {
  return items.filter((item: any) => {
    const hasMatchingSlug = 
      item.elements?.slug?.value === targetSlug || 
      item.elements?.url_slug?.value === targetSlug;
    const isPageType = item.system?.type === 'page';
    
    return hasMatchingSlug && isPageType;
  });
}

/**
 * Filter items by page type and presence of slug
 */
export function filterPageItemsWithSlugs(items: any[]): any[] {
  return items.filter((item: any) => 
    item.system?.type === 'page' && 
    (item.elements?.url_slug?.value || item.elements?.slug?.value)
  );
}

/**
 * Find slugs that contain a specific substring (case-insensitive)
 */
export function findSimilarSlugs(allSlugs: string[], searchTerm: string): string[] {
  return allSlugs.filter(slug => 
    slug && slug.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * Count items by field type
 */
export function countItemsByFieldType(items: any[]): { urlSlugCount: number; slugCount: number } {
  return {
    urlSlugCount: items.filter(item => item.elements?.url_slug?.value).length,
    slugCount: items.filter(item => item.elements?.slug?.value).length
  };
}

/**
 * Group items by slug value
 */
export function groupItemsBySlug(items: any[]): Map<string, any[]> {
  const slugMap = new Map<string, any[]>();
  
  for (const item of items) {
    const slug = item.elements?.url_slug?.value || item.elements?.slug?.value;
    
    if (slug) {
      if (!slugMap.has(slug)) {
        slugMap.set(slug, []);
      }
      
      slugMap.get(slug)!.push({
        name: item.system.name,
        codename: item.system.codename,
        language: item.system.language,
        slugField: item.elements?.url_slug?.value ? 'url_slug' : 'slug'
      });
    }
  }
  
  return slugMap;
}

/**
 * Filter duplicate entries from slug map
 */
export function filterDuplicates(slugMap: Map<string, any[]>): Array<{ slug: string; items: any[] }> {
  return Array.from(slugMap.entries())
    .filter(([slug, arr]) => arr.length > 1)
    .map(([slug, arr]) => ({ slug, items: arr }));
}

/**
 * Log item details for debugging
 */
export function logItemDetails(item: any, targetSlug: string): void {
  const hasMatchingSlug = 
    item.elements?.slug?.value === targetSlug || 
    item.elements?.url_slug?.value === targetSlug;
  const isPageType = item.system?.type === 'page';
  
  console.log(`Item ${item.system?.codename}:`, {
    type: item.system?.type,
    slug: item.elements?.slug?.value,
    url_slug: item.elements?.url_slug?.value,
    matchesSlug: hasMatchingSlug,
    isPage: isPageType
  });
}