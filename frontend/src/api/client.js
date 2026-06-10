const DEFAULT_TIMEOUT_MS = 180_000;

export function getApiBase() {
  // Vite dev server proxies /api → Flask (see vite.config.js)
  if (import.meta.env.DEV) {
    return '';
  }
  return import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
}

/**
 * POST JSON to the Flask API with timeout and clear network errors.
 */
export async function apiPost(path, body, { baseUrl = getApiBase(), timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned invalid JSON. Is the Flask backend running?');
      }
    }

    if (!response.ok) {
      throw new Error(data?.error || `Request failed (${response.status})`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        'Request timed out. Secure key generation can take up to a minute — ensure the Flask server is running and try again.'
      );
    }
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(
        'Cannot reach the backend. Start Flask from the backend folder: python app.py (port 5000), then refresh this page.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
