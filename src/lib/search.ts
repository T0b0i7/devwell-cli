import { toolDocs } from "../data/tools";
import { guideSections } from "../data/guide";

export type SearchItem = {
  title: string;
  subtitle: string;
  group: string;
  href: string;
  keywords?: string;
};

export const searchIndex: SearchItem[] = [
  { title: "Vue d'ensemble", subtitle: "Devwell et ses quatre commandes", group: "Démarrage", href: "#/", keywords: "accueil home devwell" },
  { title: "Installation", subtitle: "Installer et vérifier en moins d'une minute", group: "Démarrage", href: "#/install", keywords: "npm npx install prerequis setup" },
  { title: "Guide d'utilisation", subtitle: "Du premier audit jusqu'à la CI", group: "Démarrage", href: "#/guide", keywords: "guide mode emploi tutoriel" },
  { title: "Playground", subtitle: "Simuler les sorties des quatre outils", group: "Démarrage", href: "#/playground", keywords: "demo terminal simulation" },
  { title: "Comparatif des outils", subtitle: "Langage, dépendances, LOC, priorités", group: "La suite", href: "#/comparatif", keywords: "tableau comparaison priorite roadmap" },
  { title: "Livraison & roadmap", subtitle: "Release, communication, v1 à v2", group: "La suite", href: "#/livraison", keywords: "release publish semver slack roadmap" },
  { title: "Ressources", subtitle: "Workflow CI, licence, conventions", group: "La suite", href: "#/ressources", keywords: "github actions ci license mit contribuer" },
  ...toolDocs.flatMap((tool) => [
    {
      title: tool.name,
      subtitle: tool.tagline,
      group: "Les outils",
      href: `#/docs/${tool.slug}`,
      keywords: `${tool.binary} ${tool.short} ${tool.tags.join(" ")}`,
    },
    ...tool.sections.map((section) => ({
      title: `${tool.name}  ${section.letter}. ${section.title}`,
      subtitle: section.subtitle,
      group: tool.name,
      href: `#/docs/${tool.slug}/${section.id}`,
      keywords: `${tool.slug} ${section.title} ${section.subtitle}`,
    })),
  ]),
  ...guideSections.map((section) => ({
    title: `Guide  ${section.title}`,
    subtitle: section.kicker,
    group: "Guide d'utilisation",
    href: `#/guide/${section.id}`,
    keywords: `guide ${section.kicker} ${section.title}`,
  })),
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchDocs(query: string, limit = 12): SearchItem[] {
  const q = normalize(query.trim());
  if (!q) return searchIndex.slice(0, 8);

  const scored = searchIndex
    .map((item) => {
      const title = normalize(item.title);
      const haystack = normalize(`${item.title} ${item.subtitle} ${item.group} ${item.keywords ?? ""}`);
      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 70;
      else if (title.includes(q)) score = 50;
      else if (haystack.includes(q)) score = 20;
      else {
        const words = q.split(/\s+/);
        if (words.length > 1 && words.every((word) => haystack.includes(word))) score = 10;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.item);
}
