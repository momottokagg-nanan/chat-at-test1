export type Memo = {
  id: string;
  content: string;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type MemoWithTags = Memo & {
  tags: Tag[];
};
