'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, RefreshCw, AlertCircle, Briefcase, Calendar } from 'lucide-react';
import { PortfolioProjectCard } from './PortfolioProjectCard';
import { PortfolioProjectAddDialog } from './PortfolioProjectAddDialog';
import { BrandAvatar } from '../brands/BrandAvatar';
import {
  fetchReviewerProjects,
  fetchReviewerProjectSummary,
  deleteReviewerProject,
  type ReviewerPortfolioProject,
  type ReviewerProjectSummary,
  type PortfolioProjectType,
} from '@/lib/api/reviewer-portfolio-projects';
import {
  fetchReviewerBrandUsages,
  type ReviewerBrandUsage,
} from '@/lib/api/reviewer-brand-usages';

const PROJECT_TYPE_FILTERS: { id: string; label: string; type?: PortfolioProjectType }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'residential', label: 'Residencial', type: 'residential' },
  { id: 'commercial', label: 'Comercial', type: 'commercial' },
  { id: 'rural', label: 'Rural / Agro', type: 'rural' },
  { id: 'industrial', label: 'Industrial', type: 'industrial' },
  { id: 'ev_charging', label: 'Eletromobilidade', type: 'ev_charging' },
  { id: 'bess_storage', label: 'Storage / BESS', type: 'bess_storage' },
];

function calculateYearsOfExperience(dateStr: string | null): number {
  if (!dateStr) return 0;
  try {
    const year = parseInt(dateStr.slice(0, 4), 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year > currentYear) return 0;
    return Math.max(0, currentYear - year);
  } catch {
    return 0;
  }
}

