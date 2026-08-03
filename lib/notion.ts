import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function getProjects() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_PROJECTS_DB!,
    filter: {
      property: "Published",
      checkbox: { equals: true },
    },
    sorts: [{ property: "Order", direction: "ascending" }],
  });

  return response.results.map((page: any) => {
    const props = page.properties;
    return {
      id: page.id,
      title: props.Name?.title?.[0]?.plain_text ?? "",
      slug: props.Slug?.rich_text?.[0]?.plain_text ?? "",
      description: props.Description?.rich_text?.[0]?.plain_text ?? "",
      tags: props.Tags?.multi_select?.map((t: any) => t.name) ?? [],
      cover: props.Cover?.files?.[0]?.file?.url ?? props.Cover?.files?.[0]?.external?.url ?? null,
    };
  });
}

// Fetch all child blocks of a Notion page/block, following pagination.
export async function getBlocks(blockId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const res: any = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  // Pull one level of children for lists / toggles / columns so nested
  // content renders too.
  for (const b of blocks) {
    if (b.has_children) {
      try { b.children = await getBlocks(b.id); } catch { b.children = []; }
    }
  }
  return blocks;
}

// A single published project by slug, with its page body blocks. null if missing.
export async function getProject(slug: string) {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_PROJECTS_DB!,
    filter: {
      and: [
        { property: "Slug", rich_text: { equals: slug } },
        { property: "Published", checkbox: { equals: true } },
      ],
    },
    page_size: 1,
  });

  const page: any = response.results[0];
  if (!page) return null;
  const props = page.properties;
  const blocks = await getBlocks(page.id);

  return {
    id: page.id,
    title: props.Name?.title?.[0]?.plain_text ?? "",
    slug: props.Slug?.rich_text?.[0]?.plain_text ?? slug,
    description: props.Description?.rich_text?.[0]?.plain_text ?? "",
    tags: props.Tags?.multi_select?.map((t: any) => t.name) ?? [],
    cover: props.Cover?.files?.[0]?.file?.url ?? props.Cover?.files?.[0]?.external?.url ?? null,
    blocks,
  };
}

export async function getCertificates() {
  if (!process.env.NOTION_CERTIFICATES_DB) return [];

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_CERTIFICATES_DB,
      sorts: [{ property: "Date", direction: "descending" }],
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        name: props.Name?.title?.[0]?.plain_text ?? "",
        issuer: props.Issuer?.rich_text?.[0]?.plain_text ?? "",
        date: props.Date?.date?.start ?? null,
        url: props.URL?.url ?? null,
        category: props.Category?.select?.name ?? null,
      };
    });
  } catch (e) {
    console.error("Notion certificates error:", e);
    return [];
  }
}

export async function getAwards() {
  if (!process.env.NOTION_AWARDS_DB) return [];

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_AWARDS_DB,
      sorts: [{ property: "Date", direction: "descending" }],
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      const dateStart = props.Date?.date?.start ?? null;
      return {
        id: page.id,
        name: props.Name?.title?.[0]?.plain_text ?? "",
        project: props.Project?.rich_text?.[0]?.plain_text ?? "",
        issuer: props.Issuer?.rich_text?.[0]?.plain_text ?? "",
        year: dateStart ? new Date(dateStart).getFullYear() : null,
        category: props.Category?.select?.name ?? null,
        url: props.URL?.url ?? null,
      };
    });
  } catch (e) {
    console.error("Notion awards error:", e);
    return [];
  }
}
