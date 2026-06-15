# DESIGN — Todas as Telas Possíveis do App Android Avalia Solar

## Objetivo do app

Criar um aplicativo Android para o Avalia Solar, funcionando como marketplace mobile para encontrar, comparar, avaliar e solicitar orçamentos de empresas de energia solar, mobilidade elétrica, carregadores, baterias, frotas elétricas e soluções relacionadas.

O app deve consumir o mesmo backend Rails/API, mesmo banco PostgreSQL e mesmos dados da plataforma web Avalia Solar.

---

# 1. Telas de Entrada e Primeira Experiência

## 01. Splash Screen

Tela exibida ao abrir o app.

### Componentes

* Logo Avalia Solar centralizado.
* Fundo azul escuro.
* Slogan: “Encontre. Compare. Confie.”
* Ilustração discreta de painel solar.
* Loading suave.

### Objetivo

Reforçar a marca e preparar o carregamento inicial do app.

---

## 02. Onboarding 1 — Encontre Empresas

### Componentes

* Ilustração de casa com painel solar.
* Título: “Encontre empresas de energia solar”
* Texto: “Compare empresas, serviços e avaliações na sua região.”
* Indicador de páginas.
* Botão “Avançar”.
* Link “Pular”.

### Objetivo

Explicar que o app ajuda o usuário a encontrar empresas confiáveis.

---

## 03. Onboarding 2 — Compare Soluções

### Componentes

* Ilustração de placas solares, carregador elétrico e bateria.
* Título: “Compare soluções completas”
* Texto: “Energia solar, mobilidade elétrica, baterias, carregadores e muito mais.”
* Indicador de páginas.
* Botão “Avançar”.

### Objetivo

Mostrar que o app possui várias verticais, não apenas energia solar.

---

## 04. Onboarding 3 — Avaliações Reais

### Componentes

* Ilustração de selo verificado com estrelas.
* Título: “Escolha com confiança”
* Texto: “Veja avaliações reais de clientes antes de contratar.”
* Indicador de páginas.
* Botão “Começar”.

### Objetivo

Reforçar confiança, reviews e prova social.

---

## 05. Seleção de Perfil Inicial

### Componentes

* Título: “Como você deseja usar o Avalia Solar?”
* Opções:

  * “Quero encontrar uma empresa”
  * “Sou uma empresa”
  * “Quero apenas navegar”
* Botão “Continuar”.

### Objetivo

Direcionar o usuário para experiência de cliente ou empresa.

---

# 2. Autenticação e Conta

## 06. Login

### Componentes

* Título: “Bem-vindo de volta”
* Campo e-mail ou telefone.
* Campo senha.
* Link “Esqueci minha senha”.
* Botão “Entrar”.
* Botões sociais: Google/Facebook.
* Link “Criar conta”.

### Objetivo

Permitir acesso do usuário.

---

## 07. Cadastro de Usuário

### Componentes

* Nome completo.
* E-mail.
* Telefone.
* Senha.
* Cidade.
* Estado.
* Checkbox de aceite dos Termos e Política de Privacidade.
* Botão “Cadastrar”.

### Objetivo

Criar conta de consumidor.

---

## 08. Cadastro de Empresa

### Componentes

* Nome da empresa.
* CNPJ.
* Nome do responsável.
* E-mail.
* Telefone.
* Cidade.
* Estado.
* Categoria principal.
* Botão “Cadastrar empresa”.

### Objetivo

Permitir início do cadastro de uma empresa no app.

---

## 09. Esqueci Minha Senha

### Componentes

* Ícone de cadeado.
* Campo de e-mail.
* Botão “Enviar instruções”.
* Link “Voltar para login”.

### Objetivo

Recuperação de acesso.

---

## 10. Redefinir Senha

### Componentes

* Campo nova senha.
* Campo confirmar senha.
* Botão “Salvar nova senha”.

### Objetivo

Permitir troca de senha após link/token.

---

## 11. Verificação de E-mail

### Componentes

* Ícone de e-mail.
* Texto: “Enviamos um link de confirmação para seu e-mail.”
* Botão “Reenviar e-mail”.
* Botão “Já confirmei”.

### Objetivo

Confirmar conta do usuário.

---

## 12. Verificação de Telefone

