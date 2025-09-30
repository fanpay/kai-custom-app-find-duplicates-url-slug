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
let testBtn: HTMLElement;
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
  testBtn = document.getElementById('test-btn')!;
  findBtn = document.getElementById('find-btn')!;
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners(): void {
  configBtn.addEventListener('click', handleConfigClick);
  testBtn.addEventListener('click', handleTestClick);
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
async function handleTestClick(): Promise<void> {
  try {
    resultDiv.innerHTML = 'Searching for specific slug: meli-qa-page-2...';
    await initializeConfig();
    
    const result = await searchSpecificSlug('meli-qa-page-2');
    resultDiv.innerHTML = renderSearchResults(result, 'meli-qa-page-2');
  } catch (error) {
    console.error('Error during search:', error);
    resultDiv.innerHTML = `<p style="color:red;">Error during search: ${error}</p>`;
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