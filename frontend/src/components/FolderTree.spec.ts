import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FolderTree from "./FolderTree.vue";
import type { FolderNode } from "../types";

describe("FolderTree", () => {
  it("renders folder names and highlights selection", () => {
    const nodes: FolderNode[] = [
      {
        id: 1,
        name: "Root",
        parentId: null,
        children: [
          {
            id: 2,
            name: "Child",
            parentId: 1,
            children: []
          }
        ]
      }
    ];

    const wrapper = mount(FolderTree, {
      props: {
        nodes,
        selectedId: 2,
        expandedIds: new Set([1])
      }
    });

    expect(wrapper.text()).toContain("Root");
    expect(wrapper.text()).toContain("Child");

    const rows = wrapper.findAll(".tree-row");
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[1].classes()).toContain("selected");
  });
});
