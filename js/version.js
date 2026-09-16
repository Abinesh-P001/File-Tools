/**
 * FILETOOLS — Central Version & Cache Management Controller
 * 
 * Increment APP_VERSION whenever a new version of FileTools is deployed.
 * Handles automatic version detection, targeted safe cache/storage purging,
 * Service Worker unregistration, reload loop prevention, and asset cache-busting.
 */

export const APP_VERSION = '1.0.1';

const STORAGE_PREFIXES = ['filetools_', 'ft_', 'filetools-'];
const VERSION_KEY = 'filetools_app_version';
const RELOAD_GUARD_KEY = 'filetools_reload_guard';

/**
 * Safely access storage without throwing in sandboxed or privacy-restricted modes
 */
function getStorage(type) {
    try {
        const storage = window[type];
        const testKey = '__ft_storage_test__';
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return storage;
    } catch {
        return null;
    }
}

const safeLocalStorage = getStorage('localStorage');
const safeSessionStorage = getStorage('sessionStorage');

/**
 * Clear only FileTools application-scoped keys in localStorage & sessionStorage.
 * Never touches unrelated domain or third-party website data.
 */
function clearApplicationStorage(newVersion) {
    if (safeLocalStorage) {
        try {
            const keysToRemove = [];
            for (let i = 0; i < safeLocalStorage.length; i++) {
                const key = safeLocalStorage.key(i);
                if (key && STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))) {
                    if (key !== VERSION_KEY) {
                        keysToRemove.push(key);
                    }
                }
            }
            keysToRemove.forEach(k => safeLocalStorage.removeItem(k));
            safeLocalStorage.setItem(VERSION_KEY, newVersion);
        } catch (err) {
            console.warn('[FileTools] Failed clearing application localStorage:', err);
        }
    }

    if (safeSessionStorage) {
        try {
            const keysToRemove = [];
            for (let i = 0; i < safeSessionStorage.length; i++) {
                const key = safeSessionStorage.key(i);
                if (key && STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))) {
                    if (key !== RELOAD_GUARD_KEY) {
                        keysToRemove.push(key);
                    }
                }
            }
            keysToRemove.forEach(k => safeSessionStorage.removeItem(k));
        } catch (err) {
            console.warn('[FileTools] Failed clearing application sessionStorage:', err);
        }
    }
}

/**
 * Safely unregister any existing or outdated Service Workers and remove their caches
 */
async function clearServiceWorkersAndCaches() {
    // 1. Unregister Service Workers
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.allSettled(
                registrations.map(async (reg) => {
                    const unregistered = await reg.unregister();
                    if (unregistered) {
                        console.info('[FileTools] Unregistered outdated ServiceWorker:', reg.scope);
                    }
                })
            );
        } catch (err) {
            console.warn('[FileTools] Error unregistering ServiceWorkers:', err);
        }
    }

    // 2. Clear application CacheStorage instances
    if ('caches' in window) {
        try {
            const cacheKeys = await caches.keys();
            await Promise.allSettled(
                cacheKeys.map(async (key) => {
                    await caches.delete(key);
                    console.info('[FileTools] Deleted CacheStorage cache:', key);
                })
            );
        } catch (err) {
            console.warn('[FileTools] Error clearing CacheStorage:', err);
        }
    }
}

/**
 * Perform a controlled, safe reload to fetch fresh assets, strictly preventing infinite loops
 */
async function performSafeReload(targetVersion) {
    if (safeSessionStorage) {
        const guard = safeSessionStorage.getItem(RELOAD_GUARD_KEY);
        if (guard === targetVersion) {
            console.warn(`[FileTools] Reload guard triggered for v${targetVersion}. Preventing loop.`);
            if (safeLocalStorage) {
                safeLocalStorage.setItem(VERSION_KEY, targetVersion);
            }
            return;
        }
        safeSessionStorage.setItem(RELOAD_GUARD_KEY, targetVersion);
    }

    if (safeLocalStorage) {
        safeLocalStorage.setItem(VERSION_KEY, targetVersion);
    }

    // Purge application caches and storage
    await clearServiceWorkersAndCaches();
    clearApplicationStorage(targetVersion);

    console.info(`[FileTools] Successfully updated application to v${targetVersion}. Reloading fresh assets...`);

    // Reload with a cache-busting timestamp to bypass intermediate/browser disk cache
    try {
        const reloadUrl = new URL(window.location.href);
        reloadUrl.searchParams.set('_v', targetVersion);
        reloadUrl.searchParams.set('_cb', Date.now().toString());
        window.location.replace(reloadUrl.toString());
    } catch {
        window.location.reload();
    }
}

