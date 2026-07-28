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
      sorts: [{ property: "Year", direction: "descending" }],
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        name: props.Name?.title?.[0]?.plain_text ?? "",
        project: props.Project?.rich_text?.[0]?.plain_text ?? "",
        issuer: props.Issuer?.rich_text?.[0]?.plain_text ?? "",
        year: props.Year?.number ?? null,
        category: props.Category?.select?.name ?? null,
        url: props.URL?.url ?? null,
      };
    });
  } catch (e) {
    console.error("Notion awards error:", e);
    return [];
  }
}
