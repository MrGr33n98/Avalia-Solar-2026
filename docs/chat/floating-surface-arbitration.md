# Floating Surface Arbitration

`CommunicationSurfaceManager` mantém uma única superfície ativa: `none`, `mobivolt`, `p2p` ou `comparison`.

Abrir MobiVolt minimiza P2P. Abrir P2P minimiza MobiVolt. Sessão permanece intacta; somente superfície visual fecha. Z-index base fica em `floating-widgets-positioning.ts`.
