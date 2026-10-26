import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type NavigationId = "home" | "tools" | "guide" | "playground" | "install" | "compare";

export interface NavigationItem {
  id: NavigationId;
  label: string;
  visible: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  href: string;
  linkLabel: string;
  published: boolean;
}

export interface SiteContent {
  siteTitle: string;
  tagline: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  footerDescription: string;
  navigation: NavigationItem[];
  announcements: Announcement[];
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteTitle: "Devwell",
  tagline: "Des projets sains, des développeurs sereins.",
  heroTitle: "Quatre outils.",
  heroAccent: "Zéro friction.",
  heroDescription:
    "Devwell documente vos releases, vérifie vos variables d'environnement, diagnostique vos projets et nettoie vos branches git. En français, sans configuration, et jamais destructive par défaut.",
  footerDescription:
    "Quatre outils CLI pour retirer le bruit, pas la rigueur. Conçu pour les équipes Node et Python, testé sur Linux, macOS et Windows.",
  navigation: [
    { id: "home", label: "Accueil", visible: true },
    { id: "tools", label: "Outils", visible: true },
    { id: "guide", label: "Guide", visible: true },
    { id: "playground", label: "Playground", visible: true },
    { id: "install", label: "Installation", visible: true },
    { id: "compare", label: "Références", visible: true },
  ],
  announcements: [],
};

const SiteContentContext = createContext<SiteContent>(DEFAULT_SITE_CONTENT);

function isSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== "object") return false;
  const content = value as Partial<SiteContent>;
  return (
    typeof content.siteTitle === "string" &&
    typeof content.tagline === "string" &&
    typeof content.heroTitle === "string" &&
    typeof content.heroAccent === "string" &&
    typeof content.heroDescription === "string" &&
    typeof content.footerDescription === "string" &&
    Array.isArray(content.navigation) &&
    content.navigation.every((item) =>
      item &&
      ["home", "tools", "guide", "playground", "install", "compare"].includes(item.id) &&
      typeof item.label === "string" &&
      typeof item.visible === "boolean",
    ) &&
    Array.isArray(content.announcements) &&
    content.announcements.every((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.message === "string" &&
      typeof item.href === "string" &&
      typeof item.linkLabel === "string" &&
      typeof item.published === "boolean",
    )
  );
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    let active = true;
    fetch("/content/site.json", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Chargement du contenu impossible (${response.status}).`);
        const value: unknown = await response.json();
        if (!isSiteContent(value)) throw new Error("Le fichier de contenu du site a un format invalide.");
        if (active) setContent(value);
      })
      .catch((error: unknown) => {
        console.error("Devwell: contenu distant indisponible; utilisation du contenu intégré.", error);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.title = `${content.siteTitle} — ${content.tagline}`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", content.heroDescription);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${content.siteTitle} — ${content.tagline}`);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", content.heroDescription);
  }, [content.siteTitle, content.tagline, content.heroDescription]);

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
