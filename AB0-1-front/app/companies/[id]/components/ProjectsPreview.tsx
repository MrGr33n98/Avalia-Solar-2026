"use client";

import Image from "next/image";
import { Building2, ArrowRight, Zap, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";

interface ProjectsPreviewProps {
  company: Company;
  onTabChange: (tabId: string) => void;
}

export default function ProjectsPreview({ company, onTabChange }: ProjectsPreviewProps) {
  const projectTypes = company.project_types || [];

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm overflow-hidden relative">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {projectTypes.slice(0, 3).map((type, index) => {
              const typeLower = type.toLowerCase();
              let iconSrc = null;
              let bgGradient = "from-blue-500/20 to-indigo-500/20";
              let description = "Instalação de painéis de alta tecnologia.";

              if (typeLower.includes("residenc")) {
                iconSrc = "/images/icone-avalia-solar-residencial.png";
                bgGradient = "from-orange-500/10 to-amber-500/10";
                description = "Economia imediata para lares com sustentabilidade.";
              } else if (typeLower.includes("comerci")) {
                iconSrc = "/images/comercial-icone-avalia-solar.png";
                bgGradient = "from-blue-500/10 to-cyan-500/10";
                description = "Redução drástica de custos fixos operacionais.";
              } else if (typeLower.includes("rura")) {
                iconSrc = "/images/rural-icone-avalia-solar.png";
                bgGradient = "from-emerald-500/10 to-teal-500/10";
                description = "Independência energética para agronegócios.";
              }

              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-100 bg-slate-50/30 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className={`h-24 w-full bg-gradient-to-br ${bgGradient} relative flex items-center justify-center p-4`}>
                    <div className="bg-white p-3 rounded-2xl shadow-md group-hover:scale-115 transition-transform flex items-center justify-center relative w-14 h-14 border border-slate-100">
                      {iconSrc ? (
                        <Image
                          src={iconSrc}
                          alt={type}
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <Zap className="h-6 w-6 text-blue-600 fill-current" />
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors uppercase">
                        {type}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <Award className="h-3.5 w-3.5 text-blue-500" />
                      Padrão de Qualidade
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
