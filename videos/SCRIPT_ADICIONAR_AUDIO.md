/**
 * Script de Conveniência: Adicionar Áudio a Todas as Composições
 * 
 * Execute este código ou siga o padrão manual abaixo
 */

// ═══════════════════════════════════════════════════════════════════════
// SOLUÇÃO RÁPIDA: Copie e Cole em CADA arquivo de composição
// ═══════════════════════════════════════════════════════════════════════

/*

ARQUIVO 1: src/compositions-avalia/ResidencialLeads.tsx
═════════════════════════════════════════════════════════

1. No topo, encontre a linha de import (aprox. linha 1-5):
   import { Sequence, useVideoConfig, interpolate, spring } from 'remotion';

2. Atualize para:
   import { Audio, Sequence, useVideoConfig, interpolate, spring } from 'remotion';

3. Vá até o FINAL do arquivo onde retorna <> ...</>

4. Encontre a última </> (fecha todos os elementos)

5. ANTES desse </>, adicione:

      <Audio
        src="/music/What is Salesforce - The CRM Bringing Companies & Customers Together - Salesforce (youtube).mp3"
        volume={0.35}
        loop={true}
      />

6. Salve

═════════════════════════════════════════════════════════════════════════

ARQUIVO 2: src/compositions-avalia/B2BEmpresas.tsx
════════════════════════════════════════════════════

Repita os passos acima, mas use:
  volume={0.4}

═════════════════════════════════════════════════════════════════════════

ARQUIVO 3: src/compositions-avalia/ReviewsGeneration.tsx
═════════════════════════════════════════════════════════

Repita os passos acima, mas use:
  volume={0.3}

═════════════════════════════════════════════════════════════════════════

ARQUIVO 4: src/compositions-avalia/CategoriasDiscovery.tsx
═══════════════════════════════════════════════════════════

Repita os passos acima, mas use:
  volume={0.35}

═════════════════════════════════════════════════════════════════════════

*/

// ═══════════════════════════════════════════════════════════════════════
// PADRÃO EXATO A SEGUIR
// ═════════════════════════════════════════════════════════════════════════

// Antes (sem áudio):
/*
export default function ResidencialLeads() {
  return (
    <>
      <Sequence>...</Sequence>
      <Sequence>...</Sequence>
      // ... mais sequências ...
    </>
  );
}
*/

// Depois (com áudio):
/*
import { Audio, Sequence } from 'remotion';

export default function ResidencialLeads() {
  return (
    <>
      <Sequence>...</Sequence>
      <Sequence>...</Sequence>
      // ... mais sequências ...
      
      <Audio
        src="/music/What is Salesforce - The CRM Bringing Companies & Customers Together - Salesforce (youtube).mp3"
        volume={0.35}
        loop={true}
      />
    </>
  );
}
*/

// ═════════════════════════════════════════════════════════════════════════
// APÓS ADICIONAR ÁUDIO A TODOS, RENDERIZE:
// ═════════════════════════════════════════════════════════════════════════

// npm run render:all

// Ou renderizar um de cada vez:
// npm run render:residencial
// npm run render:empresas
// npm run render:avialia-reviews
// npm run render:categorias

// ═════════════════════════════════════════════════════════════════════════
// VERIFICAÇÃO: SE FUNCIONOU...
// ═════════════════════════════════════════════════════════════════════════

// 1. Os vídeos renderizarão normalmente
// 2. Os arquivos .mp4 em videos/out/ terão som
// 3. Ao abrir no player, você ouvirá a música de fundo

// ═════════════════════════════════════════════════════════════════════════
// SE NÃO FUNCIONOU: TROUBLESHOOTING
// ═════════════════════════════════════════════════════════════════════════

// ❌ Erro: "Cannot find module: /music/..."
// ✅ Solução: Verificar se o arquivo existe em: public/music/
//    Comando: ls "C:\Users\Bobi\Desktop\AB0-1-main\videos\public\music\"

// ❌ Erro: "Audio is not exported from 'remotion'"
// ✅ Solução: Atualizar versão do Remotion
//    Comando: npm install remotion@latest

// ❌ Vídeo renderiza mas sem som
// ✅ Solução: 
//    1. Verificar se <Audio /> está dentro do <>...</>
//    2. Verificar se o path está exato
//    3. Tentar renderizar novamente

// ═════════════════════════════════════════════════════════════════════════
// VOLUMES FINAIS RECOMENDADOS
// ═════════════════════════════════════════════════════════════════════════

// ResidencialLeads: 0.35   <- Residencial com foco visual
// B2BEmpresas: 0.4        <- B2B com tom profissional
// ReviewsGeneration: 0.3  <- Suave para reviews
// CategoriasDiscovery: 0.35 <- Equilibrado

// ═════════════════════════════════════════════════════════════════════════
// PRÓXIMOS PASSOS: ADICIONAR VOICEOVER (Opcional)
// ═════════════════════════════════════════════════════════════════════════

// Você pode adicionar múltiplos áudios:
//
// <Audio
//   src="/music/background.mp3"
//   volume={0.3}
//   loop={true}
// />
// <Audio
//   src="/voiceover/residencial-intro.mp3"
//   volume={0.8}
//   startFrom={75}
// />

export default {};