### Componentes

* Campo código SMS/WhatsApp.
* Botão “Verificar código”.
* Link “Reenviar código”.

### Objetivo

Validar telefone do usuário.

---

# 3. Navegação Principal

## 13. Home

### Componentes

* Saudação: “Olá, Marcos”
* Localização atual.
* Campo de busca.
* Carrossel de categorias.
* Empresas em destaque.
* Empresas próximas.
* Banner promocional.
* CTA “Solicitar orçamento”.
* Bottom navigation.

### Objetivo

Ser a tela principal de descoberta.

---

## 14. Home Deslogada

### Componentes

* Campo de busca.
* Categorias principais.
* Empresas em destaque.
* CTA “Entre para salvar favoritos”.
* Botão “Entrar”.
* Botão “Criar conta”.

### Objetivo

Permitir navegação básica sem login.

---

## 15. Home com Localização Não Definida

### Componentes

* Card solicitando localização.
* Botão “Usar minha localização”.
* Botão “Escolher cidade manualmente”.
* Empresas nacionais/destaques.

### Objetivo

Resolver ausência de cidade/estado.

---

## 16. Selecionar Localização

### Componentes

* Campo buscar cidade.
* Lista de estados.
* Lista de cidades populares.
* Botão “Usar localização atual”.

### Objetivo

Permitir definir cidade/estado para buscas.

---

# 4. Busca, Categorias e Filtros

## 17. Busca Geral

### Componentes

* SearchBar.
* Sugestões recentes.
* Categorias populares.
* Empresas populares.
* Botão limpar histórico.

### Objetivo

Permitir busca por empresa, serviço ou categoria.

---

## 18. Resultado de Busca

### Componentes

* Termo pesquisado.
* Quantidade de resultados.
* Filtros rápidos.
* Lista de empresas.
* Ordenação.
* Botão mapa.

### Objetivo

Exibir resultados de busca.

---

## 19. Busca Sem Resultado

### Componentes

* Ilustração.
* Texto: “Nenhuma empresa encontrada.”
* Botão “Limpar filtros”.
* Botão “Solicitar orçamento mesmo assim”.
* Sugestões de categorias.

### Objetivo

Evitar tela vazia e converter usuário em lead.

---

## 20. Categorias / Verticais

### Componentes

* Lista ou grid de categorias:

  * Energia Solar
  * Mobilidade Elétrica
  * Frotas Elétricas
  * Baterias
  * Carport Solar
  * Hubs de Recarga
  * Sistemas Off-grid
  * Usinas de Solo
* Quantidade de empresas por categoria.
* Ícones personalizados.

### Objetivo

Navegação por vertical.

---

## 21. Detalhe da Categoria

### Componentes

* Nome da categoria.
* Descrição.
* Especialidades.
* Empresas da categoria.
* Banner da categoria.
* Filtros rápidos.

### Objetivo

Exibir empresas e conteúdo por categoria.

---

## 22. Especialidades da Categoria

### Componentes

* Lista de subcategorias.
* Exemplo para Energia Solar:

  * Residencial
  * Comercial
  * Industrial
  * Condomínios
  * Usinas de Solo
  * Off-grid
* Contagem por especialidade.

### Objetivo

Refinar navegação.

---

## 23. Filtros Básicos

### Componentes

* Categoria.
* Cidade.
* Estado.
* Serviço.
* Avaliação mínima.
* Ordenar por.
* Botão “Aplicar filtros”.
* Botão “Limpar”.

### Objetivo

Filtrar resultados.

---

## 24. Filtros Avançados

### Componentes

* Empresas verificadas.
* Empresas premium.
* Atendimento 24h.
* Faixa de preço.
* Tempo no mercado.
* Certificações.
* Tipos de projeto.
* Formas de pagamento.
* Garantia.
* Financiamento disponível.
* Botão “Aplicar filtros”.

### Objetivo

Busca detalhada.

---

## 25. Ordenação

### Componentes

* Mais relevantes.
* Melhor avaliadas.
* Mais próximas.
* Mais recentes.
* Empresas verificadas primeiro.
* Patrocinadas primeiro.

### Objetivo

Definir ordem dos resultados.

---

# 5. Listagem de Empresas

## 26. Lista de Empresas

