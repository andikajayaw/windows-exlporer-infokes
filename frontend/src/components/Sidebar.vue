<script setup lang="ts">
import { computed } from "vue";
import Button from "primevue/button";
import InputSwitch from "primevue/inputswitch";
import FolderTree from "./FolderTree.vue";
import type { FolderNode } from "../types";

const props = defineProps<{
  tree: FolderNode[];
  selectedId: number | null;
  expandedIds: Set<number>;
  loadingIds?: Set<number>;
  loadedIds?: Set<number>;
  isAllMode: boolean;
}>();

const emit = defineEmits<{
  (event: "select", id: number): void;
  (event: "toggle", id: number): void;
  (event: "create", mode: "folder" | "file"): void;
  (event: "update:isAllMode", value: boolean): void;
}>();

const modeModel = computed({
  get: () => props.isAllMode,
  set: (value: boolean) => emit("update:isAllMode", value)
});
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <p class="sidebar-title">Folder Tree</p>
      <FolderTree
        :nodes="tree"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :loading-ids="loadingIds"
        :loaded-ids="loadedIds"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </div>
    <div class="sidebar-section">
      <p class="sidebar-title">Data Mode</p>
      <div class="toggle-row">
        <span class="toggle-label" :class="{ active: !isAllMode }">
          Root only
        </span>
        <InputSwitch v-model="modeModel" />
        <span class="toggle-label" :class="{ active: isAllMode }">
          All folders
        </span>
      </div>
      <p class="toggle-hint">
        Root only scales better; all folders matches the original spec.
      </p>
    </div>
    <div class="sidebar-section">
      <p class="sidebar-title">Actions</p>
      <div class="sidebar-actions">
        <Button
          label="New folder"
          icon="pi pi-folder-plus"
          class="sidebar-btn-folder"
          size="small"
          @click="emit('create', 'folder')"
        />
        <Button
          label="New file"
          icon="pi pi-file-plus"
          class="sidebar-btn-file"
          size="small"
          :disabled="selectedId === null"
          @click="emit('create', 'file')"
        />
      </div>
    </div>
  </aside>
</template>
