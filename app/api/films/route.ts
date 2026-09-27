import { getFilms } from "@/lib/content";

/** The films, for the VHS stacks on home's desk: home is a client page, so
 *  it asks here for what content/about lists. */
export const revalidate = 3600;

export async function GET() {
  return Response.json(getFilms());
}
