import type { File, Folder } from "./types";

export type FolderPayload = {
  folders: Folder[];
  files: File[];
};

export type SearchScope = "all" | "folders" | "files";
export type SearchMatch = "prefix" | "contains";

export type SearchResponse = {
  folders: Folder[];
  files: File[];
  meta: {
    query: string;
    scope: SearchScope;
    match: SearchMatch;
    limit: number | null;
    offset: number;
    total: { folders: number; files: number };
  };
};

type FolderResponse = {
  folder: Folder;
};

type FileResponse = {
  file: File;
};

const parseError = async (response: Response) => {
  try {
    const data = (await response.json()) as { error?: string };
    return data?.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
};

const requestJson = async <T>(input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  if (response.status === 204) {
    return null as T;
  }
  return (await response.json()) as T;
};

export async function fetchFolders(): Promise<FolderPayload> {
  return requestJson<FolderPayload>("/api/folders");
}

export async function fetchFolder(id: number): Promise<FolderResponse> {
  return requestJson<FolderResponse>(`/api/folders/${id}`);
}

export type RootFoldersResponse = {
  folders: Folder[];
  meta: { total: number; limit: number | null; offset: number };
};

export async function fetchRootFolders(params?: { limit?: number; offset?: number }): Promise<RootFoldersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const qs = searchParams.toString();
  return requestJson<RootFoldersResponse>(`/api/folders/roots${qs ? `?${qs}` : ""}`);
}

export type FolderChildrenResponse = {
  folders: Folder[];
  files: File[];
  meta?: { limit: number; offset: number };
};

export async function fetchFolderChildren(folderId: number, params?: { type?: "all" | "folders" | "files"; limit?: number; offset?: number }): Promise<FolderChildrenResponse> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const qs = searchParams.toString();
  return requestJson<FolderChildrenResponse>(`/api/folders/${folderId}/children${qs ? `?${qs}` : ""}`);
}

export async function searchItems(params: {
  query: string;
  scope: SearchScope;
  match?: SearchMatch;
  limit?: number;
  offset?: number;
}): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("q", params.query);
  searchParams.set("scope", params.scope);
  searchParams.set("match", params.match ?? "contains");
  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }
  return requestJson<SearchResponse>(`/api/search?${searchParams.toString()}`);
}

export async function createFolder(payload: {
  name: string;
  parentId?: number | null;
}): Promise<FolderResponse> {
  return requestJson<FolderResponse>("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateFolder(
  id: number,
  payload: { name?: string; parentId?: number | null }
): Promise<FolderResponse> {
  return requestJson<FolderResponse>(`/api/folders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function deleteFolder(id: number): Promise<void> {
  await requestJson(`/api/folders/${id}`, { method: "DELETE" });
}

export async function createFile(payload: {
  name: string;
  folderId: number;
}): Promise<FileResponse> {
  return requestJson<FileResponse>("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateFile(
  id: number,
  payload: { name?: string; folderId?: number }
): Promise<FileResponse> {
  return requestJson<FileResponse>(`/api/files/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function deleteFile(id: number): Promise<void> {
  await requestJson(`/api/files/${id}`, { method: "DELETE" });
}
