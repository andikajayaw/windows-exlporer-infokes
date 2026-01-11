<script setup lang="ts">
import TopBar from "./components/TopBar.vue";
import Sidebar from "./components/Sidebar.vue";
import MainPanel from "./components/MainPanel.vue";
import { useExplorerData } from "./composables/useExplorerData";
import { useExplorerUI } from "./composables/useExplorerUI";

const data = useExplorerData();

const {
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
  handleSelect: handleSelectData,
  handleToggle,
  headerSubtitle,
  headerTitle,
  isAllMode,
  loadedFolderIds,
  loadingFolderIds,
  loadMoreSearch,
  rightPanelLoading,
  searchActive,
  searchError,
  searchHasMore,
  searchLoading,
  searchQuery,
  searchResults,
  searchScope,
  searchScopeOptions,
  openFolder,
  selectBreadcrumb: selectBreadcrumbData,
  selectedId,
  tree,
  updateFileItem,
  updateFolderItem
} = data;

const ui = useExplorerUI({
  selectedId,
  createFolderItem,
  createFileItem,
  updateFolderItem,
  updateFileItem,
  deleteFolderItem,
  deleteFileItem
});

const {
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
} = ui;

const handleSelect = async (id: number) => {
  await handleSelectData(id);
  cancelEdit();
  cancelCreate();
};

const selectBreadcrumb = (id: number | null) => {
  selectBreadcrumbData(id);
  cancelEdit();
  cancelCreate();
};
</script>

<template>
  <div class="explorer">
    <TopBar
      :breadcrumbs="breadcrumbs"
      :search-query="searchQuery"
      :search-scope="searchScope"
      :search-scope-options="searchScopeOptions"
      @update:search-query="searchQuery = $event"
      @update:search-scope="searchScope = $event"
      @breadcrumb="selectBreadcrumb"
    />

    <div class="layout">
      <Sidebar
        :tree="tree"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :loading-ids="loadingFolderIds"
        :loaded-ids="loadedFolderIds"
        :is-all-mode="isAllMode"
        @update:is-all-mode="isAllMode = $event"
        @select="handleSelect"
        @toggle="handleToggle"
        @create="startCreate"
      />

      <MainPanel
        :header-title="headerTitle"
        :header-subtitle="headerSubtitle"
        :search-active="searchActive"
        :search-error="searchError"
        :search-loading="searchLoading"
        :search-has-more="searchHasMore"
        :search-results="searchResults"
        :search-scope="searchScope"
        :right-panel-loading="rightPanelLoading"
        :error="error"
        :action-error="actionError"
        :children-error="childrenError"
        :create-mode="createMode"
        :create-name="createName"
        :edit-state="editState"
        :edit-name="editName"
        :busy="busy"
        :selected-id="selectedId"
        :filtered-folders="filteredFolders"
        :filtered-files="filteredFiles"
        :count-label="countLabel"
        :file-type="fileType"
        :file-variant="fileVariant"
        @update:create-name="createName = $event"
        @update:edit-name="editName = $event"
        @start-create="startCreate"
        @cancel-create="cancelCreate"
        @submit-create="submitCreate"
        @start-edit="startEdit"
        @cancel-edit="cancelEdit"
        @submit-edit="submitEdit"
        @confirm-delete="confirmDelete"
        @open-folder="openFolder"
        @load-more-search="loadMoreSearch"
      />
    </div>
  </div>
</template>
