/**
 * Configuration management for Kontent.ai environment and API keys
 */

import { getCustomAppContext } from "@kontent-ai/custom-app-sdk";
import type { AppConfig } from "../types";

// Global configuration instance
export const appConfig: AppConfig = {
  projectId: "",
  deliveryApiKey: "",
  managementApiKey: "",
  previewApiKey: "",
};

/**
 * Initialize configuration from environment variables and Kontent.ai context
 */
export async function initializeConfig(): Promise<void> {
  // Get environment variables
  appConfig.projectId = getEnvVar("VITE_KONTENT_PROJECT_ID") || "";
  appConfig.deliveryApiKey = getEnvVar("VITE_KONTENT_API_KEY") || "";
  appConfig.managementApiKey = getEnvVar("VITE_KONTENT_MANAGEMENT_API_KEY") || "";
  appConfig.previewApiKey = getEnvVar("VITE_KONTENT_PREVIEW_API_KEY") || "";

  // Try to get context from Kontent.ai Custom App SDK
  try {
    const ctx = await getCustomAppContext();
    console.log("Custom App Context:", ctx);

    if (!ctx.isError && ctx.context?.environmentId) {
      appConfig.projectId = ctx.context.environmentId;
      console.log("Using project ID from Kontent.ai context:", appConfig.projectId);
    }
  } catch (error) {
    console.log("Could not get Custom App context:", error);
  }

  logConfiguration();
}

/**
 * Get environment variable from multiple sources
 */
declare global {
  // Vite injects env vars prefixed with VITE_
  interface ImportMetaEnv {
    readonly VITE_KONTENT_PROJECT_ID?: string;
    readonly VITE_KONTENT_API_KEY?: string;
    readonly VITE_KONTENT_MANAGEMENT_API_KEY?: string;
    readonly VITE_KONTENT_PREVIEW_API_KEY?: string;
    // Allow other arbitrary variables without forcing any
    readonly [key: string]: string | undefined;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

function getEnvVar(key: string): string {
  return import.meta.env?.[key] || process.env[key] || "";
}

/**
 * Log current configuration (without exposing sensitive data)
 */
function logConfiguration(): void {
  console.log("Final configuration:", {
    projectId: appConfig.projectId || "NOT SET",
    deliveryApiKey: appConfig.deliveryApiKey ? "***PRESENT***" : "NOT SET",
    managementApiKey: appConfig.managementApiKey ? "***PRESENT***" : "NOT SET",
    previewApiKey: appConfig.previewApiKey ? "***PRESENT***" : "NOT SET",
  });
}

/**
 * Check if required configuration is present
 */
export function isConfigValid(): boolean {
  return Boolean(appConfig.projectId);
}

/**
 * Get configuration status for display
 */
export function getConfigStatus(): {
  projectId: string;
  deliveryApiKey: boolean;
  managementApiKey: boolean;
  previewApiKey: boolean;
} {
  return {
    projectId: appConfig.projectId,
    deliveryApiKey: Boolean(appConfig.deliveryApiKey),
    managementApiKey: Boolean(appConfig.managementApiKey),
    previewApiKey: Boolean(appConfig.previewApiKey),
  };
}
