'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  Paperclip,
  Unlink,
  Check,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface CRMRichTextEditorRef {
  insertHtml: (html: string) => void;
  insertText: (text: string) => void;
  getHtml: () => string;
  getText: () => string;
  focus: () => void;
  clear: () => void;
}

interface CRMRichTextEditorProps {
  valueHtml?: string;
  onChangeHtml: (html: string) => void;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onAttachFile?: () => void;
  onAttachImage?: () => void;
  attachmentsCount?: number;
  extraToolbarRight?: React.ReactNode;
}

const CRMRichTextEditor = forwardRef<CRMRichTextEditorRef, CRMRichTextEditorProps>(
  (
    {
      valueHtml = '',
      onChangeHtml,
      onChangeText,
      placeholder = 'Escreva a mensagem do e-mail...',
      className,
      minHeight = '360px',
      onAttachFile,
      onAttachImage,
      attachmentsCount = 0,
      extraToolbarRight,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [savedRange, setSavedRange] = useState<Range | null>(null);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkText, setLinkText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [isInternalUpdate, setIsInternalUpdate] = useState(false);

    // Salva a seleção do cursor/texto atual
    const saveSelection = useCallback(() => {
      if (typeof window === 'undefined') return;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        // Verifica se a seleção está contida no editor
        if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
          setSavedRange(range.cloneRange());
          return range;
        }
      }
      return null;
    }, []);

    // Restaura a seleção salva
    const restoreSelection = useCallback((rangeToRestore?: Range | null) => {
      const range = rangeToRestore || savedRange;
      if (!range || typeof window === 'undefined') return;
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, [savedRange]);

    // Dispara atualizações para o pai
    const handleInput = useCallback(() => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      setIsInternalUpdate(true);
      onChangeHtml(html);
      onChangeText?.(text);
      setTimeout(() => setIsInternalUpdate(false), 50);
    }, [onChangeHtml, onChangeText]);

    // Sincroniza valor externo apenas se não for update interno
    useEffect(() => {
      if (!editorRef.current || isInternalUpdate) return;
      if (editorRef.current.innerHTML !== valueHtml) {
        editorRef.current.innerHTML = valueHtml || '';
      }
    }, [valueHtml, isInternalUpdate]);

    // Métodos imperativos para o componente pai
    useImperativeHandle(
      ref,
      () => ({
        insertHtml: (html: string) => {
          if (!editorRef.current) return;
          editorRef.current.focus();
          document.execCommand('insertHTML', false, html);
          handleInput();
        },
        insertText: (text: string) => {
          if (!editorRef.current) return;
          editorRef.current.focus();
          document.execCommand('insertText', false, text);
          handleInput();
        },
        getHtml: () => editorRef.current?.innerHTML || '',
        getText: () => editorRef.current?.innerText || '',
        focus: () => editorRef.current?.focus(),
        clear: () => {
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
            handleInput();
          }
        },
      }),
      [handleInput]
    );

    // Comandos de Formatação
    const execCmd = (command: string, value: string | undefined = undefined) => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleInput();
    };

    // Abre modal de Link
    const handleOpenLinkModal = () => {
      const range = saveSelection();
      let selectedText = '';
      let existingHref = '';

      if (range) {
        selectedText = range.toString().trim();
        // Verifica se já está dentro de um link
        let node: Node | null = range.commonAncestorContainer;
        while (node && node !== editorRef.current) {
          if (node.nodeName === 'A') {
            existingHref = (node as HTMLAnchorElement).href || '';
            if (!selectedText) selectedText = (node as HTMLElement).innerText;
            break;
          }
          node = node.parentNode;
        }
      }

      setLinkText(selectedText);
      setLinkUrl(existingHref || 'https://');
      setLinkModalOpen(true);
    };

    // Confirma e insere o link na palavra selecionada
    const handleApplyLink = () => {
      if (!linkUrl.trim()) return;

      let validUrl = linkUrl.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://') && !validUrl.startsWith('mailto:')) {
        validUrl = `https://${validUrl}`;
      }

      restoreSelection();

      if (savedRange && !savedRange.collapsed && (!linkText || linkText === savedRange.toString())) {
        // Se há seleção ativa com o mesmo texto, usa execCommand direto
        document.execCommand('createLink', false, validUrl);
      } else {
        // Se o texto foi modificado ou não havia seleção, insere nó HTML com estilo inline e target _blank
        const display = linkText.trim() || validUrl;
        const linkHtml = `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" style="color:#0e5ac9;text-decoration:underline;font-weight:500;">${display}</a>`;
        document.execCommand('insertHTML', false, linkHtml);
      }

      setLinkModalOpen(false);
      handleInput();
    };

    // Remove link
    const handleRemoveLink = () => {
      restoreSelection();
      document.execCommand('unlink', false);
      setLinkModalOpen(false);
      handleInput();
    };

    // Atalhos de teclado (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          execCmd('bold');
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          execCmd('italic');
        } else if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          execCmd('underline');
        } else if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          handleOpenLinkModal();
        }
      }
    };

    return (
      <div className={cn('flex flex-col flex-1 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs transition-all focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100', className)}>
        {/* ÁREA DE ESCRITA WYSIWYG (ContentEditable Amplo) */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={saveSelection}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onKeyDown={handleKeyDown}
          style={{ minHeight }}
          data-placeholder={placeholder}
          className="flex-1 w-full p-4 sm:p-5 text-sm text-slate-900 leading-relaxed outline-none overflow-y-auto whitespace-pre-wrap select-text font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none focus:outline-none"
        />

        {/* BARRA DE FERRAMENTAS INFERIOR (Padrão Nutshell / Gmail Benchmark) */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-3 py-2 shrink-0 select-none">
          <div className="flex items-center gap-0.5 text-slate-600">
            {/* Bold */}
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 hover:text-slate-900 text-slate-700 font-bold transition-colors"
              title="Negrito (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 hover:text-slate-900 text-slate-700 transition-colors"
              title="Itálico (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 hover:text-slate-900 text-slate-700 transition-colors"
              title="Sublinhado (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-slate-200 mx-1" />

            {/* Bullet List */}
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 hover:text-slate-900 text-slate-700 transition-colors"
              title="Lista de itens"
            >
              <List className="w-4 h-4" />
            </button>

            {/* Link Popover Trigger */}
            <button
              type="button"
              onClick={handleOpenLinkModal}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 hover:text-sky-600 text-slate-700 transition-colors"
              title="Inserir link na palavra selecionada (Ctrl+K)"
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            {/* Inserir Imagem */}
            {onAttachImage && (
              <button
                type="button"
                onClick={onAttachImage}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 hover:text-slate-900 text-slate-700 transition-colors"
                title="Inserir imagem"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            )}

            {/* Anexar Arquivo */}
            {onAttachFile && (
              <button
                type="button"
                onClick={onAttachFile}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 hover:text-slate-900 text-slate-700 transition-colors flex items-center gap-1"
                title="Anexar arquivo"
              >
                <Paperclip className="w-4 h-4" />
                {attachmentsCount > 0 && (
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded-full border border-sky-200">
                    {attachmentsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Área Direita Opcional da Toolbar (ex: Seletor de Assinatura) */}
          {extraToolbarRight && (
            <div className="flex items-center gap-2">
              {extraToolbarRight}
            </div>
          )}
        </div>

        {/* DIALOG DE INSERÇÃO / EDIÇÃO DE LINK */}
        <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
          <DialogContent className="sm:max-w-md p-5 bg-white rounded-2xl shadow-2xl border-slate-200 z-[10000]">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-sky-600" />
                <span>Vincular Link à Palavra</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Texto da palavra / frase:
                </label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Ex: weg, clique aqui, proposta..."
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  URL de destino:
                </label>
                <div className="relative">
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://exemplo.com.br"
                    className="h-8 text-xs font-mono pr-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyLink();
                      }
                    }}
                  />
                  {linkUrl.startsWith('http') && (
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-2 text-slate-400 hover:text-sky-600"
                      title="Testar link em nova aba"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLink}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-8 px-2 flex items-center gap-1"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Remover link</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyLink}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs h-8 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar</span>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

CRMRichTextEditor.displayName = 'CRMRichTextEditor';

export default CRMRichTextEditor;