export function ExperienceWorkspace() {
  const [projects, setProjects] = useState<ReviewerPortfolioProject[]>([]);
  const [summary, setSummary] = useState<ReviewerProjectSummary | null>(null);
  const [userBrands, setUserBrands] = useState<ReviewerBrandUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros locais
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modais e ações
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projResp, summaryResp, brandsResp] = await Promise.all([
        fetchReviewerProjects({ limit: 100 }),
        fetchReviewerProjectSummary(),
        fetchReviewerBrandUsages({ status: 'active', limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setProjects(projResp.data);
      setSummary(summaryResp.data);
      setUserBrands(brandsResp.data || []);
    } catch (err: unknown) {
      setError('Não foi possível carregar os projetos de portfólio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteProject = async (project: ReviewerPortfolioProject) => {
    const confirmed = window.confirm(`Deseja realmente remover o projeto "${project.title}"?`);
    if (!confirmed) return;

    setDeletingProjectId(project.id);
    try {
      await deleteReviewerProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      fetchReviewerProjectSummary().then((res) => setSummary(res.data)).catch(() => {});
    } catch (err: unknown) {
      alert('Falha ao remover o projeto. Tente novamente.');
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleProjectCreated = (newProject: ReviewerPortfolioProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setIsAddModalOpen(false);
    fetchReviewerProjectSummary().then((res) => setSummary(res.data)).catch(() => {});
  };

  // Histórico de marcas dedup por brand.id
  const brandExperiences = useMemo(() => {
    const map = new Map<number, { brand: ReviewerBrandUsage['brand']; experienceSince: string | null; years: number }>();
    userBrands.forEach((u) => {
      if (!map.has(u.brand.id)) {
        map.set(u.brand.id, {
          brand: u.brand,
          experienceSince: u.experience_since,
          years: calculateYearsOfExperience(u.experience_since),
        });
      } else if (u.experience_since) {
        const existing = map.get(u.brand.id)!;
        if (!existing.experienceSince || u.experience_since < existing.experienceSince) {
          existing.experienceSince = u.experience_since;
          existing.years = calculateYearsOfExperience(u.experience_since);
        }
      }
    });
    return Array.from(map.values());
  }, [userBrands]);

  // Filtragem de projetos
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (selectedType !== 'all' && proj.project_type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = proj.title.toLowerCase().includes(query);
        const matchesCity = proj.city?.toLowerCase().includes(query) ?? false;
        const matchesBrand = proj.brands.some((b) => b.brand_name.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCity && !matchesBrand) return false;
      }
      return true;
    });
  }, [projects, selectedType, searchQuery]);

  return (
    <div className="space-y-6 text-[#161616]" data-testid="experience-workspace">
      {/* Modal de cadastro de projeto */}
      <PortfolioProjectAddDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleProjectCreated}
      />

      {/* Strip de Métricas Verificáveis do Portfólio */}
      <section
        aria-label="Indicadores consolidados de projetos"
        className="grid grid-cols-2 md:grid-cols-4 gap-2"
        data-testid="experience-metric-strip"
      >
        <div
          className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between"
          title="Total de projetos de instalação e engenharia registrados"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#17468D] flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
              Projetos declarados
            </span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight" data-testid="metric-total-projects">
            {loading ? '—' : (summary?.total_projects ?? 0)}
          </span>
        </div>

        <div
          className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between"
          title="Soma da potência de pico declarada nos projetos"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-blue-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
              Potência total (kWp)
            </span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight" data-testid="metric-total-capacity">
            {loading ? '—' : `${Number(summary?.total_capacity_kwp ?? 0).toFixed(1)} kWp`}
          </span>
        </div>

        <div
          className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between"
          title="Projetos com comprovação técnica ou laudo homologado"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-emerald-600 flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
              Verificados
            </span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight" data-testid="metric-verified-projects">
            {loading ? '—' : (summary?.verified_projects ?? 0)}
          </span>
        </div>

        <div
          className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between"
          title="Projetos exibidos publicamente no seu perfil de Creator"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-sm bg-sky-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
              Públicos no Creator
            </span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight" data-testid="metric-public-projects">
            {loading ? '—' : (summary?.public_projects ?? 0)}
          </span>
        </div>
      </section>

      {/* Histórico e Experiência com Marcas */}
      {brandExperiences.length > 0 && (
        <section
          aria-label="Histórico de experiência por fabricante"
          className="bg-white border border-slate-200 rounded p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Histórico por Fabricante</h2>
              <p className="text-xs text-slate-500">
                Tempo de atuação e fabricantes declarados em projetos e instalações
              </p>
            </div>
            <span className="text-xs font-semibold text-[#17468D] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              {brandExperiences.length} marcas ativas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {brandExperiences.map(({ brand, years, experienceSince }) => (
              <div
                key={brand.id}
                className="flex items-center gap-3 p-2.5 rounded border border-slate-100 bg-slate-50/50"
              >
                <BrandAvatar
                  name={brand.name}
                  logoUrl={brand.logo_url}
                  initials={brand.initials}
                  size={32}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{brand.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {years > 0
                      ? `${years} ${years === 1 ? 'ano' : 'anos'} de experiência`
                      : experienceSince
                        ? `Desde ${experienceSince}`
                        : 'Atuação recente'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toolbar: Filtros e Botão Cadastrar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, cidade ou marca..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#17468D]"
              data-testid="search-projects-input"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#17468D] hover:bg-[#0F2F64] rounded transition-colors shadow-sm"
          data-testid="add-project-button"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Projeto</span>
        </button>
      </div>

      {/* Filtros por Tipo de Projeto */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist">
        {PROJECT_TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={selectedType === f.id}
            onClick={() => setSelectedType(f.id)}
            className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap transition-colors ${
              selectedType === f.id
                ? 'bg-[#17468D] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Erro de Carregamento */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="font-semibold text-red-700 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado de Carregamento */}
      {loading && (
        <div className="text-center py-12 bg-white rounded border border-slate-200">
          <div className="w-6 h-6 border-2 border-[#17468D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Carregando projetos de portfólio...</p>
        </div>
      )}

      {/* Lista / Grid de Projetos */}
      {!loading && filteredProjects.length > 0 && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          data-testid="portfolio-projects-grid"
        >
          {filteredProjects.map((project) => (
            <PortfolioProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              isDeleting={deletingProjectId === project.id}
            />
          ))}
        </div>
      )}

      {/* Estado Vazio */}
      {!loading && filteredProjects.length === 0 && (
        <div
          className="text-center py-12 px-4 bg-white rounded border border-dashed border-slate-200"
          data-testid="empty-projects-state"
        >
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            {projects.length === 0
              ? 'Nenhum projeto cadastrado no portfólio'
              : 'Nenhum projeto encontrado com os filtros selecionados'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {projects.length === 0
              ? 'Cadastre suas instalações e projetos para comprovar sua experiência técnica com os fabricantes do setor.'
              : 'Tente alterar os termos de busca ou selecionar outro tipo de projeto.'}
          </p>
          {projects.length === 0 && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#17468D] hover:bg-[#0F2F64] rounded transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Projeto</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
