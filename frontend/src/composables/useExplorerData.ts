import { computed, onMounted, ref, watch } from "vue";
import type { File, Folder, FolderNode } from "../types";
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  fetchFolder,
  fetchFolders,
  fetchFolderChildren,
  fetchRootFolders,
  searchItems,
  updateFile,
  updateFolder,
  type SearchScope
} from "../api";

const SEARCH_LIMIT = 12;

export const useExplorerData = () => {
  const searchScopeOptions = [
    { label: "All", value: "all" },
    { label: "Folders", value: "folders" },
    { label: "Files", value: "files" }
  ] satisfies { label: string; value: SearchScope }[];

  // Data state
  const folders = ref<Folder[]>([]);
  const files = ref<File[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const childrenError = ref<string | null>(null);

  const selectedId = ref<number | null>(null);
  const expandedIds = ref(new Set<number>());

  const searchQuery = ref("");
  const searchScope = ref<SearchScope>("all");
  const searchResults = ref<{ folders: Folder[]; files: File[] }>({
    folders: [],
    files: []
  });
  const searchTotals = ref<{ folders: number; files: number } | null>(null);
  const searchLoading = ref(false);
  const searchError = ref<string | null>(null);
  const searchOffset = ref(0);
  const searchHasMore = ref(false);

  const dataMode = ref<"root" | "all">("root");
  const isAllMode = computed({
    get: () => dataMode.value === "all",
    set: (value: boolean) => {
      dataMode.value = value ? "all" : "root";
    }
  });

  const loadedFolderIds = ref(new Set<number>());
  const loadingFolderIds = ref(new Set<number>());

  // Computed
  const folderMap = computed(
    () => new Map(folders.value.map((folder) => [folder.id, folder]))
  );

  const tree = computed(() => buildTree(folders.value));

  const selectedFolder = computed(() =>
    selectedId.value === null
      ? null
      : folderMap.value.get(selectedId.value) ?? null
  );

  const directFolders = computed(() =>
    selectedId.value === null
      ? []
      : folders.value
          .filter((folder) => folder.parentId === selectedId.value)
          .sort(sortByName)
  );

  const directFiles = computed(() =>
    selectedId.value === null
      ? []
      : files.value
          .filter((file) => file.folderId === selectedId.value)
          .sort(sortByName)
  );

  const searchTerm = computed(() => searchQuery.value.trim());
  const searchActive = computed(() => searchTerm.value.length > 0);

  const filteredFolders = computed(() => directFolders.value);
  const filteredFiles = computed(() => directFiles.value);

  const rightPanelLoading = computed(() => {
    if (loading.value) {
      return true;
    }
    if (searchActive.value) {
      return (
        searchLoading.value &&
        searchResults.value.folders.length === 0 &&
        searchResults.value.files.length === 0
      );
    }
    if (selectedId.value === null) {
      return false;
    }
    return loadingFolderIds.value.has(selectedId.value);
  });

  const breadcrumbs = computed(() => {
    const items: { id: number | null; name: string }[] = [
      { id: null, name: "Home" }
    ];
    let current = selectedFolder.value;
    const stack: { id: number; name: string }[] = [];
    while (current) {
      stack.unshift({ id: current.id, name: current.name });
      if (current.parentId === null) {
        break;
      }
      current = folderMap.value.get(current.parentId) ?? null;
    }
    return items.concat(stack);
  });

  const childCounts = computed(() => {
    const counts = new Map<number, number>();
    for (const folder of folders.value) {
      counts.set(folder.id, 0);
    }
    for (const folder of folders.value) {
      if (folder.parentId !== null) {
        counts.set(folder.parentId, (counts.get(folder.parentId) ?? 0) + 1);
      }
    }
    for (const file of files.value) {
      counts.set(file.folderId, (counts.get(file.folderId) ?? 0) + 1);
    }
    return counts;
  });

  const selectedMeta = computed(() => {
    if (!selectedFolder.value) {
      return "Select a folder to see its direct contents.";
    }
    const foldersCount = directFolders.value.length;
    const filesCount = directFiles.value.length;
    const folderLabel = `${foldersCount} folder${foldersCount === 1 ? "" : "s"}`;
    const fileLabel = `${filesCount} file${filesCount === 1 ? "" : "s"}`;
    return `${folderLabel} - ${fileLabel}`;
  });

  const searchCount = computed(
    () => searchResults.value.folders.length + searchResults.value.files.length
  );

  const searchTotalCount = computed(() => {
    if (!searchTotals.value) {
      return null;
    }
    if (searchScope.value === "folders") {
      return searchTotals.value.folders;
    }
    if (searchScope.value === "files") {
      return searchTotals.value.files;
    }
    return searchTotals.value.folders + searchTotals.value.files;
  });

  const headerTitle = computed(() =>
    searchActive.value
      ? "Search results"
      : selectedFolder.value?.name ?? "No folder selected"
  );

  const headerSubtitle = computed(() => {
    if (searchActive.value) {
      if (searchLoading.value) {
        return "Searching...";
      }
      const total = searchTotalCount.value;
      if (total === null) {
        return "No results yet.";
      }
      return `${searchCount.value} of ${total} results`;
    }
    return selectedMeta.value;
  });

  // Helpers
  function sortByName(a: { name: string }, b: { name: string }) {
    return a.name.localeCompare(b.name);
  }

  function buildTree(items: Folder[]): FolderNode[] {
    const lookup = new Map<number, FolderNode>();
    const roots: FolderNode[] = [];

    for (const folder of items) {
      lookup.set(folder.id, { ...folder, children: [] });
    }

    for (const node of lookup.values()) {
      if (node.parentId === null) {
        roots.push(node);
      } else {
        const parent = lookup.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    const sortNodes = (nodes: FolderNode[]) => {
      nodes.sort(sortByName);
      nodes.forEach((child) => sortNodes(child.children));
    };

    sortNodes(roots);
    return roots;
  }

  const countLabel = (id: number) => {
    const count = childCounts.value.get(id) ?? 0;
    return `${count} item${count === 1 ? "" : "s"}`;
  };

  const fileType = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (!ext || ext === name.toLowerCase()) {
      return "FILE";
    }
    return ext.toUpperCase();
  };

  const fileVariant = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (!ext) {
      return "doc";
    }
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      return "image";
    }
    if (ext === "pdf") {
      return "pdf";
    }
    if (["xlsx", "csv"].includes(ext)) {
      return "xlsx";
    }
    if (["zip", "rar", "7z"].includes(ext)) {
      return "zip";
    }
    return "doc";
  };

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong.";

  // Search
  const resetSearch = () => {
    searchResults.value = { folders: [], files: [] };
    searchTotals.value = null;
    searchOffset.value = 0;
    searchHasMore.value = false;
    searchError.value = null;
  };

  const fetchSearch = async (append = false) => {
    const term = searchTerm.value;
    if (!term) {
      resetSearch();
      return;
    }

    searchLoading.value = true;
    searchError.value = null;

    try {
      const limit = SEARCH_LIMIT;
      const offset = append ? searchOffset.value : 0;

      const response = await searchItems({
        query: term,
        scope: searchScope.value,
        match: "contains",
        limit,
        offset
      });

      const foldersResult = append
        ? [...searchResults.value.folders, ...response.folders]
        : response.folders;
      const filesResult = append
        ? [...searchResults.value.files, ...response.files]
        : response.files;
      searchResults.value = { folders: foldersResult, files: filesResult };
      searchTotals.value = response.meta.total;

      const nextOffset = offset + limit;
      searchOffset.value = nextOffset;

      if (searchScope.value === "folders") {
        searchHasMore.value = nextOffset < response.meta.total.folders;
      } else if (searchScope.value === "files") {
        searchHasMore.value = nextOffset < response.meta.total.files;
      } else {
        searchHasMore.value =
          nextOffset < response.meta.total.folders ||
          nextOffset < response.meta.total.files;
      }
    } catch (err) {
      searchError.value = getErrorMessage(err);
    } finally {
      searchLoading.value = false;
    }
  };

  const loadMoreSearch = () => fetchSearch(true);

  const loadFolderPath = async (folderId: number) => {
    const chain: Folder[] = [];
    const visited = new Set<number>();
    let currentId: number | null = folderId;

    while (currentId !== null && !visited.has(currentId)) {
      visited.add(currentId);
      const response = await fetchFolder(currentId);
      chain.push(response.folder);
      currentId = response.folder.parentId;
    }

    if (chain.length === 0) {
      return;
    }

    const existingIds = new Set(folders.value.map((folder) => folder.id));
    const missing = chain.filter((folder) => !existingIds.has(folder.id));
    if (missing.length) {
      folders.value = [...folders.value, ...missing];
    }
  };

  // Data load
  const expandAllFolders = (items: Folder[]) => {
    expandedIds.value = new Set(items.map((folder) => folder.id));
  };

  const refreshData = async () => {
    loading.value = true;
    error.value = null;
    childrenError.value = null;
    const currentSelection = selectedId.value;
    try {
      if (dataMode.value === "all") {
        const payload = await fetchFolders();
        folders.value = payload.folders;
        files.value = payload.files;
        loadedFolderIds.value = new Set(payload.folders.map((folder) => folder.id));
        expandAllFolders(payload.folders);
      } else {
        const payload = await fetchRootFolders();
        folders.value = payload.folders;
        files.value = [];
        loadedFolderIds.value = new Set();
        expandedIds.value = new Set();
      }
      loadingFolderIds.value = new Set();

      if (currentSelection !== null) {
        if (dataMode.value === "all") {
          if (!folderMap.value.has(currentSelection)) {
            selectedId.value = null;
          }
        } else {
          if (!folderMap.value.has(currentSelection)) {
            try {
              await loadFolderPath(currentSelection);
            } catch (err) {
              selectedId.value = null;
              return;
            }
          }
          await expandTo(currentSelection);
        }
      }
    } catch (err) {
      error.value = getErrorMessage(err);
    } finally {
      loading.value = false;
    }
  };

  // Load children for a folder (lazy loading)
  const loadFolderChildren = async (folderId: number) => {
    if (loadedFolderIds.value.has(folderId) || loadingFolderIds.value.has(folderId)) {
      return;
    }

    loadingFolderIds.value.add(folderId);
    childrenError.value = null;
    try {
      const response = await fetchFolderChildren(folderId);

      const existingIds = new Set(folders.value.map((folder) => folder.id));
      const newFolders = response.folders.filter((folder) => !existingIds.has(folder.id));
      if (newFolders.length) {
        folders.value = [...folders.value, ...newFolders];
      }

      const existingFileIds = new Set(files.value.map((file) => file.id));
      const newFiles = response.files.filter((file) => !existingFileIds.has(file.id));
      if (newFiles.length) {
        files.value = [...files.value, ...newFiles];
      }

      loadedFolderIds.value.add(folderId);
    } catch (err) {
      childrenError.value = "Unable to load folder contents.";
    } finally {
      loadingFolderIds.value.delete(folderId);
    }
  };

  // Tree interactions
  async function expandTo(id: number) {
    const next = new Set(expandedIds.value);
    let current = folderMap.value.get(id) ?? null;
    if (current) {
      next.add(current.id);
      await loadFolderChildren(current.id);
    }
    while (current?.parentId !== null) {
      next.add(current.parentId);
      current = folderMap.value.get(current.parentId) ?? null;
    }
    expandedIds.value = next;
  }

  const handleSelect = async (id: number) => {
    selectedId.value = id;
    childrenError.value = null;
    await expandTo(id);
    await loadFolderChildren(id);
  };

  const openFolder = async (id: number) => {
    if (searchQuery.value.trim()) {
      searchQuery.value = "";
    }
    await handleSelect(id);
  };

  const handleToggle = async (id: number) => {
    const next = new Set(expandedIds.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      await loadFolderChildren(id);
    }
    expandedIds.value = next;
  };

  const selectBreadcrumb = (id: number | null) => {
    selectedId.value = id;
    childrenError.value = null;
    if (id !== null) {
      expandTo(id);
    }
  };

  const refreshAfterMutation = async () => {
    await refreshData();
    if (searchActive.value) {
      await fetchSearch();
    }
  };

  const createFolderItem = async (name: string, parentId: number | null) => {
    await createFolder({ name, parentId });
    await refreshAfterMutation();
  };

  const createFileItem = async (name: string, folderId: number) => {
    await createFile({ name, folderId });
    await refreshAfterMutation();
  };

  const updateFolderItem = async (id: number, name: string) => {
    await updateFolder(id, { name });
    await refreshAfterMutation();
  };

  const updateFileItem = async (id: number, name: string) => {
    await updateFile(id, { name });
    await refreshAfterMutation();
  };

  const deleteFolderItem = async (id: number) => {
    await deleteFolder(id);
    await refreshAfterMutation();
  };

  const deleteFileItem = async (id: number) => {
    await deleteFile(id);
    await refreshAfterMutation();
  };

  // Lifecycle
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  watch([searchQuery, searchScope], () => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    if (!searchActive.value) {
      resetSearch();
      return;
    }
    searchTimer = setTimeout(() => {
      resetSearch();
      fetchSearch();
    }, 350);
  });

  watch(dataMode, () => {
    refreshData();
  });

  onMounted(() => {
    refreshData();
  });

  return {
    breadcrumbs,
    childrenError,
    countLabel,
    createFileItem,
    createFolderItem,
    deleteFileItem,
    deleteFolderItem,
    error,
    expandedIds,
    fileType,
    fileVariant,
    filteredFiles,
    filteredFolders,
    handleSelect,
    handleToggle,
    headerSubtitle,
    headerTitle,
    isAllMode,
    loadedFolderIds,
    loading,
    loadingFolderIds,
    loadMoreSearch,
    openFolder,
    rightPanelLoading,
    searchActive,
    searchError,
    searchHasMore,
    searchLoading,
    searchQuery,
    searchResults,
    searchScope,
    searchScopeOptions,
    selectBreadcrumb,
    selectedId,
    tree,
    updateFileItem,
    updateFolderItem
  };
};
