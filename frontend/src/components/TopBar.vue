<script setup lang="ts">
import { computed } from "vue";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import type { SearchScope } from "../api";

type Breadcrumb = { id: number | null; name: string };

const props = defineProps<{
  breadcrumbs: Breadcrumb[];
  searchQuery: string;
  searchScope: SearchScope;
  searchScopeOptions: { label: string; value: SearchScope }[];
  sidebarOpen: boolean;
}>();

const emit = defineEmits<{
  (event: "update:searchQuery", value: string): void;
  (event: "update:searchScope", value: SearchScope): void;
  (event: "breadcrumb", id: number | null): void;
  (event: "toggleSidebar"): void;
}>();

const queryModel = computed({
  get: () => props.searchQuery,
  set: (value: string) => emit("update:searchQuery", value)
});

const scopeModel = computed({
  get: () => props.searchScope,
  set: (value: SearchScope) => emit("update:searchScope", value)
});
</script>

<template>
  <header class="topbar">
    <button
      type="button"
      class="sidebar-toggle"
      :aria-label="props.sidebarOpen ? 'Hide sidebar' : 'Show sidebar'"
      :aria-expanded="props.sidebarOpen"
      @click="emit('toggleSidebar')"
    >
      <i :class="props.sidebarOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
    </button>
    <div class="path-bar">
      <span class="path-icon" aria-hidden="true">
        <i class="pi pi-folder-open"></i>
      </span>
      <div
        v-for="(crumb, index) in breadcrumbs"
        :key="`${crumb.name}-${index}`"
        class="crumb"
        :class="{ active: index === breadcrumbs.length - 1 }"
      >
        <button
          class="crumb-btn"
          type="button"
          :disabled="index === breadcrumbs.length - 1"
          @click="emit('breadcrumb', crumb.id)"
        >
          {{ crumb.name }}
        </button>
        <i v-if="index < breadcrumbs.length - 1" class="pi pi-angle-right"></i>
      </div>
    </div>

    <div class="search flex items-center gap-2">
      <i class="pi pi-search text-slate-500"></i>
      <InputText
        v-model="queryModel"
        type="search"
        placeholder="Search folders and files"
        class="flex-1 min-w-0"
      />
      <Dropdown
        v-model="scopeModel"
        :options="searchScopeOptions"
        optionLabel="label"
        optionValue="value"
        class="search-dropdown"
      />
    </div>
  </header>
</template>
