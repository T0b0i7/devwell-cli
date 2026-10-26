import { useEffect, useState } from "react";

export type Route =
  | { name: "home" }
  | { name: "tool"; slug: string; section?: string }
  | { name: "guide"; section?: string }
  | { name: "install" }
  | { name: "resources" }
  | { name: "release" }
  | { name: "compare" }
  | { name: "playground" }
  | { name: "admin" };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "").replace(/\/$/, "");
  if (!clean) return { name: "home" };
  let parts: string[];
  try {
    parts = clean.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return { name: "home" };
  }

  switch (parts[0]) {
    case "docs":
      if (parts[1]) return { name: "tool", slug: parts[1], section: parts[2] };
      return { name: "home" };
    case "guide":
      return { name: "guide", section: parts[1] };
    case "install":
      return { name: "install" };
    case "ressources":
      return { name: "resources" };
    case "livraison":
      return { name: "release" };
    case "comparatif":
      return { name: "compare" };
    case "playground":
      return { name: "playground" };
    case "admin":
      return { name: "admin" };
    default:
      return { name: "home" };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export function routeKey(route: Route): string {
  switch (route.name) {
    case "tool":
      return `tool:${route.slug}`;
    case "guide":
      return "guide";
    default:
      return route.name;
  }
}

export function scrollToSection(id?: string) {
  if (!id) {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  requestAnimationFrame(() => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  });
}
