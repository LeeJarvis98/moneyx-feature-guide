/**
 * Firebase Cloud Functions for Exness API Proxy
 * Handles CORS and authentication for Exness API calls
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10});

const EXNESS_API_BASE = "https://my.exnessaffiliates.com";

interface ProxyRequestBody {
  endpoint: string;
  method?: string;
  token?: string;
  data?: string;
}

export const exnessProxy = onRequest(
  {cors: true},
  async (request, response) => {
    try {
      // Handle preflight
      if (request.method === "OPTIONS") {
        response.status(204).send("");
        return;
      }

      // For GET requests, read from query params
      if (request.method === "GET") {
        const endpoint = request.query.endpoint as string;
        const token = request.query.token as string;

        if (!endpoint) {
          response.status(400).json({error: "Missing endpoint parameter"});
          return;
        }

        logger.info("GET Proxy Request:", {endpoint, hasToken: !!token});

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const exnessResponse = await fetch(`${EXNESS_API_BASE}${endpoint}`, {
          method: "GET",
          headers,
        });

        const responseData = await exnessResponse.json().catch(() => null);

        response.status(exnessResponse.status).json(
          responseData || {error: exnessResponse.statusText}
        );
        return;
      }

      // For POST requests, read from body
      if (request.method === "POST") {
        const body = request.body as ProxyRequestBody;
        const {endpoint, method = "POST", token, data} = body;

        if (!endpoint) {
          response.status(400).json({error: "Missing endpoint in body"});
          return;
        }

        logger.info("POST Proxy Request:", {
          endpoint,
          method,
          hasToken: !!token,
          hasData: !!data,
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const fetchOptions: RequestInit = {
          method,
          headers,
        };

        if (data && ["POST", "PATCH", "PUT"].includes(method)) {
          fetchOptions.body = data;
        }

        const exnessResponse = await fetch(
          `${EXNESS_API_BASE}${endpoint}`,
          fetchOptions
        );

        const responseData = await exnessResponse.json().catch(() => null);

        response.status(exnessResponse.status).json(
          responseData || {error: exnessResponse.statusText}
        );
        return;
      }

      response.status(405).json({error: "Method not allowed"});
    } catch (error) {
      logger.error("Proxy request failed:", error);
      response.status(500).json({
        error: "Proxy request failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
