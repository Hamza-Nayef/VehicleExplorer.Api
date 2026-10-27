// Typed client for OUR backend (not NHTSA directly). All paths are relative, so the same
// code works behind Vite's dev proxy and when the API serves the built app in production.

export interface Make {
  id: number;
  name: string;
}

export interface VehicleType {
  id: number;
  name: string;
}

export interface Model {
  id: number;
  name: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      // The API returns RFC 7807 problem details; `title` is written to be user-readable.
      const problem = await response.json();
      if (typeof problem?.title === 'string') message = problem.title;
    } catch {
      // Body was not JSON (e.g. a proxy error page) - keep the generic message.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export const getMakes = (signal?: AbortSignal) => get<Make[]>('/api/makes', signal);

export const getVehicleTypes = (makeId: number, signal?: AbortSignal) =>
  get<VehicleType[]>(`/api/makes/${makeId}/vehicle-types`, signal);

export function getModels(makeId: number, year: number, vehicleType: string | null, signal?: AbortSignal) {
  const query = new URLSearchParams({ year: String(year) });
  if (vehicleType) query.set('vehicleType', vehicleType);
  return get<Model[]>(`/api/makes/${makeId}/models?${query}`, signal);
}
