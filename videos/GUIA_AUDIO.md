/**
 * GUIA: Como Adicionar Áudio de Fundo em Composições Remotion
 * 
 * Há 3 formas simples de adicionar áudio:
 */

// ═══════════════════════════════════════════════════════════════════════
// FORMA 1: AUDIO COMPONENT (Mais Simples)
// ═══════════════════════════════════════════════════════════════════════

import { Audio } from 'remotion';

export const MyVideoWithAudio = () => {
  return (
    <div>
      {/* Seu vídeo aqui */}
      
      {/* Adicione áudio assim: */}
      <Audio
        src="/music/What is Salesforce - The CRM Bringing Companies & Customers Together - Salesforce (youtube).mp3"
        volume={0.35}
        loop={true}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// FORMA 2: USANDO NOSSO HOOK (Recomendado)
// ═══════════════════════════════════════════════════════════════════════

import { useBackgroundAudio, AUDIO_CONFIGS } from './audioUtils';

export const MyVideoWithBackgroundAudio = () => {
  const { audioComponent } = useBackgroundAudio(AUDIO_CONFIGS.residencial);

  return (
    <div>
      {/* Seu vídeo aqui */}
      {audioComponent}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// FORMA 3: COMPONENTE PRONTO (Mais Controle)
// ═══════════════════════════════════════════════════════════════════════

import { BackgroundAudio } from './audioUtils';

export const MyVideoWithBackgroundAudioComponent = () => {
  return (
    <div>
      {/* Seu vídeo aqui */}
      <BackgroundAudio
        src="/music/What is Salesforce - The CRM Bringing Companies & Customers Together - Salesforce (youtube).mp3"
        volume={0.35}
        fadeInFrames={30}
        fadeOutFrames={30}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// APLICAR EM QUALQUER COMPOSIÇÃO
// ═══════════════════════════════════════════════════════════════════════

// Para ResidencialLeads, por exemplo:

import { Audio } from 'remotion';
import { Sequence } from 'remotion';

export const ResidencialLeadsComAudio = () => {
  return (
    <>
      {/* Sequências de vídeo */}
      <Sequence from={0} durationInFrames={1860}>
        {/* Seu conteúdo */}
      </Sequence>

      {/* Adicionar áudio de fundo */}
      <Audio
        src="/music/What is Salesforce - The CRM Bringing Companies & Customers Together - Salesforce (youtube).mp3"
        volume={0.35}
        loop={true}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// PARÂMETROS DO AUDIO COMPONENT
// ═══════════════════════════════════════════════════════════════════════

/*
<Audio
  src={string}              // Caminho do arquivo de áudio
  volume={0-1}              // Volume (0 = mudo, 1 = máximo)
                            // Recomendado: 0.3-0.4
  
  startFrom={number}        // Frame onde começar (padrão: 0)
                            // Útil para pular intro
  
  endAt={number}            // Frame onde terminar (opcional)
  
  loop={boolean}            // Repetir se acabar (padrão: false)
/>
*/

// ═══════════════════════════════════════════════════════════════════════
// EXEMPLO COMPLETO: ResidencialLeads com Áudio
// ═══════════════════════════════════════════════════════════════════════

import { Composition, Sequence, Audio } from 'remotion';

const ResidencialLeadsWithAudio = () => {
  return (
    <>
      {/* Hook para vídeo */}
      <Sequence from={0} durationInFrames={75}>
        {/* Hook content */}
      </Sequence>

      {/* Homepage */}
      <Sequence from={75} durationInFrames={90}>
        {/* Homepage content */}
      </Sequence>

      {/* ... mais sequences ... */}

      {/* ÁUDIO DE FUNDO PARA TODO O VÍDEO */}
      <Audio
        src="/music/What is Salesforce - The CRM Bringing Companies & Customers Together - Salesforce (youtube).mp3"
        volume={0.35}
        loop={true}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DICAS DE VOLUME
// ═══════════════════════════════════════════════════════════════════════

// Volumes recomendados:
// - Músicas de fundo: 0.3-0.4 (deixa a ação em primeiro plano)
// - Efeitos sonoros: 0.5-0.7
// - Voiceover: 0.8-1.0

// Para diferentes tipos de conteúdo:
// - Marketing (foco visual): 0.3-0.35
// - Tutorial (voiceover depois): 0.25-0.3
// - Apresentação: 0.4-0.5
// - Social Media: 0.35-0.45

// ═══════════════════════════════════════════════════════════════════════
// ARQUIVO DE MÚSICA DISPONÍVEL
// ═══════════════════════════════════════════════════════════════════════

// Localização: /public/music/
// Arquivo: What is Salesforce - The CRM Bringing Companies & Customers Together - Salesforce (youtube).mp3
// Duração: ~10 minutos (Remotion repete automaticamente com loop)
// Recomendado para: Todos os vídeos (62s, 58s, 32s, 50s)

// ═══════════════════════════════════════════════════════════════════════
// COMO ADICIONAR EM UMA COMPOSIÇÃO EXISTENTE
// ═══════════════════════════════════════════════════════════════════════

// 1. Abra o arquivo (ex: ResidencialLeads.tsx)
// 2. Importe Audio do Remotion:
//    import { Audio } from 'remotion';
//
// 3. Adicione ao final do JSX (depois de todas as Sequences):
//    <Audio
//      src="/music/What is Salesforce - The CRM Bringing Companies & Customers Together - Salesforce (youtube).mp3"
//      volume={0.35}
//      loop={true}
//    />
//
// 4. Renderize novamente: npm run render:residencial
//
// O vídeo terá áudio de fundo sincronizado!

// ═══════════════════════════════════════════════════════════════════════
// SINCRONIZAR ÁUDIO COM VOICEOVER (Avançado)
// ═══════════════════════════════════════════════════════════════════════

// Você pode adicionar múltiplos áudios:
// - Background music (baixo volume)
// - Voiceover (alto volume)
// - Efeitos sonoros (conforme necessário)

// Exemplo:
// <>
//   <Audio
//     src="/music/background.mp3"
//     volume={0.3}        // Fundo
//     loop={true}
//   />
//   <Audio
//     src="/voiceover/residencial.mp3"
//     volume={0.8}        // Destaque
//     startFrom={75}      // Começa após hook
//   />
// </>
