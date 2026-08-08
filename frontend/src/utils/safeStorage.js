export function safeStorageGet(key, fallbackValue = null) {
  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ?? fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

export function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    return;
  }
}

export function safeStorageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    return;
  }
}

export function safeReadJson(key, fallbackValue) {
  try {
    const storedValue = safeStorageGet(key, null);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch (error) {
    safeStorageRemove(key);
    return fallbackValue;
  }
}

export function safeWriteJson(key, value) {
  safeStorageSet(key, JSON.stringify(value));
}

/**
 * Removes a specific list of localStorage keys, or (if omitted) removes all
 * keys that start with the 'fitsy-' namespace prefix.
 * Called during logout to ensure local session data is fully cleared.
 *
 * @param {string[]} [keys] - Explicit keys to remove. If not provided, all
 *   'fitsy-' prefixed keys are removed.
 */
export function safeStorageClearAll(keys) {
  try {
    if (keys) {
      keys.forEach((key) => window.localStorage.removeItem(key));
      return;
    }
    // Remove all fitsy-namespaced keys (catches cart, wishlist, auth, theme, etc.)
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('fitsy-'))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    // Silent fail — storage may be unavailable
  }
}
