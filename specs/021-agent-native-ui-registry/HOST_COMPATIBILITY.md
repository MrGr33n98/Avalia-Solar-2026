# Compatibilidade de hosts
| Host | Estratégia | Prova |
|---|---|---|
| ChatGPT Apps | ext-apps/bridge atual, _meta existente, tema e safe area | smoke real autorizado |
| Claude MCP Apps | ext-apps e capabilities, verificar suporte do cliente específico | smoke se disponível, senão NOT RUN |
| Host harness | loopback + fixtures marcadas | Playwright E2E |
| Cliente sem UI | content textual | request spec |
| Offline/sem callTool | render dados válidos; desabilitar ações | unidade/E2E |

Não assumir fullscreen, links, sendFollowUpMessage ou tool calls disponíveis. Reusar detecção de capabilities. Testar contexto mudando tema e modo, mensagens fora de ordem/cancelamento, payload inválido, resize, safe areas. Não usar iframe cross-origin arbitrário. Não confundir MCP Apps com WebMCP. O registry de componentes é ferramenta de desenvolvimento, não substitui o host/runtime.
