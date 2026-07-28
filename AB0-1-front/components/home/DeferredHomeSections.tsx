'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ComponentType } from 'react';

const DecisionTransparency = dynamic(() => import('@/components/landing/DecisionTransparency'), {
  ssr: false,
});
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'), { ssr: false });
const SavingsCalculator = dynamic(() => import('@/components/landing/SavingsCalculator'), {
  ssr: false,
});

function DeferredSection({
  Component,
  minHeight,
  label,
}: {
  Component: ComponentType;
  minHeight: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} aria-busy={!visible} aria-label={visible ? undefined : `Carregando ${label}`}>
      {visible ? <Component /> : <div className="bg-slate-50/40" style={{ minHeight }} />}
    </div>
  );
}

/** Sections below the hero are interactive and intentionally load on approach. */
export default function DeferredHomeSections() {
  return (
    <>
      <DeferredSection Component={DecisionTransparency} minHeight="560px" label="conteúdo da página" />
      <DeferredSection Component={HowItWorks} minHeight="520px" label="como funciona" />
      <DeferredSection Component={SavingsCalculator} minHeight="520px" label="diagnóstico solar" />
    </>
  );
}
