const GIST_FILENAME = "kitchen-scheduler.json";
const GIST_DESCRIPTION = "Kitchen Scheduler Data";

export type SyncConfig = {
  token: string;
  gistId: string | null;
};

export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error";

async function ghFetch(token: string, path: string, options?: RequestInit) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
}

export async function loadFromGist(
  token: string,
  gistId: string
): Promise<object | null> {
  try {
    const res = await ghFetch(token, `/gists/${gistId}`);
    if (!res.ok) return null;
    const gist = await res.json();
    const content = gist.files?.[GIST_FILENAME]?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function saveToGist(
  token: string,
  gistId: string,
  data: object
): Promise<boolean> {
  try {
    const res = await ghFetch(token, `/gists/${gistId}`, {
      method: "PATCH",
      body: JSON.stringify({
        files: { [GIST_FILENAME]: { content: JSON.stringify(data) } },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createGist(
  token: string,
  data: object
): Promise<string | null> {
  try {
    const res = await ghFetch(token, "/gists", {
      method: "POST",
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false,
        files: { [GIST_FILENAME]: { content: JSON.stringify(data) } },
      }),
    });
    if (!res.ok) return null;
    const gist = await res.json();
    return gist.id as string;
  } catch {
    return null;
  }
}

/** Search the user's Gists for an existing Kitchen Scheduler Gist. */
export async function findKitchenGist(token: string): Promise<string | null> {
  try {
    const res = await ghFetch(token, "/gists?per_page=100");
    if (!res.ok) return null;
    const gists: Array<{ id: string; description: string; files: Record<string, unknown> }> =
      await res.json();
    const found = gists.find(
      (g) => g.description === GIST_DESCRIPTION && g.files[GIST_FILENAME]
    );
    return found?.id ?? null;
  } catch {
    return null;
  }
}

export const SYNC_CONFIG_KEY = "kitchenSyncConfig";

export function loadSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SyncConfig;
  } catch {
    return null;
  }
}

export function saveSyncConfig(config: SyncConfig) {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

export function clearSyncConfig() {
  localStorage.removeItem(SYNC_CONFIG_KEY);
}
