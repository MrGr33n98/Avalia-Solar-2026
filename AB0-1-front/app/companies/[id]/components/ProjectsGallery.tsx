'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Building2, ChevronDown, ImageIcon, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchApi } from '@/lib/api';

type ProjectAsset = {
  id: number;
  kind: 'image' | 'video' | 'document';
  title?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  external_url?: string | null;
  file_url?: string | null;
  provider?: string | null;
};

type Project = {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  project_type?: string | null;
  segment?: string | null;
  technology?: string | null;
  city?: string | null;
  state?: string | null;
  capacity_value?: number | null;
  capacity_unit?: string | null;
  assets: ProjectAsset[];
};

const SelectFilter = ({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) => (
  <label className="relative inline-flex">
    <span className="sr-only">Filtrar por {label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
      <option value="">{label}</option>
      {values.map((item) => <option value={item} key={item}>{item}</option>)}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" />
  </label>
);

export default function ProjectsGallery({ companyId, companyName }: { companyId: number | string; companyName: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<'all' | 'image' | 'video'>('all');
  const [projectType, setProjectType] = useState('');
  const [segment, setSegment] = useState('');
  const [technology, setTechnology] = useState('');
  const [selected, setSelected] = useState<Project | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const initialMedia = query.get('project_media');
    setMedia(initialMedia === 'image' || initialMedia === 'video' ? initialMedia : 'all');
    setProjectType(query.get('project_type') || '');
    setSegment(query.get('project_segment') || '');
    setTechnology(query.get('project_technology') || '');
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    fetchApi<{ projects: Project[] }>(`/companies/${companyId}/projects`)
      .then((response) => active && setProjects(response.projects || []))
      .catch(() => active && setProjects([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [companyId]);

  useEffect(() => {
    if (!filtersReady) return;

    const query = new URLSearchParams(window.location.search);
    if (media === 'all') query.delete('project_media'); else query.set('project_media', media);
    if (projectType) query.set('project_type', projectType); else query.delete('project_type');
    if (segment) query.set('project_segment', segment); else query.delete('project_segment');
    if (technology) query.set('project_technology', technology); else query.delete('project_technology');
    const search = query.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [filtersReady, media, projectType, segment, technology]);

  const options = useMemo(() => ({
    types: Array.from(new Set(projects.map((project) => project.project_type).filter(Boolean) as string[])),
    segments: Array.from(new Set(projects.map((project) => project.segment).filter(Boolean) as string[])),
    technologies: Array.from(new Set(projects.map((project) => project.technology).filter(Boolean) as string[])),
  }), [projects]);

  const filtered = useMemo(() => projects.filter((project) => {
    const hasMedia = media === 'all' || project.assets.some((asset) => asset.kind === media);
    return hasMedia && (!projectType || project.project_type === projectType) && (!segment || project.segment === segment) && (!technology || project.technology === technology);
  }), [projects, media, projectType, segment, technology]);

  const counts = useMemo(() => ({
    all: projects.length,
    image: projects.filter((project) => project.assets.some((asset) => asset.kind === 'image')).length,
    video: projects.filter((project) => project.assets.some((asset) => asset.kind === 'video')).length,
  }), [projects]);

  if (loading) return <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{[1, 2, 3].map((key) => <div key={key} className="h-72 animate-pulse rounded-xl bg-slate-200" />)}</div>;
  if (!projects.length) return <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center"><Building2 className="mx-auto mb-3 h-9 w-9 text-slate-300" /><p className="font-semibold text-slate-700">Esta empresa ainda não publicou projetos.</p></div>;

  return <section aria-label={`Projetos da ${companyName}`} className="space-y-5">
    <div><h2 className="text-2xl font-black tracking-tight text-slate-950">Projetos</h2><p className="mt-1 text-sm text-slate-500">Fotos e vídeos dos projetos realizados pela {companyName}.</p></div>
    <div className="flex flex-wrap gap-2">
      {([['all', 'Todos'], ['image', 'Fotos'], ['video', 'Vídeos']] as const).map(([key, label]) => <Button key={key} type="button" variant={media === key ? 'default' : 'outline'} onClick={() => setMedia(key)} className="h-9 rounded-lg text-xs">{label} ({counts[key]})</Button>)}
      <span className="mx-1 hidden h-9 border-l border-slate-200 md:block" />
      <SelectFilter label="Tipo de projeto" value={projectType} values={options.types} onChange={setProjectType} />
      <SelectFilter label="Segmento" value={segment} values={options.segments} onChange={setSegment} />
      <SelectFilter label="Tecnologia" value={technology} values={options.technologies} onChange={setTechnology} />
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((project) => {
        const cover = project.assets.find((asset) => asset.kind === 'image') || project.assets[0];
        const isVideo = cover?.kind === 'video';
        const imageSrc = cover?.file_url || cover?.external_url;
        return <button type="button" key={project.id} onClick={() => setSelected(project)} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div className="relative aspect-[16/10] bg-slate-100">
            {imageSrc && !isVideo ? <Image src={imageSrc} alt={cover?.alt_text || project.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-700 to-slate-800"><ImageIcon className="h-10 w-10 text-white/70" /></div>}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded bg-slate-950/75 px-2 py-1 text-[11px] font-semibold text-white">{isVideo ? <Play className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{isVideo ? 'Vídeo' : 'Foto'}</span>
            {isVideo && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90"><Play className="ml-0.5 h-5 w-5 fill-slate-900 text-slate-900" /></span></span>}
          </div>
          <div className="space-y-1.5 p-4"><h3 className="font-bold text-slate-900">{project.title}</h3><p className="text-sm text-slate-500">{[project.city, project.state].filter(Boolean).join(' - ') || 'Brasil'}</p><div className="flex items-center justify-between gap-2"><span className="rounded bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">{project.segment || project.project_type || 'Projeto'}</span>{project.capacity_value && <span className="text-xs font-medium text-slate-500">{project.capacity_value} {project.capacity_unit}</span>}</div></div>
        </button>;
      })}
    </div>
    {!filtered.length && <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">Nenhum projeto encontrado para estes filtros.</p>}
    <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{selected?.title}</DialogTitle></DialogHeader>{selected && <div className="space-y-4"><p className="text-sm text-slate-600">{selected.summary}</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{selected.assets.map((asset) => <div key={asset.id} className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">{asset.kind === 'image' && (asset.file_url || asset.external_url) ? <Image src={asset.file_url || asset.external_url || ''} alt={asset.alt_text || selected.title} fill className="object-cover" unoptimized /> : asset.kind === 'video' ? <VideoEmbed url={asset.external_url} title={asset.title || selected.title} /> : <div className="flex h-full items-center justify-center"><Play className="h-6 w-6 text-slate-400" /></div>}</div>)}</div></div>}</DialogContent></Dialog>
  </section>;
}

function VideoEmbed({ url, title }: { url?: string | null; title: string }) {
  const embedUrl = toVideoEmbedUrl(url);
  if (!embedUrl) return <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center"><Play className="h-6 w-6 text-slate-400" /><span className="text-xs text-slate-500">Vídeo indisponível</span></div>;

  return <iframe src={embedUrl} title={title} className="h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />;
}

function toVideoEmbedUrl(rawUrl?: string | null) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return url.pathname.length > 1 ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.pathname.slice(1))}` : null;
    if (host === 'youtube.com') {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { return null; }
  return null;
}
