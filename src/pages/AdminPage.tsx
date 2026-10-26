import { useId, useState, useEffect } from "react";
import type { Announcement, NavigationId, SiteContent } from "../data/siteContent";
import { Logo } from "../components/Logo";
import { Icon } from "../components/Icon";
import { useSiteContent } from "../data/siteContent";

type Section = "overview" | "site" | "navigation" | "announcements";
type SessionState = "loading" | "signed-out" | "ready";

const sections: { id: Section; label: string; icon: "home" | "file" | "terminal" | "alert" }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: "home" },
  { id: "site", label: "Identité du site", icon: "file" },
  { id: "navigation", label: "Navigation", icon: "terminal" },
  { id: "announcements", label: "Annonces", icon: "alert" },
];

const navigationRoutes: Record<NavigationId, string> = {
  home: "#/",
  tools: "#/docs/readme-gen",
  guide: "#/guide",
  playground: "#/playground",
  install: "#/install",
  compare: "#/comparatif",
};

function TextField({
  label,
  value,
  onChange,
  help,
  multiline = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  multiline?: boolean;
  maxLength: number;
}) {
  const reactId = useId();
  const id = `field-${reactId}`;
  const className = "mt-1.5 w-full rounded-xl border border-line-strong bg-cream px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime-deep/20";
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink">{label}</label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          maxLength={maxLength}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} resize-y leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
      {help && <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{help}</p>}
      <p className="mt-1 text-right font-mono text-[9px] text-faint">{value.length}/{maxLength}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-lime-deep">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{description}</p>
    </div>
  );
}

