export type Folder = {
  id: number;
  name: string;
  parentId: number | null;
};

export type File = {
  id: number;
  name: string;
  folderId: number;
};

export type FolderNode = Folder & {
  children: FolderNode[];
};
