/**
 * Testes unitários para o modal de confirmação de lead
 */

import { JSDOM } from 'jsdom';

// Importa funções do arquivo de formulário por meio de require dinâmico
// para acessar showLeadConfirmationModal e ensureLeadModalStyles se exportadas.
// Aqui, vamos simular chamando a função via (globalThis as any) se necessário.

describe('Lead Confirmation Modal', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { url: 'http://localhost/' });
    (global as any).window = dom.window as any;
    (global as any).document = dom.window.document as any;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function callShow() {
    // Carrega o módulo do formulário para registrar as funções no escopo
    require('../components/QuoteForm.tsx');
    // Executa a função injetada no arquivo
    const fn = (global as any).showLeadConfirmationModal || (global as any).window.showLeadConfirmationModal;
    if (typeof fn === 'function') fn();
  }

  test('injeta overlay e conteúdo no DOM', () => {
    callShow();
    const overlay = document.querySelector('.lead-modal-overlay');
    const content = document.querySelector('.lead-modal-content');
    expect(overlay).toBeTruthy();
    expect(content).toBeTruthy();
  });

  test('contém texto exato e ícone SVG', () => {
    callShow();
    const text = document.querySelector('.lead-modal-text') as HTMLElement;
    const icon = document.querySelector('.lead-modal-icon');
    expect(text?.textContent).toBe('Obrigado! Passaremos seus contatos para as melhores empresas verificadas.');
    expect(icon?.nodeName).toBe('svg'.toUpperCase());
  });

  test('remove após ~5s com fade-out', () => {
    callShow();
    const content = document.querySelector('.lead-modal-content') as HTMLElement;
    expect(content).toBeTruthy();
    // Avança 5s
    jest.advanceTimersByTime(5000);
    // Deve ter aplicado fade-out
    expect(content.classList.contains('fade-out')).toBe(true);
    // Avança transição
    jest.advanceTimersByTime(400);
    const overlay = document.querySelector('.lead-modal-overlay');
    expect(overlay).toBeNull();
  });
});

