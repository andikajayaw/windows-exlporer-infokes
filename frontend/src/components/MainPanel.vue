<script setup lang="ts">
import { computed } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import type { SearchScope } from "../api";
import type { File, Folder } from "../types";

type ItemType = "folder" | "file";

type EditState = {
  type: ItemType;
  id: number;
  name: string;
};

const props = defineProps<{
  headerTitle: string;
  headerSubtitle: string;
  searchActive: boolean;
  searchError: string | null;
  searchLoading: boolean;
  searchHasMore: boolean;
  searchResults: { folders: Folder[]; files: File[] };
  searchScope: SearchScope;
  rightPanelLoading: boolean;
  error: string | null;
  actionError: string | null;
  childrenError: string | null;
  createMode: ItemType | null;
  createName: string;
  editState: EditState | null;
  editName: string;
  busy: boolean;
  selectedId: number | null;
  filteredFolders: Folder[];
  filteredFiles: File[];
  countLabel: (id: number) => string;
  fileType: (name: string) => string;
  fileVariant: (name: string) => string;
}>();

const emit = defineEmits<{
  (event: "update:createName", value: string): void;
  (event: "update:editName", value: string): void;
  (event: "startCreate", mode: ItemType): void;
  (event: "cancelCreate"): void;
  (event: "submitCreate"): void;
  (event: "startEdit", type: ItemType, item: Folder | File): void;
  (event: "cancelEdit"): void;
  (event: "submitEdit"): void;
  (event: "confirmDelete", type: ItemType, item: Folder | File): void;
  (event: "openFolder", id: number): void;
  (event: "loadMoreSearch"): void;
}>();

const createNameModel = computed({
  get: () => props.createName,
  set: (value: string) => emit("update:createName", value)
});

const editNameModel = computed({
  get: () => props.editName,
  set: (value: string) => emit("update:editName", value)
});
</script>