### Componentes

* Header com cidade/estado.
* Botão filtro.
* Botão mapa.
* Botão ordenar.
* Cards de empresas.
* Paginação/infinite scroll.

### Objetivo

Exibir empresas encontradas.

---

## 27. Lista por Cidade

### Componentes

* Título: “Empresas de energia solar em Cuiabá/MT”
* Total de empresas.
* Categorias locais.
* Empresas patrocinadas.
* Todas as empresas.
* Banner local.

### Objetivo

Listagem geolocalizada.

---

## 28. Lista por Estado

### Componentes

* Título: “Empresas de energia solar em Mato Grosso”
* Cidades em destaque.
* Empresas estaduais.
* Filtros por cidade.

### Objetivo

SEO e navegação estadual.

---

## 29. Empresas em Destaque

### Componentes

* Lista de empresas patrocinadas.
* Badge “Patrocinado”.
* Badge “Top 1”, “Top 2”.
* CTA “Solicitar orçamento”.

### Objetivo

Monetização e destaque comercial.

---

## 30. Empresas Verificadas

### Componentes

* Lista apenas com empresas verificadas.
* Explicação sobre verificação.
* Selo de confiança.

### Objetivo

Aumentar confiança.

---

## 31. Comparar Empresas

### Componentes

* Seleção de 2 a 4 empresas.
* Tabela comparativa:

  * Nota
  * Avaliações
  * Cidade
  * Serviços
  * Certificações
  * Atendimento
  * Preço estimado
* Botão “Solicitar orçamento”.

### Objetivo

Ajudar decisão do usuário.

---

# 6. Perfil da Empresa

## 32. Detalhe da Empresa — Visão Geral

### Componentes

* Capa.
* Logo.
* Nome.
* Nota.
* Avaliações.
* Cidade/UF.
* Badges.
* Botões:

  * Ligar
  * WhatsApp
  * Solicitar orçamento
  * Favoritar
* Abas:

  * Sobre
  * Serviços
  * Avaliações
  * Fotos
  * Projetos

### Objetivo

Mostrar perfil completo da empresa.

---

## 33. Aba Sobre

### Componentes

* Descrição.
* Tempo de mercado.
* Cidades atendidas.
* Certificações.
* Diferenciais.
* Formas de pagamento.
* Garantias.
* Horário de atendimento.

### Objetivo

Explicar quem é a empresa.

---

## 34. Aba Serviços

### Componentes

* Cards de serviços:

  * Instalação residencial
  * Instalação comercial
  * Manutenção
  * Limpeza de painéis
  * Projetos
  * Homologação
  * Baterias
  * Carregadores EV
* CTA em cada serviço.

### Objetivo

Exibir serviços ofertados.

---

## 35. Aba Avaliações

### Componentes

* Nota média.
* Distribuição por estrelas.
* Filtros de avaliação.
* Lista de reviews.
* Botão “Avaliar empresa”.

### Objetivo

Prova social.

---

## 36. Detalhe de Avaliação

### Componentes

* Avaliador.
* Nota.
* Comentário.
* Fotos.
* Resposta da empresa.
* Botão denunciar.

### Objetivo

Ver review completo.

---

## 37. Aba Fotos

### Componentes

* Galeria de imagens.
* Projetos instalados.
* Fotos da equipe.
* Fotos de obras.
* Zoom em imagem.

### Objetivo

Mostrar portfólio visual.

---

## 38. Aba Projetos

### Componentes

* Lista de cases.
* Nome do projeto.
* Tipo de instalação.
* Potência instalada.
* Cidade.
* Fotos.
* Resultado estimado.

### Objetivo

Mostrar experiência prática.

---

## 39. Contato Bloqueado / Login Gate

### Componentes

* Mensagem: “Entre para ver os contatos da empresa.”
* Botão “Entrar”.
* Botão “Criar conta”.
* Explicação de privacidade.

### Objetivo

Proteger dados e incentivar cadastro.

---

## 40. Denunciar Empresa

### Componentes

* Motivo da denúncia.
* Campo descrição.
* Upload opcional.
* Botão enviar.

### Objetivo

Moderação e segurança.

---

# 7. Orçamento e Leads

## 41. Solicitar Orçamento

