import { useEffect, useRef, useState } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { Footer } from "./components/Footer";
import { SidebarNav } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { routeKey, useRoute } from "./lib/router";
import { HomePage } from "./pages/HomePage";
import { ToolDocPage } from "./pages/ToolDocPage";
import { GuidePage } from "./pages/GuidePage";
import { PlaygroundPage } from "./pages/PlaygroundPage";
import { ComparePage, InstallPage, ReleasePage, ResourcesPage } from "./pages/SuitePages";

const sidebarRoutes = new Set(["tool", "guide", "install", "resources", "release"]);

export default function App() {
  const route = useRoute();
  const [mobileNav, setMobileNav] = useState(false);
  const [palette, setPalette] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const key = routeKey(route);
  const withSidebar = sidebarRoutes.has(route.name);

  useEffect(() => {
    if (route.name === "tool" || route.name === "guide") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [key, route.name]);

  useEffect(() => {
    setMobileNav(false);
  }, [key, route.name]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileNav(false);
        setPalette((open) => !open);
      }
      if (event.key === "Escape") {
        setMobileNav(false);
        setPalette(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileNav) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeout = setTimeout(
      () => mobileNavRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus(),
      0,
    );
    return () => {
      clearTimeout(timeout);
      document.body.style.overflow = previous;
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
      previousFocusRef.current = null;
    };
  }, [mobileNav]);

  function closeMobileNav() {
    setMobileNav(false);
  }

  function trapMobileNavFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      closeMobileNav();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = mobileNavRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function renderPage() {
    switch (route.name) {
      case "home":
        return <HomePage />;
      case "tool":
        return <ToolDocPage key={`tool-${route.slug}`} route={route} />;
      case "guide":
        return <GuidePage route={route} />;
      case "playground":
        return <PlaygroundPage />;
      case "compare":
        return <ComparePage />;
      case "install":
        return <InstallPage />;
      case "resources":
        return <ResourcesPage />;
      case "release":
        return <ReleasePage />;
      default:
        return <HomePage />;
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <a
        href="#contenu"
        onClick={(event) => {
          event.preventDefault();
          const target = document.getElementById("contenu");
          target?.focus({ preventScroll: true });
          target?.scrollIntoView({ behavior: "auto", block: "start" });
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-[12px] focus:text-lime"
      >
        Aller au contenu principal
      </a>

      <TopBar route={route} onMenu={() => setMobileNav(true)} onSearch={() => setPalette(true)} />

      <div className="mx-auto flex w-full max-w-[1440px]">
        {withSidebar && (
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[252px] shrink-0 border-r border-line/80 bg-paper/50 px-3.5 py-6 lg:block xl:w-[266px]">
            <SidebarNav route={route} />
          </aside>
        )}

        <div id="contenu" tabIndex={-1} className="min-w-0 flex-1 overflow-x-clip outline-none">
          {renderPage()}
        </div>
      </div>

      <Footer />

      {/* Mobile navigation */}
      {mobileNav && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Fermer la navigation"
            onClick={closeMobileNav}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />
          <div
            ref={mobileNavRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onKeyDown={trapMobileNavFocus}
            className="nav-ambient absolute inset-y-0 left-0 flex w-[88%] max-w-[360px] flex-col overflow-hidden border-r border-line bg-paper p-3 shadow-2xl"
          >
            <div className="nav-color-flow pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative z-10 min-h-0 flex-1">
              <SidebarNav route={route} onNavigate={closeMobileNav} onClose={closeMobileNav} mobile />
            </div>
          </div>
        </div>
      )}

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