export function AdminPage() {
  const currentSiteContent = useSiteContent();
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [contentSha, setContentSha] = useState("");
  const [user, setUser] = useState("");
  const [section, setSection] = useState<Section>("overview");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/content", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (response.status === 401) {
          if (active) setSessionState("signed-out");
          return;
        }
        if (!response.ok) throw new Error(body.error || "Impossible de charger l'administration.");
        if (active) {
          setContent(body.content);
          setContentSha(body.sha);
          setUser(body.user);
          setSessionState("ready");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Une erreur inattendue est survenue.");
          setSessionState("signed-out");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((current) => current ? { ...current, [key]: value } : current);
    setMessage("");
    setError("");
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sha: contentSha }),
      });
      const body = await response.json();
      if (response.status === 401) {
        setSessionState("signed-out");
        throw new Error(body.error || "La session a expiré. Reconnectez-vous.");
      }
      if (!response.ok) throw new Error(body.error || "Enregistrement impossible.");
      if (typeof body.sha === "string" && body.sha) setContentSha(body.sha);
      setMessage(body.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Une erreur inattendue est survenue.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Déconnexion impossible.");
      setContent(null);
      setContentSha("");
      setUser("");
      setSessionState("signed-out");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Une erreur inattendue est survenue.");
    }
  }

  function updateAnnouncement(id: string, change: Partial<Announcement>) {
    update(
      "announcements",
      (content?.announcements ?? []).map((item) => item.id === id ? { ...item, ...change } : item),
    );
  }

  function addAnnouncement() {
    const announcement: Announcement = {
      id: `annonce-${Date.now().toString(36)}`,
      title: "",
      message: "",
      href: "",
      linkLabel: "",
      published: false,
    };
    update("announcements", [...(content?.announcements ?? []), announcement]);
  }

  function moveNavigation(index: number, offset: number) {
    if (!content) return;
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= content.navigation.length) return;
    const navigation = [...content.navigation];
    [navigation[index], navigation[nextIndex]] = [navigation[nextIndex], navigation[index]];
    update("navigation", navigation);
  }

  if (sessionState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p role="status" className="font-mono text-sm text-muted">Vérification de la session admin…</p>
      </main>
    );
  }

  if (sessionState === "signed-out") {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-line bg-cream p-7 shadow-[0_24px_70px_-45px_rgba(23,24,15,0.5)] sm:p-10">
          <a href="#/" aria-label="Retour au site public"><Logo name={currentSiteContent.siteTitle.toLowerCase()} /></a>
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.16em] text-lime-deep">Espace privé</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">Administration</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            Connecte-toi avec le compte GitHub autorisé. Les modifications sont enregistrées dans le dépôt et publiées par Vercel.
          </p>
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose/70 bg-rose/20 px-4 py-3 text-[13px] text-ink">{error}</p>}
          <a
            href="/api/admin/login"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 text-[14px] font-semibold text-cream transition hover:bg-ink-soft focus-visible:outline-lime-deep"
          >
            <Icon name="github" size={17} />
            Se connecter avec GitHub
          </a>
          <a href="#/" className="mt-4 inline-flex min-h-11 items-center text-[13px] font-medium text-muted underline underline-offset-4 hover:text-ink">
            Retour au site public
          </a>
        </section>
      </main>
    );
  }

  const publishedCount = content?.announcements.filter((announcement) => announcement.published).length ?? 0;
  const activeSection = sections.find((item) => item.id === section) ?? sections[0];

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#/" aria-label="Retour au site public"><Logo name={currentSiteContent.siteTitle.toLowerCase()} /></a>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#/" className="hidden min-h-10 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-muted hover:bg-paper-2 hover:text-ink sm:inline-flex">
              Voir le site <Icon name="arrow-up-right" size={13} />
            </a>
            <span className="max-w-32 truncate rounded-full border border-line bg-cream px-3 py-1.5 text-[11px] text-muted sm:max-w-none">{user}</span>
            <button type="button" onClick={logout} className="min-h-10 rounded-lg border border-line px-3 text-[12px] font-medium text-ink transition hover:bg-paper-2">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-7 px-4 py-6 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <nav aria-label="Sections d'administration" className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:h-fit lg:flex-col lg:overflow-visible">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSection(item.id); setMessage(""); setError(""); }}
              aria-current={section === item.id ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3.5 text-left text-[13px] font-medium transition ${
                section === item.id ? "bg-ink text-cream shadow-sm" : "text-muted hover:bg-paper-2 hover:text-ink"
              }`}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
          <div className="mt-3 hidden rounded-2xl border border-line bg-cream p-4 lg:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">Publication</p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">Enregistrement GitHub, puis déploiement automatique Vercel.</p>
          </div>
        </nav>

        <section className="min-w-0">
          {section === "overview" && (
            <>
              <SectionHeading eyebrow="Devwell · Administration" title="Vue d'ensemble" description="Gère les annonces et les informations visibles sur le site. Chaque enregistrement crée un commit dans le dépôt." />
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Compte admin", user],
                  ["Annonces publiées", `${publishedCount}`],
                  ["Éléments de navigation", `${content?.navigation.filter((item) => item.visible).length ?? 0}`],
                ].map(([label, value]) => (
                  <article key={label} className="rounded-2xl border border-line bg-cream p-5">
                    <p className="text-[12px] text-muted">{label}</p>
                    <p className="mt-3 truncate font-display text-xl font-semibold text-ink">{value}</p>
                  </article>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-line bg-cream p-5 sm:p-6">
                <h2 className="font-display text-lg font-semibold text-ink">À propos de la publication</h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
                  Les changements sont sauvegardés dans le fichier de contenu du dépôt GitHub. Vercel reconstruit ensuite le site ; il peut falloir un court délai avant de voir les modifications publiques.
                </p>
                <button type="button" onClick={() => setSection("announcements")} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime px-4 text-[13px] font-semibold text-ink transition hover:bg-lime-bright">
                  Gérer les annonces <Icon name="arrow-right" size={14} />
                </button>
              </div>
            </>
          )}

          {section === "site" && content && (
            <>
              <SectionHeading eyebrow="Contenu du site" title="Identité et accueil" description="Modifie le titre, la signature, le contenu du hero et le texte de présentation du pied de page." />
              <div className="grid gap-5 rounded-2xl border border-line bg-cream p-5 sm:grid-cols-2 sm:p-7">
                <TextField label="Titre du site" value={content.siteTitle} maxLength={80} onChange={(value) => update("siteTitle", value)} />
                <TextField label="Signature" value={content.tagline} maxLength={180} onChange={(value) => update("tagline", value)} />
                <TextField label="Titre principal" value={content.heroTitle} maxLength={100} onChange={(value) => update("heroTitle", value)} />
                <TextField label="Accroche" value={content.heroAccent} maxLength={80} onChange={(value) => update("heroAccent", value)} />
                <div className="sm:col-span-2">
                  <TextField label="Description de l'accueil" value={content.heroDescription} maxLength={500} multiline onChange={(value) => update("heroDescription", value)} />
                </div>
                <div className="sm:col-span-2">
                  <TextField label="Texte du pied de page" value={content.footerDescription} maxLength={400} multiline onChange={(value) => update("footerDescription", value)} />
                </div>
              </div>
            </>
          )}

          {section === "navigation" && content && (
            <>
              <SectionHeading eyebrow="Navigation principale" title="Ordre et visibilité" description="Réorganise les liens du menu principal, ajuste leur libellé ou masque temporairement une entrée." />
              <div className="space-y-3">
                {content.navigation.map((item, index) => (
                  <article key={item.id} className="grid gap-3 rounded-2xl border border-line bg-cream p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.8fr)] sm:items-center">
                      <TextField
                        label={`Libellé ${index + 1}`}
                        value={item.label}
                        maxLength={32}
                        onChange={(label) => update("navigation", content.navigation.map((entry) => entry.id === item.id ? { ...entry, label } : entry))}
                      />
                      <p className="px-1 font-mono text-[11px] text-muted">{navigationRoutes[item.id]}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <label className="inline-flex min-h-11 items-center gap-2 text-[12px] text-ink">
                        <input
                          type="checkbox"
                          checked={item.visible}
                          onChange={(event) => update("navigation", content.navigation.map((entry) => entry.id === item.id ? { ...entry, visible: event.target.checked } : entry))}
                          className="h-4 w-4 accent-lime-deep"
                        />
                        Visible
                      </label>
                      <button type="button" aria-label={`Monter ${item.label}`} disabled={index === 0} onClick={() => moveNavigation(index, -1)} className="min-h-11 min-w-11 rounded-lg border border-line text-ink transition hover:bg-paper-2 disabled:opacity-40">↑</button>
                      <button type="button" aria-label={`Descendre ${item.label}`} disabled={index === content.navigation.length - 1} onClick={() => moveNavigation(index, 1)} className="min-h-11 min-w-11 rounded-lg border border-line text-ink transition hover:bg-paper-2 disabled:opacity-40">↓</button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {section === "announcements" && content && (
            <>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <SectionHeading eyebrow="Messages publics" title="Annonces" description="Crée des annonces, garde-les en brouillon ou publie-les sur la page d'accueil." />
                <button type="button" onClick={addAnnouncement} disabled={content.announcements.length >= 20} className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-[13px] font-semibold text-cream transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50">
                  <Icon name="spark" size={14} /> Nouvelle annonce
                </button>
              </div>
              {content.announcements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line-strong bg-cream p-8 text-center">
                  <p className="font-display text-lg font-semibold text-ink">Aucune annonce pour le moment</p>
                  <p className="mt-2 text-[13px] text-muted">Crée une annonce en brouillon ; tu pourras la publier quand elle sera prête.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {content.announcements.map((announcement) => (
                    <article key={announcement.id} className="rounded-2xl border border-line bg-cream p-5 sm:p-6">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-wide text-faint">{announcement.id}</span>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex min-h-11 items-center gap-2 text-[12px] font-medium text-ink">
                            <input type="checkbox" checked={announcement.published} onChange={(event) => updateAnnouncement(announcement.id, { published: event.target.checked })} className="h-4 w-4 accent-lime-deep" />
                            {announcement.published ? "Publiée" : "Brouillon"}
                          </label>
                          <button type="button" onClick={() => update("announcements", content.announcements.filter((item) => item.id !== announcement.id))} className="min-h-11 rounded-lg px-3 text-[12px] font-medium text-[#9b3d32] transition hover:bg-rose/20">
                            Supprimer
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField label="Titre" value={announcement.title} maxLength={100} onChange={(title) => updateAnnouncement(announcement.id, { title })} />
                        <TextField label="Libellé du lien (facultatif)" value={announcement.linkLabel} maxLength={50} onChange={(linkLabel) => updateAnnouncement(announcement.id, { linkLabel })} />
                        <div className="sm:col-span-2">
                          <TextField label="Message" value={announcement.message} maxLength={500} multiline onChange={(message) => updateAnnouncement(announcement.id, { message })} />
                        </div>
                        <div className="sm:col-span-2">
                          <TextField label="Lien (optionnel)" value={announcement.href} maxLength={300} help="Lien interne comme #/install ou URL HTTPS." onChange={(href) => updateAnnouncement(announcement.id, { href })} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {(message || error) && (
            <p role={error ? "alert" : "status"} aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-[13px] ${error ? "border-rose/70 bg-rose/20 text-ink" : "border-lime-deep/25 bg-lime-soft text-ink"}`}>
              {error || message}
            </p>
          )}

          <div className="sticky bottom-3 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-cream/95 p-3 shadow-lg backdrop-blur-xl sm:px-4">
            <p className="px-1 text-[11px] text-muted">Section : {activeSection.label}</p>
            <button type="button" onClick={save} disabled={!content || saving} className="inline-flex min-h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-[13px] font-semibold text-cream transition hover:bg-ink-soft disabled:cursor-wait disabled:opacity-60">
              {saving ? "Enregistrement…" : "Enregistrer"}
              {!saving && <Icon name="check" size={14} className="text-lime" />}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