### Componentes

* Nome.
* Telefone.
* E-mail.
* Cidade.
* Estado.
* Serviço desejado.
* Tipo de imóvel.
* Consumo médio de energia.
* Mensagem.
* Aceite LGPD.
* Botão enviar.

### Objetivo

Captar lead qualificado.

---

## 42. Orçamento Rápido

### Componentes

* Perguntas em etapas:

  * Cidade
  * Tipo de serviço
  * Tipo de imóvel
  * Valor da conta de luz
  * Telefone
* Botão “Encontrar empresas”.

### Objetivo

Wizard de captação rápida.

---

## 43. Escolher Empresas para Orçamento

### Componentes

* Lista de empresas sugeridas.
* Checkboxes.
* Botão “Enviar para selecionadas”.
* Opção “Enviar para as melhores empresas”.

### Objetivo

Permitir multi-lead.

---

## 44. Orçamento Enviado

### Componentes

* Check verde.
* Mensagem de sucesso.
* Empresas que receberam.
* Botão “Acompanhar solicitações”.
* Link “Voltar ao início”.

### Objetivo

Confirmação.

---

## 45. Minhas Solicitações

### Componentes

* Abas:

  * Todas
  * Em andamento
  * Aguardando retorno
  * Concluídas
* Cards de solicitação.
* Status.

### Objetivo

Histórico do usuário.

---

## 46. Detalhe da Solicitação

### Componentes

* Código da solicitação.
* Empresa.
* Serviço.
* Status.
* Mensagem enviada.
* Histórico.
* Botão “Falar com empresa”.
* Botão “Cancelar solicitação”.

### Objetivo

Acompanhar lead.

---

## 47. Cancelar Solicitação

### Componentes

* Motivo.
* Campo observação.
* Botão confirmar.

### Objetivo

Permitir cancelamento.

---

# 8. Avaliações

## 48. Avaliar Empresa

### Componentes

* Nota de 1 a 5.
* Comentário.
* Fotos opcionais.
* Serviço contratado.
* Checkbox confirmação.
* Botão “Enviar avaliação”.

### Objetivo

Gerar review.

---

## 49. Avaliação Enviada

### Componentes

* Check verde.
* Texto: “Sua avaliação foi enviada.”
* Aviso de moderação.
* Botão “Ver empresa”.

### Objetivo

Confirmação.

---

## 50. Minhas Avaliações

### Componentes

* Lista de avaliações feitas.
* Empresa.
* Nota.
* Status:

  * Publicada
  * Em análise
  * Rejeitada
* Botão editar.

### Objetivo

Gerenciar reviews do usuário.

---

## 51. Editar Avaliação

### Componentes

* Nota atual.
* Comentário.
* Fotos.
* Botão salvar alterações.

### Objetivo

Editar review.

---

## 52. Denunciar Avaliação

### Componentes

* Motivo.
* Descrição.
* Botão enviar.

### Objetivo

Moderação.

---

# 9. Favoritos e Coleções

## 53. Favoritos

### Componentes

* Abas:

  * Empresas
  * Serviços
  * Artigos
* Lista de favoritos.
* Empty state.

### Objetivo

Salvar empresas.

---

## 54. Coleções

### Componentes

* “Empresas para orçamento”
* “Favoritas em Cuiabá”
* “Comparar depois”
* Botão criar coleção.

### Objetivo

Organização avançada.

---

## 55. Criar Coleção

### Componentes

* Nome da coleção.
* Descrição opcional.
* Privacidade.
* Botão salvar.

### Objetivo

Agrupar favoritos.

---

# 10. Mapa e Localização

## 56. Mapa de Empresas

### Componentes

* Mapa.
* Pins.
* Toggle empresas/serviços.
* Card flutuante.
* Botão filtros.

### Objetivo

Encontrar empresas próximas.

---

## 57. Permissão de Localização

### Componentes

* Ilustração de mapa.
* Texto explicando uso.
* Botão “Permitir localização”.
* Botão “Agora não”.

### Objetivo

Solicitar permissão.

---

## 58. Escolher Cidade Manualmente

### Componentes

* Busca de cidade.
* Estados.
* Cidades populares.
* Histórico.

### Objetivo

Localização manual.

---

# 11. Notificações

