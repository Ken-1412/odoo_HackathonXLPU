/* Global type declarations for third-party libraries loaded via CDN */

interface UnicornStudioInstance {
  isInitialized: boolean;
  init: () => void;
}

interface Window {
  UnicornStudio?: UnicornStudioInstance;
}

declare const UnicornStudio: UnicornStudioInstance;
