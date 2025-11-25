'use client';

import { Button } from '@/components/ui/button';

type Styles = {
  variant?: 'solid' | 'outline';
  bg_color?: string;
  hover_bg_color?: string;
  text_color?: string;
  border_color?: string;
  icon_color?: string;
  rounded_px?: number;
};

interface Props {
  enabled?: boolean;
  href?: string;
  onClick?: () => void;
  styles?: Styles | null | undefined;
  size?: 'sm' | 'lg';
  className?: string;
  labelSuffix?: string;
  label?: string;
  preset?: 'neutralOutline' | 'brandSolid';
}

export default function WhatsappButton({
  enabled = true,
  href,
  onClick,
  styles,
  size = 'sm',
  className = '',
  labelSuffix,
  label,
  preset,
}: Props) {
  if (!enabled) return null;

  const s: Styles = styles || {};
  const variant: 'solid' | 'outline' = s.variant === 'outline' ? 'outline' : 'solid';
  const bg = s.bg_color || '#16a34a';
  const hoverBg = s.hover_bg_color || '#15803d';
  const text = s.text_color || (variant === 'solid' ? '#ffffff' : '#0f172a');
  const border = s.border_color || '#16a34a';
  const icon = s.icon_color || (variant === 'solid' ? '#ffffff' : '#16a34a');
  const rounded = typeof s.rounded_px === 'number' ? s.rounded_px : 12;

  const isBrandSolid = preset === 'brandSolid';
  const brandBg = '#25D366';
  const brandHover = '#1ebe5d';
  const brandText = '#ffffff';
  const brandBorder = '#25D366';
  const brandIcon = '#ffffff';
  const isNeutralOutline = !isBrandSolid && (preset === 'neutralOutline' || (variant === 'outline' && !styles));
  const baseStyle: React.CSSProperties = isNeutralOutline
    ? { borderRadius: `${rounded}px` }
    : {
        borderRadius: `${rounded}px`,
        color: isBrandSolid ? brandText : text,
        borderColor: isBrandSolid ? brandBorder : border,
        backgroundColor: variant === 'solid' ? (isBrandSolid ? brandBg : bg) : undefined,
      };

  const btnClasses = [
    className,
    variant === 'outline' ? 'border' : '',
    'transition-colors',
    'shadow-sm',
    'w-full',
  ].join(' ').trim();

  const WhatsappSvg = ({ sizePx }: { sizePx: number }) => (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mr-2"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.149-.671.15-.198.297-.769.967-.941 1.166-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.298-.496.099-.198.05-.372-.025-.521-.075-.149-.671-1.614-.919-2.213-.243-.583-.49-.503-.671-.512-.173-.009-.372-.009-.571-.009-.198 0-.521.074-.794.372-.273.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.1 3.202 5.077 4.487.709.306 1.262.489 1.693.625.712.226 1.36.194 1.872.118.571-.085 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.123-.272-.198-.57-.347z" fill={isNeutralOutline ? undefined : (isBrandSolid ? brandIcon : icon)} />
      <path d="M12.004 2C6.48 2 2 6.453 2 11.944c0 2.106.69 4.063 1.87 5.657L2 22l4.532-1.846c1.539.846 3.298 1.34 5.172 1.34 5.524 0 10.004-4.453 10.004-9.944C21.708 6.453 17.528 2 12.004 2zm0 17.708c-1.65 0-3.18-.446-4.47-1.223l-.32-.198-2.643 1.075.99-2.527-.22-.33c-1.04-1.513-1.585-3.28-1.585-5.061 0-5.087 4.198-9.225 9.29-9.225 5.083 0 9.281 4.138 9.281 9.225 0 5.087-4.198 9.264-9.333 9.264z" fill={isNeutralOutline ? undefined : (variant === 'solid' ? (isBrandSolid ? brandText : text) : icon)} />
    </svg>
  );

  const handleClick = () => {
    let link = (href || '').trim();
    if (link && !/^https?:\/\//i.test(link)) {
      const digitsRaw = link.replace(/\D/g, '');
      let digits = digitsRaw;
      if (digits && !digits.startsWith('55') && digits.length === 11) {
        digits = `55${digits}`;
      }
      link = digits ? `https://wa.me/${digits}` : '';
    }
    if (link) {
      try {
        const opened = window.open(link, '_blank');
        if (!opened) {
          window.location.href = link;
        }
      } catch (error) {
        console.error('Erro ao redirecionar para WhatsApp:', error);
        alert('Não foi possível abrir o WhatsApp. Por favor, verifique suas configurações de pop-up ou tente manualmente.');
      }
    }
    if (onClick) onClick();
  };

  return (
    <Button
      size={size}
      variant={variant === 'outline' ? 'outline' : undefined as any}
      className={`${btnClasses} ${isNeutralOutline ? 'border-border hover:bg-muted text-foreground' : ''}`}
      style={baseStyle}
      aria-label={label || 'Conversar no WhatsApp'}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        if (!isNeutralOutline && variant === 'solid') el.style.backgroundColor = isBrandSolid ? brandHover : hoverBg;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (!isNeutralOutline && variant === 'solid') el.style.backgroundColor = isBrandSolid ? brandBg : bg;
      }}
      onClick={handleClick}
      data-testid="whatsapp-button"
    >
      <WhatsappSvg sizePx={size === 'lg' ? 20 : 16} />
      {label ? label : (labelSuffix ? `WhatsApp ${labelSuffix}` : 'Conversar no WhatsApp')}
    </Button>
  );
}