## 59. Central de Notificações

### Componentes

* Lista de notificações.
* Filtro:

  * Todas
  * Orçamentos
  * Avaliações
  * Sistema
* Botão marcar como lidas.

### Objetivo

Alertas.

---

## 60. Detalhe da Notificação

### Componentes

* Título.
* Mensagem completa.
* Data.
* CTA relacionado.

### Objetivo

Exibir notificação completa.

---

## 61. Preferências de Notificação

### Componentes

* Push orçamento.
* Push mensagens.
* Push avaliações.
* E-mail.
* WhatsApp.
* Marketing.

### Objetivo

Controle do usuário.

---

# 12. Perfil do Usuário

## 62. Perfil

### Componentes

* Avatar.
* Nome.
* E-mail.
* Telefone.
* Menu:

  * Meus dados
  * Solicitações
  * Avaliações
  * Favoritos
  * Configurações
  * Ajuda
  * Termos
* Botão sair.

### Objetivo

Central da conta.

---

## 63. Editar Perfil

### Componentes

* Avatar.
* Nome.
* E-mail.
* Telefone.
* Cidade.
* Estado.
* Botão salvar.

### Objetivo

Atualizar dados.

---

## 64. Meus Dados

### Componentes

* Nome.
* E-mail.
* Telefone.
* CPF opcional.
* Cidade.
* Estado.
* Botão editar.

### Objetivo

Visualizar dados.

---

## 65. Segurança da Conta

### Componentes

* Alterar senha.
* Sessões ativas.
* Autenticação em duas etapas futura.
* Excluir conta.

### Objetivo

Segurança.

---

## 66. Alterar Senha

### Componentes

* Senha atual.
* Nova senha.
* Confirmar senha.
* Botão salvar.

### Objetivo

Troca de senha.

---

## 67. Excluir Conta

### Componentes

* Aviso.
* Motivo opcional.
* Confirmação.
* Botão excluir.

### Objetivo

LGPD e controle do usuário.

---

# 13. Ajuda, Legal e Institucional

## 68. Central de Ajuda

### Componentes

* Busca.
* FAQs.
* Categorias de ajuda.
* Botão falar conosco.

### Objetivo

Suporte.

---

## 69. FAQ

### Componentes

* Perguntas expansíveis.
* Respostas.
* CTA relacionado.

### Objetivo

Dúvidas frequentes.

---

## 70. Fale Conosco

### Componentes

* Nome.
* E-mail.
* Assunto.
* Mensagem.
* Botão enviar.

### Objetivo

Contato com suporte.

---

## 71. Termos e Políticas

### Componentes

* Termos de Uso.
* Política de Privacidade.
* LGPD.
* Política de Avaliações.
* Política de Anúncios.
* Cookies.

### Objetivo

Compliance.

---

## 72. Termo de Uso

### Componentes

* Texto legal.
* Data da versão.
* Botão aceitar.

### Objetivo

Exibir termos.

---

## 73. Política de Privacidade

### Componentes

* Texto.
* Seções LGPD.
* Canal de contato.

### Objetivo

Privacidade.

---

## 74. Sobre o Avalia Solar

### Componentes

* Logo.
* Missão.
* Como funciona.
* Versão do app.
* Redes sociais.

### Objetivo

Institucional.

---

# 14. Conteúdo / Blog

## 75. Artigos

### Componentes

* Artigo destaque.
* Lista de artigos.
* Categorias:

  * Energia Solar
  * Mobilidade Elétrica
  * Economia
  * Manutenção
* Busca.

### Objetivo

Educação e SEO.

---

## 76. Detalhe do Artigo

### Componentes

* Imagem.
* Título.
* Autor.
* Data.
* Conteúdo.
* Artigos relacionados.
* CTA “Encontrar empresas”.

### Objetivo

Leitura.

---

## 77. Artigos Favoritos

### Componentes

* Lista de artigos salvos.
* Empty state.

### Objetivo

Salvar conteúdo.

---

# 15. Comparação

## 78. Selecionar Empresas para Comparar

### Componentes

* Lista de empresas.
* Checkboxes.
* Limite de seleção.
* Botão comparar.

### Objetivo

Comparar empresas.

---

## 79. Comparativo de Empresas

