
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

type GoogleMaps = typeof window.google extends { maps: infer M } ? M : undefined;

let loadPromise: Promise<GoogleMaps | undefined> | null = null;

const createScript = (apiKey: string) => {
  return new Promise<GoogleMaps | undefined>((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src^="https://maps.googleapis.com/maps/api/js"]',
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google?.maps as GoogleMaps));
      existingScript.addEventListener('error', () => resolve(undefined));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.maps as GoogleMaps);
    script.onerror = () => {
      console.warn('Failed to load Google Maps script. Falling back to manual entry.');
      resolve(undefined);
    };

    document.head.appendChild(script);
  });
};

export const loadGoogleMaps = async (): Promise<GoogleMaps | undefined> => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  if (window.google?.maps) {
    return window.google.maps as GoogleMaps;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key is missing. Autocomplete will be unavailable.');
    return undefined;
  }

  if (!loadPromise) {
    loadPromise = createScript(apiKey);
  }

  return loadPromise;
};
