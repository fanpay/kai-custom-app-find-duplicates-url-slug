/**
 * Main entry point for the Kontent.ai Duplicate Slugs Finder application
 * Modular architecture with separate concerns
 */

import "./style.css";

import {
  createMainUI,
  renderConfiguration,
  renderDuplicateResults,
  renderSearchResults,
} from "./components/ui";
// Import modules
import { initializeConfig } from "./config";
import { findDuplicateSlugs, searchSpecificSlug } from "./services/search";

// =====================================================================
// Application State
// =====================================================================

// DOM Elements
let resultDiv: HTMLElement;
let configBtn: HTMLElement;
let slugInput: HTMLInputElement;
let searchBtn: HTMLElement;
let executeSearchBtn: HTMLElement;
let findBtn: HTMLElement;
let searchSection: HTMLElement;

function mustGet<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing required DOM element #${id}`);
  }
  return el as T;
}

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
  const app = document.getElementById("app");
  if (!app) return;

  // Create UI (styles are loaded via imported stylesheet)
  app.innerHTML = createMainUI();

  // Get references to DOM elements
  resultDiv = mustGet<HTMLElement>("result");
  configBtn = mustGet<HTMLElement>("config-btn");
  slugInput = mustGet<HTMLInputElement>("slug-input");
  searchBtn = mustGet<HTMLElement>("search-btn");
  executeSearchBtn = mustGet<HTMLElement>("execute-search-btn");
  findBtn = mustGet<HTMLElement>("find-btn");
  searchSection = mustGet<HTMLElement>("search-section");
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners(): void {
  configBtn.addEventListener("click", handleConfigClick);
  searchBtn.addEventListener("click", () => {
    const isHidden = searchSection.style.display === "none";
    if (isHidden) {
      searchSection.style.display = "block";
      slugInput.focus();
      // Clear any previous results to show the search interface clearly
      resultDiv.innerHTML =
        '<p style="color: #666; font-style: italic;">Enter a slug above and click "Execute Search" to find matching pages.</p>';
    } else {
      searchSection.style.display = "none";
      resultDiv.innerHTML = "";
    }
  });

  // Execute search when clicking the execute button
  executeSearchBtn.addEventListener("click", handleSlugSearchClick);

  // Allow Enter key inside input
  slugInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSlugSearchClick();
    }
  });

  findBtn.addEventListener("click", handleFindDuplicatesClick);
}

// =====================================================================
// Event Handlers
// =====================================================================

/**
 * Handle config button click
 */
async function handleConfigClick(): Promise<void> {
  try {
    // Hide search section when showing config
    searchSection.style.display = "none";

    resultDiv.innerHTML = "Loading configuration...";
    await initializeConfig();
    resultDiv.innerHTML = renderConfiguration();
  } catch (error) {
    console.error("Error loading configuration:", error);
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
    console.error("Error during slug search:", error);
    resultDiv.innerHTML = `<p style="color:red;">Error during slug search: ${error}</p>`;
  }
}

/**
 * Handle find duplicates button click
 */
async function handleFindDuplicatesClick(): Promise<void> {
  try {
    // Hide search section when finding duplicates
    searchSection.style.display = "none";

    resultDiv.innerHTML = "Searching for duplicate slugs...";
    await initializeConfig();

    const result = await findDuplicateSlugs();
    resultDiv.innerHTML = renderDuplicateResults(result);
  } catch (error) {
    console.error("Error finding duplicates:", error);
    resultDiv.innerHTML = `<p style="color:red;">Error finding duplicates: ${error}</p>`;
  }
}

// =====================================================================
// Application Bootstrap
// =====================================================================

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);

// Export for potential external usage
export { initializeApp };
