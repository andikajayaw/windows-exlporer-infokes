import { mount, flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import App from "./App.vue";
import { fetchFolderChildren, fetchRootFolders } from "./api";

vi.mock("./api", () => ({
  fetchFolder: vi.fn(),
  fetchRootFolders: vi.fn(),
  fetchFolderChildren: vi.fn(),
  fetchFolders: vi.fn(),
  searchItems: vi.fn(),
  createFolder: vi.fn(),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
  createFile: vi.fn(),
  updateFile: vi.fn(),
  deleteFile: vi.fn()
}));

const ButtonStub = {
  props: ["label", "disabled", "loading"],
  template: `<button :disabled="disabled"><slot />{{ label }}</button>`
};

const InputTextStub = {
  props: ["modelValue"],
  emits: ["update:modelValue"],
  template: `<input />`
};

const DropdownStub = {
  props: ["modelValue", "options"],
  emits: ["update:modelValue"],
  template: `<select></select>`
};

const InputSwitchStub = {
  props: ["modelValue"],
  emits: ["update:modelValue"],
  template: `<button type="button"></button>`
};

describe("App", () => {
  it("loads roots and shows children when a folder is selected", async () => {
    const mockFetchRootFolders = vi.mocked(fetchRootFolders);
    const mockFetchFolderChildren = vi.mocked(fetchFolderChildren);

    mockFetchRootFolders.mockResolvedValue({
      folders: [{ id: 1, name: "Projects", parentId: null }],
      meta: { total: 1, limit: null, offset: 0 }
    });

    mockFetchFolderChildren.mockResolvedValue({
      folders: [{ id: 2, name: "2024", parentId: 1 }],
      files: [{ id: 10, name: "spec.pdf", folderId: 1 }]
    });

    const wrapper = mount(App, {
      global: {
        stubs: {
          Button: ButtonStub,
          InputText: InputTextStub,
          Dropdown: DropdownStub,
          InputSwitch: InputSwitchStub
        }
      }
    });

    await flushPromises();

    expect(wrapper.text()).toContain("Projects");
    expect(wrapper.text()).toContain("Select a folder in the tree to view its contents.");

    await wrapper.find(".tree-label").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("2024");
    expect(wrapper.text()).toContain("spec.pdf");
  });
});
