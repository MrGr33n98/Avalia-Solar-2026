"use client";

import Image from "next/image";
import { Building2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Company } from "@/lib/api";
import { projectTypeVisualFor } from "@/lib/company-project-visuals";

interface ProjectsPreviewProps {
  company: Company;
  onTabChange: (tabId: string) => void;
}

export default function ProjectsPreview({ company, onTabChange }: ProjectsPreviewProps) {
  const projectTypes = company.project_types || [];

  return (
    <Card className="overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <header className="mb-2 flex items-center justify-between gap-3">
        <h3 className="truncate text-[13px] font-bold leading-none text-slate-950">
          Portfólio & Projetos
        </h3>

        {projectTypes.length > 0 && (
          <button
            type="button"
            onClick={() => onTabChange("projects")}
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            Ver vitrine completa
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </header>

      {projectTypes.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {projectTypes.map((type) => {
            const { iconSrc } = projectTypeVisualFor(type);

            return (
              <button
                type="button"
                key={type}
                onClick={() => onTabChange("projects")}
                className="flex h-10 w-[118px] min-w-[118px] max-w-[132px] shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                aria-label={`Ver projetos ${type}`}
              >
                {iconSrc ? (
                  <Image
                    src={iconSrc}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 shrink-0 object-contain"
                    unoptimized
                  />
                ) : (
                  <Building2 className="h-[18px] w-[18px] shrink-0 text-blue-600" aria-hidden="true" />
                )}
                <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-tight text-slate-950">
                  {type}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50/30 px-2.5 py-2">
          <span className="truncate text-[11px] font-semibold text-slate-600">
            Portfólio sob demanda
          </span>
          <button
            type="button"
            onClick={() => onTabChange("contact")}
            className="shrink-0 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
          >
            Solicitar projeto
          </button>
        </div>
      )}
    </Card>
  );
}
