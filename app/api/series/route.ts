import { getSeries } from "@/lib/content";

/** The series, for the CD wallet on home's desk: home is a client page, so
 *  it asks here for what Off Duty reads straight off content/about. */
export const revalidate = 3600;

export async function GET() {
  return Response.json(getSeries());
}
