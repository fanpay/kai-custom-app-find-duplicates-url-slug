import { Handler, HandlerEvent } from "@netlify/functions";
import { ManagementClient, SharedModels } from "@kontent-ai/management-sdk";

// Request body type
interface RequestPayload {
  environmentId: string;
  contentType: string;
  slugElement: string;
}

const createResponse = (statusCode: number, data: object) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return createResponse(405, { message: `Method Not Allowed: ${event.httpMethod}`, errorCode: 405 });
  }

  let environmentId = "";
  let contentType = "";
  let slugElement = "";
  try {
    const body: RequestPayload = JSON.parse(event.body || "{}") as RequestPayload;
    environmentId = body.environmentId;
    contentType = body.contentType;
    slugElement = body.slugElement;
  } catch {
    return createResponse(400, { message: "Invalid JSON body", errorCode: 400 });
  }

  if (!environmentId || !contentType || !slugElement) {
    return createResponse(400, { message: "Missing environmentId, contentType, or slugElement", errorCode: 400 });
  }

  const apiKey = process.env.MAPI_KEY;
  if (!apiKey) {
    return createResponse(500, { message: "Missing MAPI key", errorCode: 500 });
  }

  const client = new ManagementClient({ environmentId, apiKey });

  try {
    // Get all items of the given content type (pagination handled)
    const response = await client
      .listLanguageVariantsOfContentType()
      .byTypeCodename(contentType)
      .toAllPromise();
    const items = response.data.items;

    // Map slug to array of item names
    const slugMap: Record<string, string[]> = {};
    for (const variant of items) {
      const slugElementValue = (variant.elements as Record<string, any>)[slugElement]?.value;
      const name = (variant.item as { name?: string; id: string }).name ?? variant.item.id ?? "Unknown";
      if (slugElementValue) {
        if (!slugMap[slugElementValue]) slugMap[slugElementValue] = [];
        slugMap[slugElementValue].push(name as string);
      }
    }
    // Find duplicates
    const duplicates = Object.entries(slugMap)
      .filter(([slug, arr]) => arr.length > 1)
      .map(([slug, arr]) => ({ slug, items: arr }));

    return createResponse(200, { duplicates });
  } catch (apiError: any) {
    if (apiError instanceof SharedModels.ContentManagementBaseKontentError) {
      return createResponse(400, {
        message: apiError.message,
        errorCode: apiError.errorCode,
        details: apiError.validationErrors,
        requestId: apiError.requestId,
      });
    }
    return createResponse(500, {
      message: apiError.message || "Unknown API error",
      errorCode: 500,
      details: typeof apiError === "object" ? JSON.stringify(apiError) : apiError,
    });
  }
};