/**
 * Clean up temporary cache-busting search parameters from the address bar once loaded
 */
function cleanupUrlParameters() {
    try {
        const url = new URL(window.location.href);
        let changed = false;
        if (url.searchParams.has('_cb')) {
            url.searchParams.delete('_cb');
            changed = true;
        }
        if (url.searchParams.has('_v')) {
            url.searchParams.delete('_v');
            changed = true;
        }
        if (changed) {
            const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    } catch {
        // Non-blocking
    }
}

/**
 * Dynamically verify and enforce the current version query on all linked stylesheets
 */
function enforceStylesheetCacheBusting() {
    try {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.includes('.css'))) {
                const url = new URL(href, window.location.href);
                if (url.searchParams.get('v') !== APP_VERSION) {
                    url.searchParams.set('v', APP_VERSION);
                    link.href = url.pathname + url.search;
                }
            }
        });
    } catch {
        // Non-blocking
    }
}

/**
 * Check if the server has deployed a newer application version (background detection)
 */
export async function checkForServerUpdate() {
    if (!navigator.onLine) return;

    try {
        // Determine path to version.js relative to current page
        const isSubDir = window.location.pathname.includes('/tools/');
        const versionUrl = new URL(isSubDir ? '../js/version.js' : './js/version.js', window.location.href);
        versionUrl.searchParams.set('_t', Date.now().toString());

        const response = await fetch(versionUrl.toString(), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store' }
        });

        if (response.ok) {
            const code = await response.text();
            const match = code.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
            if (match && match[1] && match[1] !== APP_VERSION) {
                console.info(`[FileTools] Newer version v${match[1]} detected on server! Current is v${APP_VERSION}.`);
                await performSafeReload(match[1]);
            }
        }
    } catch {
        // Network errors or offline silently ignored
    }
}

/**
 * Main application version initialization
 */
export async function initVersionManager() {
    enforceStylesheetCacheBusting();

    const storedVersion = safeLocalStorage ? safeLocalStorage.getItem(VERSION_KEY) : null;

    if (!storedVersion) {
        // First visit or storage cleared: check if legacy caches or service workers exist
        let hasLegacyData = false;
        try {
            if ('caches' in window) {
                const keys = await caches.keys();
                if (keys.length > 0) hasLegacyData = true;
            }
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                if (regs.length > 0) hasLegacyData = true;
            }
        } catch {
            hasLegacyData = false;
        }

        if (hasLegacyData) {
            // Existing user from pre-versioning era: purge and reload once
            await performSafeReload(APP_VERSION);
            return;
        } else {
            // Pristine first visit: record version without reload
            if (safeLocalStorage) {
                safeLocalStorage.setItem(VERSION_KEY, APP_VERSION);
            }
        }
    } else if (storedVersion !== APP_VERSION) {
        // Version mismatch detected!
        console.info(`[FileTools] Version mismatch: current code is v${APP_VERSION}, stored is v${storedVersion}.`);
        await performSafeReload(APP_VERSION);
        return;
    } else {
        // Versions match: clean up reload guard and URL query params
        if (safeSessionStorage) {
            safeSessionStorage.removeItem(RELOAD_GUARD_KEY);
        }
        cleanupUrlParameters();
    }

    // Set up background auto-detection when user returns to the tab or reconnects
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkForServerUpdate();
        }
    });

    window.addEventListener('online', () => {
        checkForServerUpdate();
    });
}

// Global exposure for debugging and manual checks in browser console
if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
    window.FileToolsVersion = {
        version: APP_VERSION,
        check: checkForServerUpdate,
        clear: clearServiceWorkersAndCaches
    };

    // Auto-execute initialization immediately
    initVersionManager();
}
