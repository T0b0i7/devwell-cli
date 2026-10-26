import { toolDocs } from "../data/tools";
import { CopyButton } from "./CopyButton";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { useSiteContent } from "../data/siteContent";

const columns = [
  {
    title: "Outils",
    links: toolDocs.map((tool) => ({ label: tool.name, href: `#/docs/${tool.slug}` })),
  },
  {
    title: "Documentation",
    links: [
      { label: "Installation", href: "#/install" },
      { label: "Guide d'utilisation", href: "#/guide" },
      { label: "Playground", href: "#/playground" },
      { label: "Comparatif", href: "#/comparatif" },
      { label: "Livraison & roadmap", href: "#/livraison" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Ressources & CI", href: "#/ressources" },
      { label: "Code source GitHub", href: "https://github.com/T0b0i7/devwell-cli" },
      { label: "Contribuer", href: "#/ressources" },
      { label: "Licence MIT", href: "#/ressources" },
      { label: "Sécurité", href: "#/guide/securite" },
    ],
  },
];

export function Footer() {
  const content = useSiteContent();
  return (
    <footer className="mt-20 bg-term text-cream sm:mt-28">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo inverted name={content.siteTitle.toLowerCase()} />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[#a7ac9d]">
              {content.footerDescription}
            </p>
            <div className="mt-5 flex max-w-sm items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2">
              <span className="font-mono text-[10px] text-lime">❯</span>
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#d8dcc9]">
                devwell env --json
              </code>
              <CopyButton value="devwell env --json" label="" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2 font-mono text-[9.5px] text-[#9ba190]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" /> v0.1.1 - stable
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-2 py-1">
                <Icon name="shield" size={10} /> dry-run par défaut
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-2 py-1">
                <Icon name="clock" size={10} /> &lt; 200 ms
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-[#8a907f]">{column.title}</p>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => {
                    const external = link.href.startsWith("http");
                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noreferrer" : undefined}
                          className="inline-flex items-center gap-1 text-[12.5px] text-[#b6bbac] transition hover:text-lime"
                        >
                          {link.label}
                          {external && <Icon name="arrow-up-right" size={10} />}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 font-mono text-[9.5px] text-[#7f8576] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Devwell - Licence MIT - Aucune télémétrie</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Fait pour les commits conventionnels</span>
            <span className="text-[#4f5548]">/</span>
            <a href="#/ressources" className="hover:text-lime">CODE_OF_CONDUCT</a>
            <span className="text-[#4f5548]">/</span>
            <a href="#/guide/depannage" className="hover:text-lime">Dépannage</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
