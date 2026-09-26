"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { glOn } from "@/lib/room/flag";
import "./room.css";

/** Whether the WebGL room is on: false on the server and the first render
 *  (so hydration matches), then what the boot script decided. */
const noSubscribe = () => () => {};
export function useGl() {
  return useSyncExternalStore(noSubscribe, glOn, () => false);
}

/**
 * Starts the WebGL room over the stage once the page is up. three.js and
 * the scene load only here, only under the flag.
 */
export function RoomGL({ cam, home }: { cam: React.RefObject<HTMLDivElement | null>; home: React.RefObject<HTMLDivElement | null> }) {
  const router = useRouter();
  const nav = useRef(router);
  useEffect(() => { nav.current = router; }, [router]);
  useEffect(() => {
    const el = cam.current, h = home.current;
    const stage = el?.parentElement;
    if (!el || !stage || !h) return;
    let room: { dispose(): void } | null = null;
    let dead = false;
    import("./engine").then(({ startRoom }) =>
      startRoom({
        stage, cam: el, before: h,
        groups: { case: stage.querySelector<HTMLElement>(".case-world"), clock: h.querySelector<HTMLElement>(".flip-clock-slot"), lamp: h.querySelector<HTMLElement>(".desk-lamp") },
        onArrive: () => dispatchEvent(new Event("room:arrive")),
        poster: stage.querySelector<HTMLElement>(".room-poster"),
        navigate: (href) => nav.current.push(href),
      }),
    ).then((r) => {
      if (dead) r.dispose(); else { room = r; (window as unknown as { __room: unknown }).__room = r; document.documentElement.dataset.glReady = "1"; }
    }).catch((e) => { console.error("room", e); document.documentElement.dataset.glFailed = "1"; });
    return () => { dead = true; room?.dispose(); delete document.documentElement.dataset.glReady; };
  }, [cam, home]);
  return null;
}
