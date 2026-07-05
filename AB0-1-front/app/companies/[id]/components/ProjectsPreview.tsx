"use client";

import Image from "next/image";
import { Building2, ArrowRight, Zap, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";
import { projectTypeVisualFor } from "@/lib/company-project-visuals";

interface ProjectsPreviewProps {
  company: Company;
  onTabChange: (tabId: string) => void;
}

export default function ProjectsPreview({ company, onTabChange }: ProjectsPreviewProps) {
  const projectTypes = company.project_types || [];

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-9 shadow-sm md:py-12">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950">Portfólio & Projetos</h3>
              <p className="text-xs text-slate-500">Vitrine de especialidades e obras da empresa.</p>
            </div>
          </div>
          {projectTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTabChange("projects")}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 rounded-xl hover:bg-slate-50 inline-flex items-center gap-1"
            >
              Ver vitrine completa
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {projectTypes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {projectTypes.slice(0, 5).map((type, index) => {
              const {
                iconSrc,
                bgGradient = "from-blue-500/20 to-indigo-500/20",
                description = "Instalação de painéis de alta tecnologia.",
              } = projectTypeVisualFor(type);

              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-slate-50/30 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className={`h-14 w-full bg-gradient-to-br ${bgGradient} relative flex items-center justify-center p-2`}>
                    <div className="bg-white p-1.5 rounded-xl shadow-md group-hover:scale-110 transition-transform flex items-center justify-center relative w-10 h-10 border border-slate-100">
                      {iconSrc ? (
                        <Image
                          src={iconSrc}
                          alt={type}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <Zap className="h-5 w-5 text-blue-600 fill-current" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors uppercase line-clamp-1">
                        {type}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                        {description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      <Award className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      <span className="truncate">Qualidade</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio Premium */
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/30">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-bounce" />
            <h4 className="font-bold text-slate-900 text-sm">Portfólio sob demanda!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              Esta empresa realiza projetos fotovoltaicos sob medida para residências, comércios e indústrias da região. Solicite um estudo personalizado.
            </p>
            <Button
              size="sm"
              onClick={() => onTabChange("contact")}
              className="rounded-xl bg-blue-700 hover:bg-blue-800 text-xs font-bold text-white shadow-md inline-flex items-center gap-1.5"
            >
              Solicitar Projeto Customizado
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
