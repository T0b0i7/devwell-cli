import type { ToolDoc, ToolMeta } from "./types";
import { readmeGen } from "./readmeGen";
import { envDoctor } from "./envDoctor";
import { projectDoctor } from "./projectDoctor";
import { branchCleaner } from "./branchCleaner";

export const toolDocs: ToolDoc[] = [readmeGen, envDoctor, projectDoctor, branchCleaner];

export const tools: ToolMeta[] = toolDocs.map(({ sections: _s, preamble: _p, ...meta }) => meta);

export function getTool(slug: string): ToolDoc | undefined {
  return toolDocs.find((tool) => tool.slug === slug);
}

export const sectionLabels = [
  { letter: "A", label: "Cadrage" },
  { letter: "B", label: "Spécification" },
  { letter: "D", label: "UX CLI" },
  { letter: "E", label: "Implémentation" },
  { letter: "F", label: "Tests" },
  { letter: "G", label: "Documentation" },
  { letter: "H", label: "Livraison" },
];
