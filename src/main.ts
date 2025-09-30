/**
 * Main entry point for the Kontent.ai Duplicate Slugs Finder application
 * Modular architecture with separate concerns
 */

import './style.css';

// Import modules
import { initializeConfig } from './config';
import { searchSpecificSlug, findDuplicateSlugs } from './services/search';
import { 
  addStyles, 
  createMainUI, 
  renderConfiguration, 
  renderSearchResults, 
  renderDuplicateResults 
} from './components/ui';

// =====================================================================
// Application State
// =====================================================================

// DOM Elements
let resultDiv: HTMLElement;
let configBtn: HTMLElement;
let slugInput: HTMLInputElement;
let searchBtn: HTMLElement;
let findBtn: HTMLElement;

// =====================================================================
// Application Initialization
// =====================================================================

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  setupUI();
  setupEventListeners();
  await initializeConfig();
}

/**
 * Set up the user interface
 */
function setupUI(): void {
  const app = document.getElementById('app');
  if (!app) return;

  // Inject styles and create UI
  addStyles();
  app.innerHTML = createMainUI();

  // Get references to DOM elements
  resultDiv = document.getElementById('result')!;
  configBtn = document.getElementById('config-btn')!;
  slugInput = document.getElementById('slug-input') as HTMLInputElement;
  searchBtn = document.getElementById('search-btn')!;
  findBtn = document.getElementById('find-btn')!;

  // Ensure input starts hidden (CSS sets it, but enforce here too in case of SSR or overrides)
  if (slugInput) {
    slugInput.style.display = 'none';
  }
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners(): void {
  configBtn.addEventListener('click', handleConfigClick);

  // When clicking Search Slug, reveal input if hidden; if visible and empty, focus it; otherwise run search
  searchBtn.addEventListener('click', () => {
    const isHidden = slugInput.style.display === 'none' || getComputedStyle(slugInput).display === 'none';
    if (isHidden) {
      slugInput.style.display = 'inline-block';
      slugInput.focus();
      return;
    }
    handleSlugSearchClick();
  });

  // Allow Enter key inside input
  slugInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSlugSearchClick();
    }
  });
  findBtn.addEventListener('click', handleFindDuplicatesClick);
}

// =====================================================================
// Event Handlers
// =====================================================================

/**
 * Handle config button click
 */
async function handleConfigClick(): Promise<void> {
  try {
    resultDiv.innerHTML = 'Loading configuration...';
    await initializeConfig();
    resultDiv.innerHTML = renderConfiguration();
  } catch (error) {
    console.error('Error loading configuration:', error);
    resultDiv.innerHTML = `<p style="color:red;">Error loading configuration: ${error}</p>`;
  }
}

/**
 * Handle test button click
 */
async function handleSlugSearchClick(): Promise<void> {
  const value = slugInput.value.trim();
  if (!value) {
    resultDiv.innerHTML = '<p style="color:#b45309;">Please enter a slug to search.</p>';
    return;
  }
  try {
    resultDiv.innerHTML = `Searching for slug: <code>${value}</code> ...`;
    await initializeConfig();
    const result = await searchSpecificSlug(value);
    resultDiv.innerHTML = renderSearchResults(result, value);
  } catch (error) {
    console.error('Error during slug search:', error);
    resultDiv.innerHTML = `<p style="color:red;">Error during slug search: ${error}</p>`;
  }
}

/**
 * Handle find duplicates button click
 */
async function handleFindDuplicatesClick(): Promise<void> {
  try {
    resultDiv.innerHTML = 'Searching for duplicate slugs...';
    await initializeConfig();
    
    const result = await findDuplicateSlugs();
    resultDiv.innerHTML = renderDuplicateResults(result);
  } catch (error) {
    console.error('Error finding duplicates:', error);
    resultDiv.innerHTML = `<p style="color:red;">Error finding duplicates: ${error}</p>`;
  }
}

// =====================================================================
// Application Bootstrap
// =====================================================================

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Export for potential external usage
export { initializeApp };