### Componentes

* Tabela comparativa.
* Nota.
* Reviews.
* Serviços.
* Certificações.
* Localização.
* Patrocinada/verificada.
* Botão solicitar orçamento.

### Objetivo

Ajudar decisão.

---

## 80. Resultado Recomendado

### Componentes

* Empresa mais indicada.
* Justificativa.
* Pontos fortes.
* Botão solicitar orçamento.

### Objetivo

Conversão.

---

# 16. MobiVolt AI / Assistente

## 81. Chat MobiVolt AI

### Componentes

* Chat com assistente.
* Sugestões rápidas:

  * Quero energia solar
  * Quero carregador elétrico
  * Quero orçamento
  * Quero comparar empresas
* Cards de empresas recomendadas.

### Objetivo

Assistente inteligente.

---

## 82. Resultado da Recomendação AI

### Componentes

* Empresas recomendadas.
* Motivo da recomendação.
* Botão ver perfil.
* Botão solicitar orçamento.

### Objetivo

Recomendação personalizada.

---

## 83. Formulário Conversacional

### Componentes

* Perguntas uma a uma.
* Cidade.
* Tipo de imóvel.
* Conta de luz.
* Objetivo.
* Contato.

### Objetivo

Captar lead via conversa.

---

# 17. Área da Empresa

## 84. Login Empresa

### Componentes

* E-mail.
* Senha.
* Botão entrar.
* Link cadastrar empresa.

### Objetivo

Acesso B2B.

---

## 85. Dashboard da Empresa

### Componentes

* Leads recebidos.
* Avaliações.
* Nota média.
* Visualizações de perfil.
* Plano atual.
* CTA upgrade.

### Objetivo

Painel da empresa.

---

## 86. Leads da Empresa

### Componentes

* Lista de leads.
* Nome.
* Telefone/e-mail conforme regra.
* Serviço.
* Cidade.
* Status.
* Botão responder.

### Objetivo

Gerenciar oportunidades.

---

## 87. Detalhe do Lead

### Componentes

* Dados do cliente.
* Serviço solicitado.
* Mensagem.
* Histórico.
* Botão marcar como atendido.
* Botão responder.

### Objetivo

Atendimento comercial.

---

## 88. Avaliações Recebidas

### Componentes

* Lista de reviews.
* Nota.
* Comentário.
* Status.
* Botão responder.

### Objetivo

Gestão de reputação.

---

## 89. Responder Avaliação

### Componentes

* Avaliação original.
* Campo resposta.
* Botão publicar.

### Objetivo

Responder cliente.

---

## 90. Editar Perfil da Empresa

### Componentes

* Logo.
* Capa.
* Nome.
* Descrição.
* Serviços.
* Cidades atendidas.
* Contatos.
* Horários.
* Botão salvar.

### Objetivo

Atualizar perfil.

---

## 91. Planos da Empresa

### Componentes

* Free.
* Essencial.
* Pro.
* Enterprise.
* Benefícios.
* Botão upgrade.

### Objetivo

Monetização.

---

## 92. Assinatura e Pagamento

### Componentes

* Plano atual.
* Próxima cobrança.
* Histórico.
* Botão gerenciar assinatura.

### Objetivo

Controle financeiro.

---

## 93. Claim de Empresa

### Componentes

* Buscar empresa.
* Confirmar propriedade.
* Enviar documentos.
* Botão solicitar verificação.

### Objetivo

Reivindicar perfil.

---

## 94. Verificação da Empresa

### Componentes

* CNPJ.
* Documento.
* Site.
* Telefone.
* Status:

  * Em análise
  * Aprovado
  * Reprovado

### Objetivo

Empresa verificada.

---

# 18. Estados do Sistema

## 95. Loading

### Componentes

* Skeleton cards.
* Spinner discreto.
* Texto de carregamento.

### Objetivo

Estado de espera.

---

## 96. Erro de Conexão

### Componentes

* Ícone de erro.
* Texto: “Não foi possível carregar.”
* Botão tentar novamente.

### Objetivo

Falha de rede.

---

## 97. App Offline

### Componentes

* Aviso offline.
* Dados em cache, se houver.
* Botão tentar novamente.

### Objetivo

Experiência offline parcial.

---