<template>
  <main class="main">
    <div class="main-header">
      <div>
        <h1>{{ headerTitle }}</h1>
        <p class="main-sub">{{ headerSubtitle }}</p>
      </div>
      <div class="action-row">
        <Button
          label="New folder"
          icon="pi pi-folder-plus"
          class="sidebar-btn-folder"
          size="small"
          @click="emit('startCreate', 'folder')"
        />
        <Button
          label="New file"
          icon="pi pi-file-plus"
          class="sidebar-btn-file"
          size="small"
          :disabled="selectedId === null"
          @click="emit('startCreate', 'file')"
        />
      </div>
    </div>

    <div v-if="error" class="alert">
      {{ error }}
    </div>
    <div v-if="actionError" class="alert warning">
      {{ actionError }}
    </div>
    <div v-if="childrenError && !searchActive" class="alert warning">
      {{ childrenError }}
    </div>

    <div v-if="createMode" class="create-panel">
      <form class="create-form" @submit.prevent="emit('submitCreate')">
        <label class="create-label">
          {{ createMode === "folder" ? "Folder name" : "File name" }}
        </label>
        <InputText v-model="createNameModel" class="w-full" />
        <div class="create-actions">
          <Button label="Save" :disabled="busy" type="submit" />
          <Button label="Cancel" severity="secondary" text @click="emit('cancelCreate')" />
        </div>
      </form>
    </div>

    <div v-if="rightPanelLoading" class="skeleton-panel" aria-busy="true">
      <section class="skeleton-group">
        <div class="skeleton-title"></div>
        <div class="skeleton-grid">
          <div v-for="n in 4" :key="`folder-skel-${n}`" class="skeleton-card">
            <div class="skeleton-thumb"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      </section>
      <section class="skeleton-group">
        <div class="skeleton-title"></div>
        <div class="skeleton-grid">
          <div v-for="n in 6" :key="`file-skel-${n}`" class="skeleton-card">
            <div class="skeleton-thumb wide"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      </section>
    </div>

    <template v-else>
      <div v-if="searchActive">
        <div v-if="searchError" class="alert warning">
          {{ searchError }}
        </div>
        <div
          v-if="
            searchLoading &&
            searchResults.folders.length === 0 &&
            searchResults.files.length === 0
          "
          class="empty-state"
        >
          Searching...
        </div>
        <template v-else>
          <section v-if="searchScope !== 'files'" class="group">
            <p class="group-title">Folders</p>
            <div
              v-if="searchResults.folders.length === 0"
              class="empty-state compact"
            >
              No folder matches.
            </div>
            <div v-else class="folder-grid">
              <article
                v-for="folder in searchResults.folders"
                :key="folder.id"
                class="folder-card"
              >
                <div class="folder-top">
                  <div class="folder-icon">
                    <i class="pi pi-folder"></i>
                  </div>
                </div>
                <div
                  v-if="!(editState?.type === 'folder' && editState.id === folder.id)"
                  class="card-actions float"
                >
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    aria-label="Rename folder"
                    class="card-action-btn"
                    :disabled="busy"
                    @click.stop="emit('startEdit', 'folder', folder)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    aria-label="Delete folder"
                    class="card-action-btn"
                    :disabled="busy"
                    @click.stop="emit('confirmDelete', 'folder', folder)"
                  />
                </div>
                <div
                  v-if="editState?.type === 'folder' && editState.id === folder.id"
                  class="col-span-full"
                >
                  <form class="edit-form" @submit.prevent="emit('submitEdit')">
                    <label class="edit-label">Edit folder name</label>
                    <InputText
                      v-model="editNameModel"
                      class="w-full"
                      placeholder="Enter folder name..."
                      autofocus
                      @focus="$event.target.select()"
                    />
                    <div class="edit-actions">
                      <Button label="Save" :disabled="busy" type="submit" />
                      <Button
                        label="Cancel"
                        severity="secondary"
                        text
                        @click="emit('cancelEdit')"
                      />
                    </div>
                  </form>
                </div>
                <template v-else>
                  <button
                    type="button"
                    class="folder-name folder-link"
                    @click="emit('openFolder', folder.id)"
                  >
                    {{ folder.name }}
                  </button>
                  <p class="folder-meta">{{ countLabel(folder.id) }}</p>
                </template>
              </article>
            </div>
          </section>

          <section v-if="searchScope !== 'folders'" class="group">
            <p class="group-title">Files</p>
            <div
              v-if="searchResults.files.length === 0"
              class="empty-state compact"
            >
              No file matches.
            </div>
            <div v-else class="file-grid">
              <article
                v-for="file in searchResults.files"
                :key="file.id"
                class="file-card"
              >
                <div
                  v-if="!(editState?.type === 'file' && editState.id === file.id)"
                  class="card-actions float"
                >
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    aria-label="Rename file"
                    class="card-action-btn"
                    :disabled="busy"
                    @click.stop="emit('startEdit', 'file', file)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    aria-label="Delete file"
                    class="card-action-btn"
                    :disabled="busy"
                    @click.stop="emit('confirmDelete', 'file', file)"
                  />
                </div>
                <div
                  v-if="editState?.type === 'file' && editState.id === file.id"
                  class="col-span-full"
                >
                  <form class="edit-form" @submit.prevent="emit('submitEdit')">
                    <label class="edit-label">Edit file name</label>
                    <InputText
                      v-model="editNameModel"
                      class="w-full"
                      placeholder="Enter file name..."
                      autofocus
                      @focus="$event.target.select()"
                    />
                    <div class="edit-actions">
                      <Button label="Save" :disabled="busy" type="submit" />
                      <Button
                        label="Cancel"
                        severity="secondary"
                        text
                        @click="emit('cancelEdit')"
                      />
                    </div>
                  </form>
                </div>
                <template v-else>
                  <div class="file-preview" :class="fileVariant(file.name)">
                    <span class="file-symbol">{{ fileType(file.name) }}</span>
                  </div>
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-meta">{{ fileType(file.name) }} file</div>
                  </div>
                </template>
              </article>
            </div>
          </section>

          <div v-if="searchHasMore" class="load-more">
            <Button
              label="Load more"
              severity="secondary"
              outlined
              :loading="searchLoading"
              @click="emit('loadMoreSearch')"
            />
          </div>
        </template>
      </div>

      <div v-else>
        <div v-if="selectedId === null" class="empty-state">
          Select a folder in the tree to view its contents.
        </div>

        <div v-else>
          <section class="group">
            <p class="group-title">Folders</p>
            <div v-if="filteredFolders.length === 0" class="empty-state compact">
              No folders here yet.
            </div>
            <div v-else class="folder-grid">
              <article
                v-for="folder in filteredFolders"
                :key="folder.id"
                class="folder-card"
              >
                <div class="folder-top">
                  <div class="folder-icon">
                    <i class="pi pi-folder"></i>
                  </div>
                </div>
                <div
                  v-if="!(editState?.type === 'folder' && editState.id === folder.id)"
                  class="card-actions float"
                >
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    aria-label="Rename folder"
                    class="card-action-btn"
                    :disabled="busy"
                    @click.stop="emit('startEdit', 'folder', folder)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    aria-label="Delete folder"
                    class="card-action-btn"
                    :disabled="busy"
                    @click.stop="emit('confirmDelete', 'folder', folder)"
                  />
                </div>
                <div
                  v-if="editState?.type === 'folder' && editState.id === folder.id"
                  class="col-span-full"
                >
                  <form class="edit-form" @submit.prevent="emit('submitEdit')">
                    <label class="edit-label">Edit folder name</label>
                    <InputText
                      v-model="editNameModel"
                      class="w-full"
                      placeholder="Enter folder name..."
                      autofocus
                      @focus="$event.target.select()"
                    />
                    <div class="edit-actions">
                      <Button label="Save" :disabled="busy" type="submit" />
                      <Button
                        label="Cancel"
                        severity="secondary"
                        text
                        @click="emit('cancelEdit')"
                      />
                    </div>
                  </form>
                </div>
                <template v-else>
                  <button
                    type="button"
                    class="folder-name folder-link"
                    @click="emit('openFolder', folder.id)"
                  >
                    {{ folder.name }}
                  </button>
                  <p class="folder-meta">{{ countLabel(folder.id) }}</p>
                </template>
              </article>
            </div>
          </section>

          <section class="group">
            <p class="group-title">Files</p>
            <div v-if="filteredFiles.length === 0" class="empty-state compact">
              No files here yet.
            </div>
            <div v-else class="file-grid">
              <article
                v-for="file in filteredFiles"
                :key="file.id"
                class="file-card"
              >
                <div
                  v-if="!(editState?.type === 'file' && editState.id === file.id)"
                  class="card-actions float"
                >
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    aria-label="Rename file"
                    class="card-action-btn"
                    :disabled="busy"
                    @click.stop="emit('startEdit', 'file', file)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    aria-label="Delete file"
                    class="card-action-btn"
                    :disabled="busy"
                    @click.stop="emit('confirmDelete', 'file', file)"
                  />
                </div>
                <div
                  v-if="editState?.type === 'file' && editState.id === file.id"
                  class="col-span-full"
                >
                  <form class="edit-form" @submit.prevent="emit('submitEdit')">
                    <label class="edit-label">Edit file name</label>
                    <InputText
                      v-model="editNameModel"
                      class="w-full"
                      placeholder="Enter file name..."
                      autofocus
                      @focus="$event.target.select()"
                    />
                    <div class="edit-actions">
                      <Button label="Save" :disabled="busy" type="submit" />
                      <Button
                        label="Cancel"
                        severity="secondary"
                        text
                        @click="emit('cancelEdit')"
                      />
                    </div>
                  </form>
                </div>
                <template v-else>
                  <div class="file-preview" :class="fileVariant(file.name)">
                    <span class="file-symbol">{{ fileType(file.name) }}</span>
                  </div>
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-meta">{{ fileType(file.name) }} file</div>
                  </div>
                </template>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </main>
</template>
