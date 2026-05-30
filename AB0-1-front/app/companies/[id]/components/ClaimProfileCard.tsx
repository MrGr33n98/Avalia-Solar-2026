"use client";

import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Company } from "@/lib/api";

interface ClaimProfileCardProps {
  company: Company;
}

export default function ClaimProfileCard({ company }: ClaimProfileCardProps) {
  // Lógica dinâmica para saber se a empresa já está reivindicada ou verificada
  const isClaimed = (company as any).claimed === true || company.verified === true || company.has_paid_plan === true;

  if (isClaimed) {
    // Se a empresa já está reivindicada, exibe bloco institucional que reforça a confiança
    return (
      <Card className="overflow-hidden border border-emerald-100 bg-emerald-50/20 shadow-sm rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <h4 className="font-black text-sm uppercase tracking-wider leading-tight">
              Perfil Verificado Oficial
            </h4>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed">
            As informações desta empresa foram autenticadas e são gerenciadas ativamente pelo representante legal sob auditoria do portal **Avalia Solar**.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Se NÃO está reivindicada, exibe o convite para reivindicar o perfil
  return (
    <Card className="overflow-hidden border border-blue-100 bg-blue-50/40 shadow-sm rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-blue-700">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <h4 className="font-black text-sm uppercase tracking-wider leading-tight">
            Trabalha nesta empresa?
          </h4>
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed">
          Reivindique o controle deste perfil comercial para atualizar dados de contato, responder a avaliações de clientes e gerenciar o catálogo de produtos de forma gratuita.
        </p>

        <Button asChild className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-xs font-bold text-white shadow-md h-9 group" variant="default">
          <Link href={`/companies/${company.id}/claim`}>
            Reivindicar Perfil Grátis
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
