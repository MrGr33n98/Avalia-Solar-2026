'use client';

import React, {
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  ArrowRight,
  Headphones,
  Sparkles,
  Zap,
} from 'lucide-react';

import {
  useCategoriesTree,
} from '@/hooks/useCategoriesTree';

import { CategorySearch } from './CategorySearch';
import { CategoryMotionIcon } from './CategoryMotionIcon';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface CategoriesMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
}

/* -------------------------------------------------------------------------- */
/*                                MOTION CONFIG                               */
/* -------------------------------------------------------------------------- */

const MENU_TRANSITION = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as const,
};

const CONTENT_VARIANTS = {
  hidden: {
    opacity: 0,
  },

  show: {
    opacity: 1,

    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.035,
    },
  },
};

const CATEGORY_VARIANTS = {
  hidden: {
    opacity: 0,
    y: 6,
    scale: 0.995,
  },

  show: {
    opacity: 1,
    y: 0,
    scale: 1,

    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export const CategoriesMegaMenu: React.FC<
  CategoriesMegaMenuProps
> = ({
  isOpen,
  onClose,
  id,
}) => {
  const {
    categories,
    loading,
    error,
    filterCategories,
  } = useCategoriesTree();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  /* ------------------------------------------------------------------------ */
  /* FILTERING — LOGIC PRESERVED                                              */
  /* ------------------------------------------------------------------------ */

  const filteredTree = useMemo(() => {
    return filterCategories(
      categories,
      searchQuery,
    );
  }, [
    categories,
    searchQuery,
    filterCategories,
  ]);

  /* ------------------------------------------------------------------------ */
  /* CONTENT                                                                  */
  /* ------------------------------------------------------------------------ */

  const renderContent = () => {
    /* ---------------------------------------------------------------------- */
    /* LOADING                                                                */
    /* ---------------------------------------------------------------------- */

    if (loading) {
      return (
        <div
          className="
            grid
            grid-cols-1
            gap-3
            p-3
            sm:grid-cols-2
            lg:grid-cols-4
            lg:p-4
          "
        >
          {[...Array(4)].map(
            (_, i) => (
              <div
                key={i}
                className="
                  min-h-[290px]
                  animate-pulse
                  rounded-[20px]
                  border
                  border-slate-200/70
                  bg-white
                  p-4
                "
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-md bg-slate-200" />
                    <div className="h-3 w-1/2 rounded-md bg-slate-100" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[1, 2, 3, 4].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-8 rounded-lg bg-slate-50"
                      />
                    ),
                  )}
                </div>

                <div className="mt-5 h-px bg-slate-100" />

                <div className="mt-4 h-4 w-24 rounded-md bg-slate-100" />
              </div>
            ),
          )}
        </div>
      );
    }

    /* ---------------------------------------------------------------------- */
    /* ERROR                                                                  */
    /* ---------------------------------------------------------------------- */

    if (
      error &&
      categories.length === 0
    ) {
      return (
        <div className="p-4 sm:p-6">
          <div
            className="
              flex
              min-h-[340px]
              flex-col
              items-center
              justify-center
              rounded-[24px]
              border
              border-slate-200
              bg-gradient-to-b
              from-white
              to-slate-50/70
              px-6
              py-10
              text-center
              shadow-[0_8px_30px_rgba(15,23,42,0.035)]
            "
          >
            <div
              className="
                mb-5
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                border
                border-blue-100
                bg-blue-50
                text-blue-600
                shadow-sm
              "
            >
              <Zap
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              Menu em manutenção
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Estamos otimizando a árvore
              de categorias para você.
              Enquanto isso, explore nossa
              listagem completa.
            </p>

            <Link
              href="/categories"
              onClick={onClose}
              className="
                mt-6
                inline-flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-[0_8px_20px_rgba(37,99,235,0.2)]
                transition-all
                hover:-translate-y-0.5
                hover:bg-blue-700
                hover:shadow-[0_12px_26px_rgba(37,99,235,0.26)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-blue-500
                focus-visible:ring-offset-2
              "
            >
              Acessar todas as categorias

              <ArrowRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      );
    }

    /* ---------------------------------------------------------------------- */
    /* CATEGORY GRID                                                          */
    /* ---------------------------------------------------------------------- */

    return (
      <motion.div
        variants={
          CONTENT_VARIANTS
        }
        initial="hidden"
        animate="show"
        className="
          grid
          grid-cols-1
          gap-3
          p-3
          sm:grid-cols-2
          lg:grid-cols-4
          lg:p-4
        "
      >
        {filteredTree
          .slice(0, 4)
          .map(
            (category) => (
              <motion.div
                key={category.id}
                variants={
                  CATEGORY_VARIANTS
                }
                className="
                  group
                  flex
                  min-w-0
                  flex-col
                  rounded-[20px]
                  border
                  border-slate-200/80
                  bg-white
                  p-4
                  shadow-[0_1px_2px_rgba(15,23,42,0.02)]
                  transition-[transform,border-color,box-shadow,background-color]
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-blue-200
                  hover:bg-gradient-to-b
                  hover:from-white
                  hover:to-blue-50/20
                  hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]
                  sm:p-5
                "
              >
                {/* -------------------------------------------------------- */}
                {/* PARENT CATEGORY                                          */}
                {/* -------------------------------------------------------- */}

                <Link
                  href={`/categories/${category.slug}`}
                  onClick={onClose}
                  className="
                    group/parent
                    flex
                    min-w-0
                    items-center
                    gap-3
                    rounded-xl
                    outline-none
                    focus-visible:ring-2
                    focus-visible:ring-blue-500
                    focus-visible:ring-offset-2
                  "
                >
                  <span
                    className="
                      relative
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-xl
                      border
                      border-slate-200/70
                      bg-gradient-to-br
                      from-white
                      to-slate-50
                      shadow-[0_3px_10px_rgba(15,23,42,0.06)]
                      transition-all
                      duration-200
                      group-hover/parent:border-blue-100
                      group-hover/parent:bg-blue-50/30
                      group-hover/parent:shadow-[0_5px_14px_rgba(15,23,42,0.08)]
                    "
                  >
                    <div
                      className="
                        flex
                        h-full
                        w-full
                        items-center
                        justify-center
                        scale-[1.45]
                        transition-transform
                        duration-300
                        ease-out
                        group-hover/parent:scale-[1.55]
                      "
                    >
                      <CategoryMotionIcon
                        slug={
                          category.slug
                        }
                        name={
                          category.name
                        }
                        size="fill"
                        motionMode="interactive"
                      />
                    </div>
                  </span>

                  <div className="min-w-0 flex-1">
                    <span
                      className="
                        block
                        truncate
                        text-[14px]
                        font-bold
                        leading-tight
                        tracking-[-0.01em]
                        text-slate-950
                        transition-colors
                        duration-150
                        group-hover/parent:text-blue-700
                        sm:text-[15px]
                      "
                    >
                      {category.name}
                    </span>

                    <span className="mt-1 block text-[11px] font-medium text-slate-400">
                      {
                        category.companies_count
                      }{' '}
                      {category.companies_count ===
                      1
                        ? 'empresa'
                        : 'empresas'}
                    </span>
                  </div>
                </Link>

                {/* -------------------------------------------------------- */}
                {/* CHILDREN                                                 */}
                {/* -------------------------------------------------------- */}

                {category.children &&
                  category.children.length >
                    0 && (
                    <div className="mt-5 flex flex-1 flex-col">
                      <div className="flex flex-col gap-1">
                        {category.children
                          .slice(0, 4)
                          .map(
                            (
                              child,
                            ) => (
                              <Link
                                key={
                                  child.id
                                }
                                href={`/categories/${child.slug}`}
                                onClick={
                                  onClose
                                }
                                className="
                                  group/child
                                  flex
                                  min-h-[38px]
                                  items-center
                                  gap-2.5
                                  rounded-lg
                                  px-2
                                  py-2
                                  text-[12px]
                                  font-medium
                                  leading-5
                                  text-slate-600
                                  outline-none
                                  transition-all
                                  duration-150
                                  hover:bg-blue-50/60
                                  hover:text-blue-700
                                  focus-visible:bg-blue-50
                                  focus-visible:ring-2
                                  focus-visible:ring-blue-500
                                  sm:text-[12.5px]
                                "
                              >
                                <span
                                  className="
                                    flex
                                    h-5
                                    w-5
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-md
                                    text-slate-300
                                    transition-colors
                                    group-hover/child:text-blue-500
                                  "
                                >
                                  <ArrowRight
                                    className="
                                      h-3
                                      w-3
                                      transition-transform
                                      duration-200
                                      group-hover/child:translate-x-0.5
                                    "
                                    aria-hidden="true"
                                  />
                                </span>

                                <span className="truncate">
                                  {
                                    child.name
                                  }
                                </span>
                              </Link>
                            ),
                          )}
                      </div>

                      {/* -------------------------------------------------- */}
                      {/* VIEW ALL                                           */}
                      {/* -------------------------------------------------- */}

                      {category.children
                        .length > 4 && (
                        <div className="mt-auto pt-4">
                          <div className="mb-3 h-px bg-slate-100" />

                          <Link
                            href={`/categories/${category.slug}`}
                            onClick={
                              onClose
                            }
                            className="
                              group/all
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-lg
                              text-[11px]
                              font-bold
                              text-blue-700
                              outline-none
                              transition-colors
                              hover:text-blue-800
                              focus-visible:ring-2
                              focus-visible:ring-blue-500
                              focus-visible:ring-offset-2
                            "
                          >
                            Ver todas (
                            {
                              category
                                .children
                                .length
                            }
                            )

                            <ArrowRight
                              className="
                                h-3.5
                                w-3.5
                                transition-transform
                                duration-200
                                group-hover/all:translate-x-0.5
                              "
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
              </motion.div>
            ),
          )}
      </motion.div>
    );
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* BACKDROP                                                         */}
          {/* ---------------------------------------------------------------- */}

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.18,
            }}
            onClick={onClose}
            className="
              fixed
              inset-0
              z-40
              bg-slate-950/10
              backdrop-blur-[2px]
            "
          />

          {/* ---------------------------------------------------------------- */}
          {/* MENU                                                             */}
          {/* ---------------------------------------------------------------- */}

          <motion.div
            id={id}
            initial={{
              opacity: 0,
              y: 6,
              scale: 0.995,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 5,
              scale: 0.997,
            }}
            transition={
              MENU_TRANSITION
            }
            className="
              absolute
              left-0
              top-full
              z-50
              w-full
              px-2
              pt-2
              sm:px-3
              lg:px-4
            "
          >
            <div
              className="
                mx-auto
                flex
                max-h-[min(680px,calc(100vh-82px))]
                max-w-[1320px]
                flex-col
                overflow-hidden
                rounded-[22px]
                border
                border-slate-200/80
                bg-white
                shadow-[0_26px_70px_-18px_rgba(15,23,42,0.28)]
                sm:rounded-[24px]
              "
            >
              {/* ========================================================== */}
              {/* HEADER                                                     */}
              {/* ========================================================== */}

              <div
                className="
                  sticky
                  top-0
                  z-20
                  flex
                  flex-col
                  gap-3
                  border-b
                  border-slate-100
                  bg-white/95
                  px-4
                  py-4
                  backdrop-blur-xl
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:px-5
                  lg:px-6
                "
              >
                <div className="flex items-center gap-3">
                  <span
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-blue-100
                      bg-blue-50
                      text-blue-600
                    "
                  >
                    <Sparkles
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </span>

                  <div>
                    <p className="text-sm font-bold tracking-[-0.01em] text-slate-950">
                      Explorar categorias
                    </p>

                    <p className="hidden text-[11px] text-slate-500 sm:block">
                      Encontre rapidamente a
                      solução ideal.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:max-w-[390px]">
                  <CategorySearch
                    value={
                      searchQuery
                    }
                    onChange={
                      setSearchQuery
                    }
                  />
                </div>
              </div>

              {/* ========================================================== */}
              {/* BODY                                                       */}
              {/* ========================================================== */}

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div
                  className="
                    grid
                    min-h-0
                    lg:grid-cols-[230px_minmax(0,1fr)]
                  "
                >
                  {/* ------------------------------------------------------ */}
                  {/* ASIDE                                                  */}
                  {/* ------------------------------------------------------ */}

                  <aside
                    className="
                      border-b
                      border-slate-100
                      bg-slate-50/40
                      p-4
                      sm:p-5
                      lg:border-b-0
                      lg:border-r
                      lg:border-slate-100
                      lg:p-5
                    "
                  >
                    <div>
                      <h2 className="text-[17px] font-bold tracking-[-0.025em] text-slate-950">
                        Explorar categorias
                      </h2>

                      <p className="mt-2 text-[12.5px] leading-5 text-slate-500">
                        Encontre empresas
                        especializadas no que
                        você precisa.
                      </p>
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* ALL CATEGORIES                                       */}
                    {/* ---------------------------------------------------- */}

                    <Link
                      href="/categories"
                      onClick={onClose}
                      className="
                        group/allcategories
                        mt-5
                        flex
                        min-h-11
                        items-center
                        justify-between
                        gap-3
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        text-[12px]
                        font-bold
                        text-slate-800
                        shadow-sm
                        outline-none
                        transition-all
                        hover:border-blue-200
                        hover:bg-blue-50/60
                        hover:text-blue-700
                        focus-visible:ring-2
                        focus-visible:ring-blue-500
                      "
                    >
                      Ver todas as categorias

                      <ArrowRight
                        className="
                          h-4
                          w-4
                          shrink-0
                          transition-transform
                          group-hover/allcategories:translate-x-0.5
                        "
                        aria-hidden="true"
                      />
                    </Link>

                    {/* ---------------------------------------------------- */}
                    {/* HELP CARD                                            */}
                    {/* ---------------------------------------------------- */}

                    <div
                      className="
                        relative
                        mt-5
                        overflow-hidden
                        rounded-[18px]
                        border
                        border-blue-100
                        bg-gradient-to-br
                        from-blue-50/80
                        via-white
                        to-white
                        p-4
                        shadow-[0_4px_16px_rgba(15,23,42,0.035)]
                      "
                    >
                      <div
                        aria-hidden="true"
                        className="
                          pointer-events-none
                          absolute
                          -right-12
                          -top-12
                          h-32
                          w-32
                          rounded-full
                          bg-blue-100/50
                          blur-2xl
                        "
                      />

                      <div
                        className="
                          relative
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-blue-100
                          bg-white
                          text-blue-600
                          shadow-sm
                        "
                      >
                        <Headphones
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </div>

                      <p className="relative mt-3 text-[13px] font-bold text-slate-950">
                        Precisa de ajuda?
                      </p>

                      <p className="relative mt-1 text-[11.5px] leading-5 text-slate-500">
                        Peça orientações e
                        compare propostas
                        verificadas.
                      </p>

                      <Link
                        href="/compare"
                        onClick={
                          onClose
                        }
                        className="
                          group/help
                          relative
                          mt-3
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-lg
                          text-[11px]
                          font-bold
                          text-blue-700
                          outline-none
                          transition-colors
                          hover:text-blue-800
                          focus-visible:ring-2
                          focus-visible:ring-blue-500
                        "
                      >
                        Comparar gratuitamente

                        <ArrowRight
                          className="
                            h-3.5
                            w-3.5
                            transition-transform
                            group-hover/help:translate-x-0.5
                          "
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </aside>

                  {/* ------------------------------------------------------ */}
                  {/* CATEGORY CONTENT                                       */}
                  {/* ------------------------------------------------------ */}

                  <div className="min-w-0 bg-white">
                    {renderContent()}
                  </div>
                </div>
              </div>

              {/* ========================================================== */}
              {/* FOOTER                                                     */}
              {/* ========================================================== */}

              {categories.length >
                0 && (
                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    border-t
                    border-slate-100
                    bg-slate-50/70
                    px-4
                    py-3
                    sm:px-5
                    md:flex-row
                    md:items-center
                    md:justify-between
                    lg:px-6
                  "
                >
                  <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                    <span className="hidden shrink-0 text-[11px] font-semibold text-slate-500 sm:inline">
                      Populares agora:
                    </span>

                    <div
                      className="
                        flex
                        min-w-0
                        gap-2
                        overflow-x-auto
                        pb-1
                        scrollbar-none
                        sm:pb-0
                      "
                    >
                      {categories
                        .slice(0, 3)
                        .map(
                          (
                            cat,
                          ) => (
                            <Link
                              key={
                                cat.id
                              }
                              href={`/categories/${cat.slug}`}
                              onClick={
                                onClose
                              }
                              className="
                                shrink-0
                                rounded-full
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-1.5
                                text-[10.5px]
                                font-medium
                                text-slate-600
                                shadow-[0_1px_2px_rgba(15,23,42,0.02)]
                                outline-none
                                transition-all
                                hover:border-blue-200
                                hover:text-blue-700
                                hover:shadow-sm
                                focus-visible:ring-2
                                focus-visible:ring-blue-500
                              "
                            >
                              {
                                cat.name
                              }
                            </Link>
                          ),
                        )}
                    </div>
                  </div>

                  <Link
                    href="/categories"
                    onClick={
                      onClose
                    }
                    className="
                      group/more
                      inline-flex
                      shrink-0
                      items-center
                      gap-2
                      self-end
                      rounded-lg
                      text-[10.5px]
                      font-semibold
                      text-slate-500
                      outline-none
                      transition-colors
                      hover:text-blue-700
                      focus-visible:ring-2
                      focus-visible:ring-blue-500
                      md:self-auto
                    "
                  >
                    Mais de{' '}
                    {
                      categories.length
                    }{' '}
                    categorias

                    <ArrowRight
                      className="
                        h-3.5
                        w-3.5
                        transition-transform
                        group-hover/more:translate-x-0.5
                      "
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};