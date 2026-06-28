"use client";

import Image from "next/image";
import { MessageSquare, Star, ArrowRight, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company, Review } from "@/lib/api";
import { RatingStars } from "@/components/RatingStars";
import { getFullImageUrl } from "@/utils/image";

interface ReviewsPreviewProps {
  company: Company;
  reviews: Review[];
  reviewsLoading: boolean;
  onTabChange: (tabId: string) => void;
}

export default function ReviewsPreview({
  company,
  reviews = [],
  reviewsLoading = false,
  onTabChange,
}: ReviewsPreviewProps) {
  const averageRating = Number(
    (company as any).average_rating ?? (company as any).rating_avg ?? (company as any).rating ?? 0
  );
  const ratingCount = Number(
    (company as any).rating_count ?? (company as any).total_reviews ?? (company as any).reviews_count ?? 0
  );

  const recentReviews = reviews
    .filter((review) => {
      const content = String((review as any)?.comment ?? (review as any)?.body ?? "").trim();
      return content.length > 0;
    })
    .slice(0, 2);

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm overflow-hidden relative">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho de Avaliações */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950">Avaliações</h3>
              <p className="text-xs text-slate-500">Depoimentos reais de integradores e clientes.</p>
            </div>
          </div>
          {ratingCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTabChange("reviews")}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 rounded-xl hover:bg-slate-50 inline-flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Resumo de Reputação Geral */}
        {ratingCount > 0 && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center shrink-0 w-16 h-16">
                <span className="text-2xl font-black text-slate-950 leading-none">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Nota</span>
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">Excelente Reputação Geral</p>
                <div className="mt-1 flex items-center gap-2">
                  <RatingStars
                    rating={averageRating}
                    showCount={false}
                    starClassName="h-3.5 w-3.5 text-amber-500"
                  />
                  <span className="text-xs text-slate-500 font-semibold">
                    ({ratingCount} {ratingCount === 1 ? "opinião" : "opiniões"})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Depoimentos Recentes */}
        {reviewsLoading ? (
          <div className="py-6 text-center text-sm text-slate-500">Carregando depoimentos...</div>
        ) : recentReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentReviews.map((review) => {
              const authorName = (review as any)?.user?.name || "Usuário";
              const avatarRaw = (review as any)?.user?.avatar_url;
              const avatarUrl = avatarRaw ? getFullImageUrl(avatarRaw) : null;
              const content = String((review as any)?.comment ?? (review as any)?.body ?? "").trim();
              const initials = authorName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((token: string) => token.charAt(0).toUpperCase())
                .join("");

              return (
                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={`Avatar de ${authorName}`}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-600 bg-slate-100">
                              {initials || "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-tight">{authorName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Cliente Verificado</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-[10px] font-bold leading-none">{Number(review.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 italic">
                      "{content}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio Premium */
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/30">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-bounce" />
            <h4 className="font-bold text-slate-900 text-sm">Seja o primeiro a avaliar!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              Sua opinião ajuda milhares de consumidores a escolherem o integrador ideal para a instalação de energia solar.
            </p>
            <Button
              size="sm"
              onClick={() => onTabChange("reviews")}
              className="rounded-xl bg-blue-700 hover:bg-blue-800 text-xs font-bold text-white shadow-md inline-flex items-center gap-1.5"
            >
              Fazer uma avaliação
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
