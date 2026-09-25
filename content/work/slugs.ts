/**
 * The slugs of the cases written up in content/work, without their content,
 * so home can tell which case files open a page without bundling the cases.
 * content/work/index.ts checks it against the cases themselves.
 */
export const WRITTEN_SLUGS = ["ukrainska-15", "waypro"] as const;

export const isWritten = (slug: string) => (WRITTEN_SLUGS as readonly string[]).includes(slug);
