import React, { createRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import CRMRichTextEditor, { CRMRichTextEditorRef } from './CRMRichTextEditor';

describe('CRMRichTextEditor Component', () => {
  it('renderiza o editor com o placeholder configurado', () => {
    const handleChangeHtml = jest.fn();
    render(
      <CRMRichTextEditor
        valueHtml=""
        onChangeHtml={handleChangeHtml}
        placeholder="Escreva a mensagem do e-mail..."
      />
    );

    const editable = document.querySelector('[contenteditable="true"]');
    expect(editable).toBeInTheDocument();
    expect(editable).toHaveAttribute('data-placeholder', 'Escreva a mensagem do e-mail...');
  });

  it('permite atualizar o conteúdo imperativamente via setHtml no ref', () => {
    const ref = createRef<CRMRichTextEditorRef>();
    const handleChangeHtml = jest.fn();
    const handleChangeText = jest.fn();

    render(
      <CRMRichTextEditor
        ref={ref}
        valueHtml=""
        onChangeHtml={handleChangeHtml}
        onChangeText={handleChangeText}
      />
    );

    expect(ref.current).not.toBeNull();
    const htmlToSet = '<p>Olá <strong>Felipe</strong>, segue a proposta.</p>';
    act(() => {
      ref.current?.setHtml(htmlToSet);
    });

    const editable = document.querySelector('[contenteditable="true"]');
    expect(editable?.innerHTML).toBe(htmlToSet);
    expect(handleChangeHtml).toHaveBeenCalledWith(htmlToSet);
  });

  it('limpa o conteúdo do editor ao chamar clear no ref', () => {
    const ref = createRef<CRMRichTextEditorRef>();
    const handleChangeHtml = jest.fn();

    render(
      <CRMRichTextEditor
        ref={ref}
        valueHtml="<p>Texto inicial</p>"
        onChangeHtml={handleChangeHtml}
      />
    );

    act(() => {
      ref.current?.clear();
    });

    const editable = document.querySelector('[contenteditable="true"]');
    expect(editable?.innerHTML).toBe('');
    expect(handleChangeHtml).toHaveBeenCalledWith('');
  });
});
