type PermissionHandler = () => Promise<boolean>;

let handler: PermissionHandler | null = null;
let inFlightRequest: Promise<boolean> | null = null;
let lastDecision: boolean | null = null;
let lastDecisionAt = 0;

const DECISION_COOLDOWN_MS = 15000;

async function getBrowserGeolocationState(): Promise<PermissionState | null> {
  try {
    if (!('permissions' in navigator) || !navigator.permissions?.query) {
      return null;
    }

    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state;
  } catch {
    return null;
  }
}

export function setLocationPermissionHandler(h: PermissionHandler | null) {
  handler = h;
}

export async function requestLocationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  if (lastDecision !== null && Date.now() - lastDecisionAt < DECISION_COOLDOWN_MS) {
    return lastDecision;
  }

  const browserState = await getBrowserGeolocationState();
  if (browserState === 'granted') {
    return true;
  }

  if (browserState === 'denied') {
    return false;
  }

  const resolver = async (): Promise<boolean> => {
    let allowed = false;

    if (handler) {
      try {
        allowed = await handler();
      } catch {
        allowed = false;
      }
    } else {
      try {
        allowed = window.confirm('¿Deseas compartir tu ubicación con Pitzbol para esta acción?');
      } catch {
        allowed = false;
      }
    }

    lastDecision = allowed;
    lastDecisionAt = Date.now();
    return allowed;
  };

  inFlightRequest = resolver().finally(() => {
    inFlightRequest = null;
  });

  return inFlightRequest;
}

export default requestLocationPermission;
