import { ref } from "vue";

type ItemType = "folder" | "file";

type EditState = {
  type: ItemType;
  id: number;
  name: string;
};

type ExplorerActions = {
  selectedId: { value: number | null };
  createFolderItem: (name: string, parentId: number | null) => Promise<void>;
  createFileItem: (name: string, folderId: number) => Promise<void>;
  updateFolderItem: (id: number, name: string) => Promise<void>;
  updateFileItem: (id: number, name: string) => Promise<void>;
  deleteFolderItem: (id: number) => Promise<void>;
  deleteFileItem: (id: number) => Promise<void>;
};

export const useExplorerUI = (actions: ExplorerActions) => {
  const actionError = ref<string | null>(null);
  const busy = ref(false);

  const createMode = ref<ItemType | null>(null);
  const createName = ref("");

  const editState = ref<EditState | null>(null);
  const editName = ref("");

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong.";

  const startCreate = (mode: ItemType) => {
    actionError.value = null;
    createMode.value = mode;
    createName.value = "";
  };

  const cancelCreate = () => {
    createMode.value = null;
    createName.value = "";
    actionError.value = null;
  };

  const submitCreate = async () => {
    if (!createMode.value) {
      return;
    }
    const name = createName.value.trim();
    if (!name) {
      actionError.value = "Name is required.";
      return;
    }
    if (createMode.value === "file" && actions.selectedId.value === null) {
      actionError.value = "Select a folder before creating a file.";
      return;
    }

    busy.value = true;
    actionError.value = null;
    try {
      if (createMode.value === "folder") {
        await actions.createFolderItem(name, actions.selectedId.value ?? null);
      } else if (actions.selectedId.value !== null) {
        await actions.createFileItem(name, actions.selectedId.value);
      }
      cancelCreate();
    } catch (err) {
      actionError.value = getErrorMessage(err);
    } finally {
      busy.value = false;
    }
  };

  const startEdit = (type: ItemType, item: { id: number; name: string }) => {
    editState.value = { type, id: item.id, name: item.name };
    editName.value = item.name;
    actionError.value = null;
  };

  const cancelEdit = () => {
    editState.value = null;
    editName.value = "";
  };

  const submitEdit = async () => {
    if (!editState.value) {
      return;
    }
    const name = editName.value.trim();
    if (!name) {
      actionError.value = "Name is required.";
      return;
    }
    busy.value = true;
    actionError.value = null;
    try {
      if (editState.value.type === "folder") {
        await actions.updateFolderItem(editState.value.id, name);
      } else {
        await actions.updateFileItem(editState.value.id, name);
      }
      cancelEdit();
    } catch (err) {
      actionError.value = getErrorMessage(err);
    } finally {
      busy.value = false;
    }
  };

  const confirmDelete = async (type: ItemType, item: { id: number }) => {
    const label = type === "folder" ? "folder and its contents" : "file";
    const confirmed = window.confirm(`Delete this ${label}?`);
    if (!confirmed) {
      return;
    }
    busy.value = true;
    actionError.value = null;
    try {
      if (type === "folder") {
        await actions.deleteFolderItem(item.id);
      } else {
        await actions.deleteFileItem(item.id);
      }
    } catch (err) {
      actionError.value = getErrorMessage(err);
    } finally {
      busy.value = false;
    }
  };

  return {
    actionError,
    busy,
    cancelCreate,
    cancelEdit,
    confirmDelete,
    createMode,
    createName,
    editName,
    editState,
    startCreate,
    startEdit,
    submitCreate,
    submitEdit
  };
};
