import type { Block, Tone } from "../data/types";
import { cn } from "../utils/cn";
import { CodeBlock } from "./CodeBlock";
import { Icon } from "./Icon";

function Inline({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} className="doc-code">
            {part}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

const calloutStyles: Record<Tone, { wrap: string; icon: Parameters<typeof Icon>[0]["name"]; label: string; description: string }> = {
  info: { wrap: "border-lime-deep/25 bg-lime-soft/70 text-ink", icon: "info", label: "text-lime-deep", description: "text-ink-soft" },
  warn: { wrap: "border-[#c99a3f]/35 bg-[#f6ecd5] text-on-accent", icon: "alert", label: "text-[#8a6418]", description: "text-current" },
  success: { wrap: "border-[#6b9a7d]/35 bg-[#e7f2e9] text-on-accent", icon: "check", label: "text-[#386347]", description: "text-current" },
  danger: { wrap: "border-[#c47369]/35 bg-[#f8e6e2] text-on-accent", icon: "alert", label: "text-[#8f3f36]", description: "text-current" },
  neutral: { wrap: "border-line bg-paper-2 text-ink", icon: "info", label: "text-muted", description: "text-ink-soft" },
};

function TableBlock({ headers, rows, caption }: Extract<Block, { type: "table" }>) {
  return (
    <div className="my-5">
      <div className="overflow-x-auto rounded-xl border border-line bg-cream">
        <table className="w-full min-w-[36rem] border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line bg-paper-2/80">
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-3.5 py-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted first:pl-4 last:pr-4"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-line/70 last:border-b-0 hover:bg-paper/60">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "px-3.5 py-2.5 align-top leading-relaxed first:pl-4 last:pr-4",
                      cellIndex === 0 ? "font-medium text-ink" : "text-ink-soft",
                    )}
                  >
                    <Inline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <p className="mt-2 font-mono text-[10px] text-faint">{caption}</p>}
    </div>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-doc">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "p":
            return (
              <p key={index} className="my-4 text-[15.5px] leading-[1.78] text-ink-soft">
                <Inline text={block.text} />
              </p>
            );

          case "h3":
            return (
              <h3
                key={index}
                className="mt-8 mb-2 flex items-center gap-2 font-display text-[16.5px] font-semibold tracking-[-0.015em] text-ink"
              >
                <span className="h-[7px] w-[7px] rotate-45 bg-lime-deep/60" aria-hidden="true" />
                {block.text}
              </h3>
            );

          case "list":
            return (
              <ul key={index} className="my-4 space-y-2.5">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14.5px] leading-[1.7] text-ink-soft">
                    {block.ordered ? (
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-line bg-paper-2 font-mono text-[10px] font-semibold text-ink-soft">
                        {i + 1}
                      </span>
                    ) : (
                      <span
                        className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lime-soft text-[9px] font-bold text-lime-deep"
                        aria-hidden="true"
                      >
                        •
                      </span>
                    )}
                    <span>
                      <Inline text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "code":
            return <CodeBlock key={index} code={block.code} title={block.title} lang={block.lang} note={block.note} />;

          case "table":
            return <TableBlock key={index} {...block} />;

          case "callout": {
            const style = calloutStyles[block.tone];
            return (
              <aside key={index} className={cn("my-5 rounded-xl border-l-[3px] px-4 py-3.5", style.wrap)}>
                <p className={cn("flex items-center gap-2 font-display text-[13px] font-semibold", style.label)}>
                  <Icon name={style.icon} size={15} />
                  {block.title}
                </p>
                <p className={cn("mt-1.5 text-[13px] leading-[1.7]", style.description)}>
                  <Inline text={block.text} />
                </p>
              </aside>
            );
          }

          case "check":
            return (
              <div key={index} className="my-5 rounded-xl border border-line bg-cream p-4">
                {block.title && (
                  <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {block.title}
                  </p>
                )}
                <ul className="space-y-2.5">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                      <span
                        className={cn(
                          "mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border",
                          item.done
                            ? "border-lime-deep/40 bg-lime text-on-accent"
                            : "border-line-strong bg-paper text-transparent",
                        )}
                        aria-hidden="true"
                      >
                        <Icon name="check" size={11} strokeWidth={2.6} />
                      </span>
                      <span>{item.label}</span>
                      <span className="sr-only">{item.done ? "(fait)" : "(à faire)"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );

          case "kv":
            return (
              <dl key={index} className="my-5 overflow-hidden rounded-xl border border-line">
                {block.items.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-4",
                      i % 2 === 0 ? "bg-cream" : "bg-paper-2/50",
                      i > 0 && "border-t border-line/70",
                    )}
                  >
                    <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted sm:pt-1">{item.k}</dt>
                    <dd className="text-[13px] leading-relaxed text-ink-soft">
                      <Inline text={item.v} />
                    </dd>
                  </div>
                ))}
              </dl>
            );

          case "tree":
            return <CodeBlock key={index} code={block.code} title={block.title ?? "arborescence"} lang="text" />;

          case "ascii":
            return <CodeBlock key={index} code={block.code} title={block.title ?? "sortie console"} lang="console" />;

          case "flow":
            return (
              <ol key={index} className="my-5 space-y-0">
                {block.steps.map((step, i) => (
                  <li key={i} className="relative flex gap-3.5 pb-4 last:pb-0">
                    {i < block.steps.length - 1 && (
                      <span className="absolute left-[13px] top-7 h-[calc(100%-1.1rem)] w-px bg-line" aria-hidden="true" />
                    )}
                    <span className="relative z-[1] mt-0.5 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-lg border border-line bg-cream font-mono text-[10px] font-semibold text-ink">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">{step.title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">
                        <Inline text={step.text} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            );

          case "badges":
            return (
              <div key={index} className="my-4 flex flex-wrap gap-1.5">
                {block.items.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-2.5 py-1 font-mono text-[9.5px] tracking-[0.03em] text-ink-soft"
                  >
                    <span className="h-1 w-1 rounded-full bg-lime-deep" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
