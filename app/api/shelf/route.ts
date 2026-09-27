import { getShelf } from "@/lib/content";

/** The books and comics, for the shelf over the CD wallet on home's desk:
 *  home is a client page, so it asks here for what content/about lists. */
export const revalidate = 3600;

export async function GET() {
  return Response.json(getShelf());
}
