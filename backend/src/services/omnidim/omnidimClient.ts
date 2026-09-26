/**
 * Centralized OmniDimension Official Client Service
 * Encapsulates the official @omnidim-ai/sdk instance.
 * Ensures the API key is kept securely on the backend only.
 * 
 * Uses dynamic import() to handle ESM-only @omnidim-ai/sdk package
 * gracefully — the server boots even if the SDK fails to load.
 */
import env from '../../config/env';

let OmniDimensionClass: any = null;
let sdkLoadAttempted = false;

async function loadSdk(): Promise<any> {
  if (sdkLoadAttempted) return OmniDimensionClass;
  sdkLoadAttempted = true;
  try {
    const mod = await import('@omnidim-ai/sdk');
    OmniDimensionClass = mod.default || mod.OmniDimension || mod;
    console.log('[OmniDimension SDK] Loaded successfully');
  } catch (err: any) {
    console.warn('[OmniDimension SDK] Could not load @omnidim-ai/sdk:', err.message);
    console.warn('[OmniDimension SDK] Voice features will use direct HTTP fallback.');
  }
  return OmniDimensionClass;
}

class OmniDimClientService {
  private client: any = null;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = (process.env.OMNIDIM_API_KEY || env.OMNIDIM_API_KEY || '').trim();
    this.baseUrl = (process.env.OMNIDIM_BASE_URL || env.OMNIDIM_BASE_URL || 'https://backend.omnidim.io/api/v1').replace(/\/+$/, '');
  }

  /**
   * Initialize the SDK client (call once at startup or lazily)
   */
  public async initialize(): Promise<void> {
    if (this.client) return;
    if (!this.apiKey) return;

    const Cls = await loadSdk();
    if (Cls && typeof Cls === 'function') {
      try {
        this.client = new Cls({
          apiKey: this.apiKey,
          baseURL: this.baseUrl,
          timeout: 45000,
        });
      } catch (err: any) {
        console.warn('[OmniDimension Client] Initialization warning:', err.message);
      }
    }
  }

  /**
   * Check whether OmniDimension API key is configured
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Get the active official SDK client instance
   */
  public getClient(): any {
    return this.client;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const omnidimClientService = new OmniDimClientService();
export default omnidimClientService;
