import Home from "@/components/home/Home";
import CaseShelves from "@/components/home/CaseShelves";
import CaseKit from "@/components/home/CaseKit";

/** Home. The scene is a client component (components/home/Home.tsx); the
 *  still things in the case are rendered here, on the server, and handed to
 *  it as they are. */
export default function Page() {
  return <Home shelves={<CaseShelves />} kit={<CaseKit />} />;
}
