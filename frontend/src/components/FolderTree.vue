<script setup lang="ts">
import type { FolderNode } from "../types";

defineOptions({ name: "FolderTree" });

defineProps<{
  nodes: FolderNode[];
  selectedId: number | null;
  expandedIds: Set<number>;
  loadingIds?: Set<number>;
  loadedIds?: Set<number>;
}>();

const emit = defineEmits<{
  (event: "select", id: number): void;
  (event: "toggle", id: number): void;
}>();

const isExpanded = (id: number, expandedIds: Set<number>) =>
  expandedIds.has(id);

const isLoading = (id: number, loadingIds?: Set<number>) =>
  loadingIds?.has(id) ?? false;

const hasChildren = (node: FolderNode, loadedIds?: Set<number>) => {
  // If we've loaded this folder's children, trust the children array
  if (loadedIds?.has(node.id)) {
    return node.children.length > 0;
  }
  // Otherwise, assume it might have children (show expand button)
  // Root folders always show expand button until loaded
  return true;
};
</script>

<template>
  <ul class="tree">
    <li v-for="node in nodes" :key="node.id">
      <div class="tree-row" :class="{ selected: node.id === selectedId }">
        <button
          v-if="hasChildren(node, loadedIds)"
          class="caret"
          type="button"
          :aria-label="isExpanded(node.id, expandedIds) ? 'Collapse' : 'Expand'"
          :aria-expanded="isExpanded(node.id, expandedIds)"
          :disabled="isLoading(node.id, loadingIds)"
          @click.stop="emit('toggle', node.id)"
        >
          <i 
            v-if="isLoading(node.id, loadingIds)"
            class="pi pi-spinner pi-spin"
          ></i>
          <i 
            v-else
            class="pi" 
            :class="isExpanded(node.id, expandedIds) ? 'pi-chevron-down' : 'pi-chevron-right'"
          ></i>
        </button>
        <span v-else class="caret spacer"></span>
        <button
          class="tree-label"
          type="button"
          @click="emit('select', node.id)"
        >
          <span class="tree-icon" :class="{ open: isExpanded(node.id, expandedIds) }">
            <i class="pi" :class="isExpanded(node.id, expandedIds) ? 'pi-folder-open' : 'pi-folder'"></i>
          </span>
          <span class="tree-name" :title="node.name">{{ node.name }}</span>
          <!-- <span v-if="node.children.length" class="tree-badge">{{ node.children.length }}</span> -->
        </button>
      </div>
      <FolderTree
        v-if="node.children.length && isExpanded(node.id, expandedIds)"
        :nodes="node.children"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :loading-ids="loadingIds"
        :loaded-ids="loadedIds"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </li>
  </ul>
</template>
