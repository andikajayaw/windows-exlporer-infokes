import { describe, expect, it } from "bun:test";
import { SimpleCache } from "../cache";
import { createSearchService } from "./searchService";

describe("searchService", () => {
  it("returns scoped results and totals", async () => {
    const folderRepository = {
      searchByName: async () => [{ id: 1, name: "Reports", parentId: null }],
      countByName: async () => 1
    };

    const fileRepository = {
      searchByName: async () => [{ id: 9, name: "report.pdf", folderId: 1 }],
      countByName: async () => 2
    };

    const service = createSearchService({
      folderRepository: folderRepository as any,
      fileRepository: fileRepository as any,
      cache: new SimpleCache({ ttlMs: 1000, maxEntries: 10 })
    });

    const results = await service.search({
      query: "rep",
      scope: "folders",
      match: "prefix"
    });

    expect(results.folders).toHaveLength(1);
    expect(results.files).toEqual([]);
    expect(results.totals).toEqual({ folders: 1, files: 0 });
  });
});
