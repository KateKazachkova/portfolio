import Home from "@/components/home/Home";
import CaseShelves from "@/components/home/CaseShelves";
import CaseKit from "@/components/home/CaseKit";

/** Home. The scene is a client component (components/home/Home.tsx); the
 *  still things in the case are rendered here, on the server, and handed to
 *  it as they are. */
export default function Page() {
  return (
    <>
      {/* The wall is the largest thing on the first screen, but as a CSS
          background (globals.css .desk-wall) it is found late and queued
          behind the room's pictures: asked for at the top of the page, ahead
          of them. (ReactDOM.preload only reached the RSC payload, not the HTML.) */}
      <link rel="preload" as="image" href="/scene/desk3d/wall.jpg" fetchPriority="high" />
      <Home shelves={<CaseShelves />} kit={<CaseKit />} />
    </>
  );
}
