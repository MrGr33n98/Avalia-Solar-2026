import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UtmLinkBuilder from '../../app/dashboard/components/tracking/UtmLinkBuilder';

describe('UtmLinkBuilder', () => {
  it('gera link de entrada público apontando para www.avaliasolar.com.br com parâmetros normalizados', async () => {
    render(<UtmLinkBuilder companyId="42" company={{ id: 42, slug: 'solar-plus', name: 'Solar Plus' }} />);

    fireEvent.change(screen.getByLabelText('utm_campaign'), { target: { value: 'Verão 2026' } });
    fireEvent.change(screen.getByLabelText('utm_content'), { target: { value: 'Hero principal' } });

    await waitFor(() => {
      const input = screen.getByLabelText('Link público gerado') as HTMLInputElement;
      expect(input.value).toContain('https://www.avaliasolar.com.br/companies/solar-plus');
      const url = new URL(input.value);
      expect(url.hostname).toBe('www.avaliasolar.com.br');
      expect(url.pathname).toBe('/companies/solar-plus');
      expect(url.searchParams.get('utm_campaign')).toBe('verão_2026');
      expect(url.searchParams.get('utm_content')).toBe('hero_principal');
    });
  });

  it('permite selecionar destino personalizado ou solicitar orçamento', async () => {
    render(<UtmLinkBuilder companyId="42" company={{ id: 42, slug: 'solar-plus', name: 'Solar Plus' }} />);

    fireEvent.change(screen.getByLabelText('Destino da campanha'), {
      target: { value: 'quote_request' },
    });

    await waitFor(() => {
      const input = screen.getByLabelText('Link público gerado') as HTMLInputElement;
      expect(input.value).toContain('https://www.avaliasolar.com.br/companies/solar-plus/quote');
    });

    fireEvent.change(screen.getByLabelText('Destino da campanha'), {
      target: { value: 'custom' },
    });
    fireEvent.change(screen.getByLabelText('Caminho personalizado'), {
      target: { value: '/categories/inversores-solares' },
    });

    await waitFor(() => {
      const input = screen.getByLabelText('Link público gerado') as HTMLInputElement;
      expect(input.value).toContain('https://www.avaliasolar.com.br/categories/inversores-solares');
    });
  });

  it('bloqueia destino personalizado javascript no preview e nas ações', () => {
    render(<UtmLinkBuilder companyId="42" />);
    fireEvent.change(screen.getByLabelText('Destino da campanha'), {
      target: { value: 'custom' },
    });
    fireEvent.change(screen.getByLabelText('Caminho personalizado'), {
      target: { value: 'javascript:alert(1)' },
    });

    expect(screen.getByLabelText('Link público gerado')).toHaveValue('');
    expect(screen.getByRole('alert')).toHaveTextContent('URL http(s)');
    expect(screen.getByRole('button', { name: 'Abrir' })).toBeDisabled();
  });

  it('aplica preset sem persistir dados da campanha', () => {
    render(<UtmLinkBuilder companyId="42" />);
    fireEvent.click(screen.getByRole('button', { name: 'Instagram' }));

    expect(screen.getByLabelText('utm_source')).toHaveValue('instagram');
    expect(screen.getByLabelText('utm_medium')).toHaveValue('social');
  });
});
