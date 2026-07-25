'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-center"
      offset={88}
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            'group toast group-[.toaster]:!bg-white group-[.toaster]:!text-slate-900 group-[.toaster]:!border-slate-200 group-[.toaster]:!shadow-[0_18px_40px_-12px_rgba(15,23,42,0.25),0_4px_10px_-4px_rgba(15,23,42,0.1)] group-[.toaster]:!rounded-2xl !max-w-[calc(100vw-2rem)] !w-full mx-auto group-[.toaster]:!overflow-visible',
          description: 'group-[.toast]:!text-slate-600 !text-sm',
          title: 'group-[.toast]:!font-semibold !text-[14px]',
          actionButton:
            'group-[.toast]:!bg-blue-600 group-[.toast]:!text-white group-[.toast]:!rounded-xl group-[.toast]:!font-semibold group-[.toast]:!text-xs group-[.toast]:!px-4 group-[.toast]:!h-11 group-[.toast]:!min-h-[44px] group-[.toast]:!shadow-md group-[.toast]:!border group-[.toast]:!border-blue-700/20 group-[.toast]:hover:!bg-blue-700 !transition-all',
          cancelButton:
            'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700 group-[.toast]:rounded-xl group-[.toast]:!h-11',
          closeButton:
            '!rounded-full !bg-slate-100 !text-slate-500 hover:!bg-slate-200 !h-7 !w-7 !border !border-slate-200 !shadow-sm',
        },
      }}
      style={{
        bottom: 'calc(5rem + var(--sab, env(safe-area-inset-bottom)))',
        maxWidth: '440px',
        zIndex: 9995,
      }}
      {...props}
    />
  );
};

export { Toaster };