## 98. Manutenção

### Componentes

* Ilustração.
* Texto: “Estamos em manutenção.”
* Previsão de retorno.

### Objetivo

Estado de manutenção.

---

## 99. Permissão Negada

### Componentes

* Explicação.
* Botão abrir configurações.
* Botão continuar sem permissão.

### Objetivo

Lidar com permissões.

---

## 100. Tela 404 / Conteúdo Não Encontrado

### Componentes

* Ilustração.
* Texto: “Conteúdo não encontrado.”
* Botão voltar ao início.

### Objetivo

Fallback.

---

# 19. Telas Prioritárias para o Primeiro APK

## MVP recomendado

1. Splash Screen
2. Onboarding
3. Login
4. Cadastro
5. Esqueci minha senha
6. Home
7. Categorias
8. Resultado por categoria
9. Lista de empresas
10. Filtros
11. Busca sem resultado
12. Detalhe da empresa
13. Serviços da empresa
14. Avaliações da empresa
15. Solicitar orçamento
16. Orçamento enviado
17. Minhas solicitações
18. Detalhe da solicitação
19. Favoritos
20. Notificações
21. Perfil
22. Editar perfil
23. Central de ajuda
24. Termos e políticas
25. Configurações

---

# 20. Telas para V2

1. Chat com empresa
2. Mapa
3. Comparar empresas
4. Artigos/Blog
5. MobiVolt AI
6. Área da empresa
7. Dashboard da empresa
8. Planos e assinatura
9. Claim de empresa
10. Verificação da empresa
11. Upload de documentos
12. Galeria de projetos
13. Coleções de favoritos
14. Preferências avançadas
15. Push notifications completas

---

# 21. Telas para V3 / Escala

1. Marketplace de produtos solares
2. Loja de equipamentos
3. Financiamento solar
4. Simulador de economia
5. Simulador de conta de luz
6. Calculadora de payback
7. Agendamento de visita técnica
8. CRM simples para empresas
9. Programa de indicação
10. Cupons e promoções
11. Ranking nacional de empresas
12. Ranking por cidade
13. Ranking por categoria
14. Certificações digitais
15. Dashboard analítico avançado

---

# 22. Componentes Globais

## BottomTabNavigation

* Início
* Buscar
* Orçamento
* Favoritos
* Perfil

## AppHeader

* Título
* Botão voltar
* Notificações
* Localização

## SearchBar

* Campo de busca
* Ícone lupa
* Botão limpar

## CompanyCard

* Logo
* Nome
* Nota
* Cidade
* Serviços
* Badges
* CTA

## CategoryCard

* Ícone
* Nome
* Quantidade
* Estado ativo

## ServiceCard

* Ícone
* Nome
* Descrição

## RatingStars

* Estrelas
* Nota
* Total

## ReviewCard

* Avatar
* Nome
* Nota
* Comentário
* Data

## LeadForm

* Nome
* Telefone
* E-mail
* Cidade
* Serviço
* Mensagem
* LGPD

## FilterSheet

* Categoria
* Cidade
* Estado
* Nota
* Ordenação

## StatusBadge

* Enviada
* Visualizada
* Aguardando retorno
* Em andamento
* Concluída
* Cancelada
* Verificada
* Premium
* Patrocinada

---

# 23. Direção Visual

O app deve parecer:

* moderno;
* limpo;
* confiável;
* premium;
* marketplace;
* fácil de usar;
* inspirado em OLX pela busca e listagem;
* inspirado em G2/Capterra por avaliações, notas e comparação.

## Evitar

* excesso de telas no MVP;
* informações demais em um único card;
* botões sem hierarquia;
* textos em inglês;
* ícones genéricos;
* visual poluído;
* regras comerciais duplicadas no frontend.

---

# 24. Regra Central

O app Android deve ser apenas mais um cliente do Avalia Solar.

A fonte da verdade continua sendo:

* Backend Rails;
* API `/api/v1`;
* Banco PostgreSQL;
* Active Admin;
* mesmos cadastros;
* mesmas empresas;
* mesmas categorias;
* mesmos leads;
* mesmas avaliações;
* mesmos banners;
* mesmos planos.

Não criar backend separado.
Não criar banco separado.
Não hardcodar dados.
