from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

OUTPUT = r"C:\Users\Bobi\Desktop\TCC_Avalia_Solar_Metodologia.pdf"

# ── Cores ──────────────────────────────────────────────────────────────────
AZUL_ESCURO   = colors.HexColor("#1E3A5F")
AZUL_MEDIO    = colors.HexColor("#2563EB")
AZUL_CLARO    = colors.HexColor("#EFF6FF")
VERDE         = colors.HexColor("#059669")
VERDE_CLARO   = colors.HexColor("#ECFDF5")
CINZA_ESCURO  = colors.HexColor("#1E293B")
CINZA_MEDIO   = colors.HexColor("#64748B")
CINZA_CLARO   = colors.HexColor("#F8FAFC")
LARANJA       = colors.HexColor("#D97706")
LARANJA_CLARO = colors.HexColor("#FFFBEB")
BRANCO        = colors.white

# ── Estilos ────────────────────────────────────────────────────────────────
def build_styles():
    s = {}

    s["capa_titulo"] = ParagraphStyle(
        "capa_titulo", fontName="Helvetica-Bold", fontSize=26,
        textColor=BRANCO, alignment=TA_CENTER, leading=34, spaceAfter=10
    )
    s["capa_sub"] = ParagraphStyle(
        "capa_sub", fontName="Helvetica", fontSize=13,
        textColor=colors.HexColor("#CBD5E1"), alignment=TA_CENTER, leading=20
    )
    s["parte_titulo"] = ParagraphStyle(
        "parte_titulo", fontName="Helvetica-Bold", fontSize=15,
        textColor=BRANCO, alignment=TA_CENTER, leading=22
    )
    s["h1"] = ParagraphStyle(
        "h1", fontName="Helvetica-Bold", fontSize=18,
        textColor=AZUL_ESCURO, spaceBefore=18, spaceAfter=6, leading=24
    )
    s["h2"] = ParagraphStyle(
        "h2", fontName="Helvetica-Bold", fontSize=13,
        textColor=AZUL_MEDIO, spaceBefore=14, spaceAfter=4, leading=18
    )
    s["h3"] = ParagraphStyle(
        "h3", fontName="Helvetica-Bold", fontSize=11,
        textColor=CINZA_ESCURO, spaceBefore=10, spaceAfter=3, leading=16
    )
    s["body"] = ParagraphStyle(
        "body", fontName="Helvetica", fontSize=10,
        textColor=CINZA_ESCURO, leading=16, spaceAfter=6, alignment=TA_JUSTIFY
    )
    s["body_bold"] = ParagraphStyle(
        "body_bold", fontName="Helvetica-Bold", fontSize=10,
        textColor=CINZA_ESCURO, leading=16, spaceAfter=4
    )
    s["destaque"] = ParagraphStyle(
        "destaque", fontName="Helvetica", fontSize=10,
        textColor=AZUL_ESCURO, leading=16, spaceAfter=4,
        leftIndent=12, alignment=TA_JUSTIFY
    )
    s["rodape"] = ParagraphStyle(
        "rodape", fontName="Helvetica", fontSize=8,
        textColor=CINZA_MEDIO, alignment=TA_CENTER
    )
    s["label_box"] = ParagraphStyle(
        "label_box", fontName="Helvetica-Bold", fontSize=9,
        textColor=AZUL_ESCURO, alignment=TA_CENTER
    )
    s["conceito_titulo"] = ParagraphStyle(
        "conceito_titulo", fontName="Helvetica-Bold", fontSize=11,
        textColor=VERDE, spaceBefore=8, spaceAfter=2
    )
    s["numero"] = ParagraphStyle(
        "numero", fontName="Helvetica-Bold", fontSize=28,
        textColor=AZUL_MEDIO, alignment=TA_CENTER, leading=34
    )
    return s

# ── Helpers ────────────────────────────────────────────────────────────────
def caixa_colorida(conteudo, bg=AZUL_CLARO, borda=AZUL_MEDIO, esquerda=True):
    """Retorna um Table de 1 célula estilizado como caixa de destaque."""
    t = Table([[conteudo]], colWidths=[15.5 * cm])
    cor_borda = borda
    estilo = [
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 1, cor_borda),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]
    if esquerda:
        estilo.append(("LINEBEFORE", (0, 0), (0, -1), 4, cor_borda))
    t.setStyle(TableStyle(estilo))
    return t

def tabela_simples(dados, col_widths, header_bg=AZUL_ESCURO):
    t = Table(dados, colWidths=col_widths)
    estilo = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), BRANCO),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRANCO, CINZA_CLARO]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("TEXTCOLOR", (0, 1), (-1, -1), CINZA_ESCURO),
        ("WORDWRAP", (0, 0), (-1, -1), True),
    ]
    t.setStyle(TableStyle(estilo))
    return t

# ── Página de capa ─────────────────────────────────────────────────────────
def pagina_capa(story, s):
    # Fundo azul simulado com tabela de largura total
    capa_data = [[
        Paragraph("PROPOSTAS DE TCC", s["capa_titulo"]),
    ]]
    # Bloco de cabeçalho
    story.append(Spacer(1, 0.5 * cm))

    header = Table([[
        Paragraph("PROPOSTAS DE TCC", s["capa_titulo"]),
    ]], colWidths=[15.5 * cm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AZUL_ESCURO),
        ("TOPPADDING", (0, 0), (-1, -1), 30),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("ROUNDEDCORNERS", [8, 8, 0, 0]),
    ]))
    story.append(header)

    sub_data = [
        [Paragraph("Engenharia de Produção — UFSC", s["capa_sub"])],
        [Paragraph("Plataforma Avalia Solar", s["capa_sub"])],
        [Spacer(1, 0.3 * cm)],
        [Paragraph("Guia Completo de Metodologia de Pesquisa", ParagraphStyle(
            "ds", fontName="Helvetica-Bold", fontSize=14,
            textColor=colors.HexColor("#93C5FD"), alignment=TA_CENTER
        ))],
        [Spacer(1, 0.3 * cm)],
        [Paragraph("3 Propostas · Nível A+++", ParagraphStyle(
            "ds2", fontName="Helvetica", fontSize=11,
            textColor=colors.HexColor("#CBD5E1"), alignment=TA_CENTER
        ))],
        [Spacer(1, 1 * cm)],
    ]
    sub = Table(sub_data, colWidths=[15.5 * cm])
    sub.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AZUL_ESCURO),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("ROUNDEDCORNERS", [0, 0, 8, 8]),
    ]))
    story.append(sub)
    story.append(Spacer(1, 0.8 * cm))

    # Três cards de proposta
    cards_data = [[
        _mini_card("01", "SAD\nMulticritério", "AHP · TOPSIS\nTrust Score", AZUL_MEDIO),
        _mini_card("02", "Assimetria de\nInformação", "Sinalização · SEM\nPlataformas Digitais", VERDE),
        _mini_card("03", "Qualidade de\nServiço", "SERVQUAL · AFC\nSatisfação", LARANJA),
    ]]
    cards = Table(cards_data, colWidths=[4.9 * cm, 4.9 * cm, 4.9 * cm], hAlign="CENTER")
    cards.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(cards)
    story.append(Spacer(1, 0.8 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0")))
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("Universidade Federal de Santa Catarina · 2026", s["rodape"]))
    story.append(PageBreak())

def _mini_card(num, titulo, tags, cor):
    inner = Table([
        [Paragraph(num, ParagraphStyle("n", fontName="Helvetica-Bold", fontSize=22, textColor=BRANCO, alignment=TA_CENTER))],
        [Paragraph(titulo, ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=10, textColor=BRANCO, alignment=TA_CENTER, leading=14))],
        [Spacer(1, 0.2 * cm)],
        [Paragraph(tags, ParagraphStyle("tg", fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#E2E8F0"), alignment=TA_CENTER, leading=12))],
    ], colWidths=[4.5 * cm])
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), cor),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return inner

# ── Índice ─────────────────────────────────────────────────────────────────
def pagina_indice(story, s):
    story.append(Paragraph("Sumário", s["h1"]))
    story.append(HRFlowable(width="100%", thickness=2, color=AZUL_MEDIO, spaceAfter=10))

    itens = [
        ("Parte I", "Conceitos Gerais de Metodologia de Pesquisa", "3"),
        ("1.1", "Tipos de Pesquisa: Básica vs. Aplicada", "3"),
        ("1.2", "Abordagens: Quantitativa, Qualitativa e Mista", "3"),
        ("1.3", "Revisão Sistemática da Literatura (PRISMA)", "4"),
        ("1.4", "Análise de Conteúdo (Bardin)", "4"),
        ("Parte II", "Proposta 1 — SAD Multicritério (AHP-TOPSIS)", "5"),
        ("2.1", "Método Delphi", "5"),
        ("2.2", "AHP — Analytic Hierarchy Process", "5"),
        ("2.3", "TOPSIS", "6"),
        ("2.4", "Trust Score Composto", "6"),
        ("2.5", "Correlação de Spearman e Análise de Sensibilidade", "7"),
        ("Parte III", "Proposta 2 — Assimetria de Informação e Plataformas", "8"),
        ("3.1", "Teoria da Sinalização (Spence, 1973)", "8"),
        ("3.2", "Economia de Plataformas de Dois Lados", "8"),
        ("3.3", "Modelo de Equações Estruturais (SEM / PLS-SEM)", "9"),
        ("3.4", "Experimento com Vinhetas (Vignettes)", "9"),
        ("3.5", "Análise de Clusters (K-means)", "10"),
        ("Parte IV", "Proposta 3 — Qualidade de Serviço e Satisfação", "11"),
        ("4.1", "SERVQUAL e E-S-QUAL", "11"),
        ("4.2", "Paradigma Churchill (1979)", "11"),
        ("4.3", "Técnica do Incidente Crítico (TIC)", "12"),
        ("4.4", "Grupos Focais e Think Aloud", "12"),
        ("4.5", "Índice de Validade de Conteúdo (IVC)", "13"),
        ("4.6", "Análise Fatorial Exploratória (AFE)", "13"),
        ("4.7", "Análise Fatorial Confirmatória (AFC)", "14"),
        ("4.8", "NPS — Net Promoter Score", "14"),
        ("Parte V", "Glossário e Referências Rápidas", "15"),
    ]
    dados = [["Seção", "Título", "Pág."]]
    for sec, titulo, pag in itens:
        dados.append([sec, titulo, pag])

    t = tabela_simples(dados, [2 * cm, 11 * cm, 1.5 * cm])
    story.append(t)
    story.append(PageBreak())

# ── PARTE I — Conceitos Gerais ─────────────────────────────────────────────
def parte_conceitos_gerais(story, s):
    _banner_parte(story, "PARTE I", "Conceitos Gerais de Metodologia de Pesquisa", AZUL_ESCURO)

    story.append(Paragraph("1.1 Tipos de Pesquisa: Básica vs. Aplicada", s["h2"]))
    story.append(Paragraph(
        "A <b>pesquisa básica</b> busca ampliar o conhecimento científico sem objetivo imediato de aplicação prática. "
        "Já a <b>pesquisa aplicada</b> visa gerar conhecimento direcionado à solução de problemas concretos. "
        "As três propostas deste TCC são de natureza <b>aplicada</b>: o objeto de estudo é a plataforma Avalia Solar, "
        "e os resultados produzirão modelos e instrumentos diretamente utilizáveis pelo negócio e pelo setor solar.",
        s["body"]))

    dados_tipo = [
        ["Característica", "Básica", "Aplicada"],
        ["Objetivo", "Gerar teoria", "Resolver problemas reais"],
        ["Resultado esperado", "Artigos científicos", "Modelos, ferramentas, protocolos"],
        ["Horizonte temporal", "Longo prazo", "Médio prazo"],
        ["Exemplo no TCC", "—", "Trust Score, SEM, Escala QUAL"],
    ]
    story.append(tabela_simples(dados_tipo, [4.5 * cm, 5 * cm, 5 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("1.2 Abordagens: Quantitativa, Qualitativa e Mista", s["h2"]))
    story.append(Paragraph(
        "A abordagem <b>quantitativa</b> opera com dados numéricos, instrumentos padronizados e análise estatística, "
        "buscando generalizações. A abordagem <b>qualitativa</b> trabalha com linguagem, significados e contextos, "
        "priorizando profundidade. A abordagem <b>mista (mixed methods)</b> combina as duas de forma sistemática, "
        "usando cada uma onde é mais adequada — estratégia adotada pelas três propostas.",
        s["body"]))
    story.append(caixa_colorida(
        Paragraph(
            "<b>Exemplo nas propostas:</b> Na Proposta 3, grupos focais (qualitativo) geram os itens da escala; "
            "a AFC (quantitativo) valida sua estrutura dimensional. Cada método complementa o outro.",
            s["destaque"]), AZUL_CLARO, AZUL_MEDIO))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("1.3 Revisão Sistemática da Literatura — Protocolo PRISMA", s["h2"]))
    story.append(Paragraph(
        "A <b>Revisão Sistemática da Literatura (RSL)</b> é um método rigoroso de síntese do conhecimento científico "
        "que, diferentemente de uma revisão narrativa, segue um protocolo explícito e replicável. O protocolo "
        "<b>PRISMA</b> (<i>Preferred Reporting Items for Systematic Reviews and Meta-Analyses</i>) organiza o processo "
        "em quatro etapas principais:",
        s["body"]))
    etapas_prisma = [
        ["Etapa", "Descrição", "Exemplo prático"],
        ["Identificação", "Busca nas bases Scopus, Web of Science, SciELO com descritores controlados", "\"solar energy supplier selection\" AND \"AHP\""],
        ["Triagem", "Exclusão por título/resumo conforme critérios de elegibilidade", "Excluir artigos antes de 2010 ou fora do escopo"],
        ["Elegibilidade", "Leitura completa dos artigos pré-selecionados", "Verificar se usam dados empíricos"],
        ["Inclusão", "Corpus final para análise e síntese", "N = 38 artigos incluídos"],
    ]
    story.append(tabela_simples(etapas_prisma, [3 * cm, 7 * cm, 5 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("1.4 Análise de Conteúdo — Bardin (2011)", s["h2"]))
    story.append(Paragraph(
        "A <b>Análise de Conteúdo</b> (AC) é uma técnica para tratamento sistemático de dados textuais "
        "(transcrições de entrevistas, grupos focais, documentos). Laurence Bardin propôs o método em três polos: "
        "<b>pré-análise</b> (leitura flutuante, organização do corpus), <b>exploração do material</b> (codificação, "
        "categorização) e <b>tratamento dos resultados</b> (inferência, interpretação). "
        "Na Proposta 3, a AC é usada para transformar transcrições de grupos focais em categorias que "
        "originarão os itens da escala de qualidade.",
        s["body"]))
    story.append(PageBreak())

# ── PARTE II — Proposta 1 ──────────────────────────────────────────────────
def parte_proposta1(story, s):
    _banner_parte(story, "PARTE II", "Proposta 1 — SAD Multicritério: AHP-TOPSIS", AZUL_MEDIO)

    story.append(Paragraph("2.1 Método Delphi", s["h2"]))
    story.append(Paragraph(
        "O <b>Método Delphi</b> é uma técnica de consulta estruturada a especialistas, realizada em rodadas anônimas "
        "iterativas, com o objetivo de alcançar consenso sobre um tema complexo. A anonimidade evita que opiniões "
        "dominantes inibam respostas individuais (efeito de pressão de grupo). Cada rodada apresenta um resumo "
        "estatístico das respostas anteriores, permitindo que os participantes revisem suas opiniões.",
        s["body"]))
    story.append(caixa_colorida(
        Paragraph(
            "<b>Aplicação no TCC:</b> Um painel de 15 especialistas (engenheiros solares, consumidores experientes, "
            "representantes do setor) é consultado em 2 rodadas para validar e hierarquizar os critérios de seleção "
            "de instaladores (ex: certificação INMETRO, garantia, portfólio, tempo de resposta). "
            "O consenso é mensurado pelo coeficiente de variação (CV &lt; 25%).",
            s["destaque"]), AZUL_CLARO, AZUL_MEDIO))
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("2.2 AHP — Analytic Hierarchy Process (Saaty, 1980)", s["h2"]))
    story.append(Paragraph(
        "O <b>AHP</b> é um método de tomada de decisão multicritério que estrutura o problema em uma hierarquia "
        "(objetivo → critérios → alternativas) e quantifica preferências por meio de comparações par a par "
        "em escala de 1 a 9. Para cada par de critérios, o tomador de decisão expressa o quanto um é mais "
        "importante que o outro. O resultado são <b>pesos normalizados</b> para cada critério.",
        s["body"]))
    story.append(Paragraph(
        "Um elemento central do AHP é a <b>Razão de Consistência (RC)</b>. Matrizes de julgamento humanas "
        "são naturalmente inconsistentes. O AHP tolera inconsistências desde que RC &le; 0,10. "
        "Se RC &gt; 0,10, o especialista deve revisar seus julgamentos.",
        s["body"]))
    dados_escala = [
        ["Valor", "Significado"],
        ["1", "Critérios igualmente importantes"],
        ["3", "Critério i levemente mais importante que j"],
        ["5", "Critério i moderadamente mais importante"],
        ["7", "Critério i fortemente mais importante"],
        ["9", "Critério i extremamente mais importante"],
        ["2, 4, 6, 8", "Valores intermediários"],
    ]
    story.append(tabela_simples(dados_escala, [3 * cm, 11.5 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("2.3 TOPSIS — Technique for Order Preference by Similarity to Ideal Solution", s["h2"]))
    story.append(Paragraph(
        "O <b>TOPSIS</b> ranqueia alternativas com base na proximidade relativa a uma solução ideal "
        "positiva (melhor possível) e ao afastamento de uma solução ideal negativa (pior possível). "
        "A lógica é: a melhor alternativa é aquela que está simultaneamente <i>mais perto</i> do ideal "
        "positivo e <i>mais longe</i> do ideal negativo.",
        s["body"]))
    etapas_topsis = [
        ["Passo", "Operação"],
        ["1. Normalização", "Padronizar a matriz de decisão para escala comparável"],
        ["2. Ponderação", "Multiplicar pelos pesos AHP"],
        ["3. Ideal positivo (A+)", "Melhor valor em cada critério"],
        ["4. Ideal negativo (A-)", "Pior valor em cada critério"],
        ["5. Distância euclidiana", "Calcular D+ (dist. ao A+) e D- (dist. ao A-)"],
        ["6. Proximidade relativa", "Ci = D- / (D+ + D-), onde Ci in [0,1]"],
        ["7. Ranqueamento", "Ordenar por Ci decrescente (maior Ci = melhor empresa)"],
    ]
    story.append(tabela_simples(etapas_topsis, [5 * cm, 10 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("2.4 Trust Score Composto", s["h2"]))
    story.append(Paragraph(
        "O <b>Trust Score</b> do Avalia Solar é um índice composto que combina o score TOPSIS (dimensão técnica "
        "e operacional) com métricas de reputação digital (avaliações de usuários, verificação cadastral, "
        "histórico de reclamações). A composição é linear ponderada:",
        s["body"]))
    story.append(caixa_colorida(
        Paragraph(
            "<b>Trust Score = w1 × Score_TOPSIS + w2 × Reputacao_Media + w3 × Verificacao</b><br/>"
            "onde os pesos w1, w2, w3 somam 1 e são calibrados pela AFC ou regressão múltipla "
            "para maximizar a correlação com satisfação global reportada.",
            s["destaque"]), VERDE_CLARO, VERDE))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("2.5 Correlação de Spearman e Análise de Sensibilidade", s["h2"]))
    story.append(Paragraph(
        "A <b>correlação de Spearman (rho, ρ)</b> mede a associação entre dois rankings (variáveis ordinais). "
        "É preferida à correlação de Pearson quando as variáveis não seguem distribuição normal. "
        "No TCC, mede a concordância entre o ranking TOPSIS e a satisfação reportada pelos usuários. "
        "Um ρ ≥ 0,70 indica associação forte.",
        s["body"]))
    story.append(Paragraph(
        "A <b>Análise de Sensibilidade</b> verifica a robustez do modelo: os pesos de cada critério são "
        "variados em ±20% e observa-se se o ranking final de empresas se altera significativamente. "
        "Se o ranking permanece estável, o modelo é robusto.",
        s["body"]))
    story.append(PageBreak())

# ── PARTE III — Proposta 2 ─────────────────────────────────────────────────
def parte_proposta2(story, s):
    _banner_parte(story, "PARTE III", "Proposta 2 — Assimetria de Informação e Plataformas Digitais", VERDE)

    story.append(Paragraph("3.1 Teoria da Sinalização — Spence (1973)", s["h2"]))
    story.append(Paragraph(
        "Em mercados com <b>assimetria de informação</b>, um lado possui mais informação que o outro. "
        "George Akerlof (1970) demonstrou que essa assimetria pode colapsar mercados — no exemplo clássico, "
        "o mercado de carros usados ('lemons'): como o comprador não sabe a qualidade ex ante, "
        "paga apenas pelo preço médio, afastando vendedores de carros bons do mercado.",
        s["body"]))
    story.append(Paragraph(
        "Michael Spence (Prêmio Nobel 2001) propôs a <b>Teoria da Sinalização</b>: agentes com "
        "atributos superiores podem enviar <i>sinais custosos e críveis</i> para diferenciá-los de agentes "
        "inferiores. Para ser eficaz, o sinal deve ser <b>mais barato de obter para quem é bom</b> do que "
        "para quem é ruim (condição de separação).",
        s["body"]))
    story.append(caixa_colorida(
        Paragraph(
            "<b>Sinais no Avalia Solar:</b><br/>"
            "• Certificação INMETRO/ABNT — caro de obter, sinaliza qualidade técnica real<br/>"
            "• Trust Score alto — construído com dados verificados, difícil de manipular<br/>"
            "• Avaliações de usuários verificados — credíveis por terem comprado de fato<br/>"
            "• Verificação cadastral — reduz risco de fraude/empresa fantasma",
            s["destaque"]), VERDE_CLARO, VERDE))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("3.2 Economia de Plataformas de Dois Lados (Rochet & Tirole, 2003)", s["h2"]))
    story.append(Paragraph(
        "Uma <b>plataforma de dois lados</b> é um intermediário que conecta dois grupos distintos de usuários "
        "que se beneficiam mutuamente. O Avalia Solar é uma plataforma de dois lados: "
        "<b>Lado 1</b> = consumidores que buscam instaladores; <b>Lado 2</b> = empresas instaladoras que "
        "buscam clientes. Efeitos de rede cruzados: mais empresas atraem mais consumidores, que atraem mais empresas.",
        s["body"]))
    dados_plat = [
        ["Conceito", "Descrição", "Exemplo no Avalia Solar"],
        ["Efeito de rede", "Valor cresce com o número de participantes", "Mais empresas = mais comparacoes possiveis"],
        ["Subsidio cruzado", "Um lado subsidia o outro", "Consumidores acessam gratis; empresas pagam plano"],
        ["Problema de galinha e ovo", "Ambos os lados precisam estar presentes para o outro entrar", "Empresa entra se houver consumidores, e vice-versa"],
        ["Governanca da plataforma", "Regras que definem quem pode participar e como", "Verificacao de empresas, moderacao de reviews"],
    ]
    story.append(tabela_simples(dados_plat, [4 * cm, 6 * cm, 5 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("3.3 Modelagem de Equações Estruturais — SEM / PLS-SEM", s["h2"]))
    story.append(Paragraph(
        "O <b>SEM (Structural Equation Modeling)</b> é uma família de técnicas multivariadas que testa "
        "simultaneamente múltiplas relações de dependência entre construtos (variáveis latentes, não observáveis "
        "diretamente). Diferente da regressão simples, o SEM lida com variáveis medidas por indicadores (itens de escala) "
        "e permite estimar tanto o <b>modelo de medição</b> (relação indicador-construto) quanto o "
        "<b>modelo estrutural</b> (relação construto-construto).",
        s["body"]))
    story.append(Paragraph(
        "O <b>PLS-SEM</b> (<i>Partial Least Squares</i>) é uma variante baseada em mínimos quadrados parciais, "
        "recomendada quando: amostra é moderada (N ≥ 100), construtos são reflexivos, "
        "objetivo é preditivo. Critérios de qualidade:",
        s["body"]))
    dados_sem = [
        ["Critério", "Threshold aceitável", "O que mede"],
        ["AVE (Variância Média Extraída)", ">= 0,50", "Validade convergente dos itens"],
        ["CR (Confiabilidade Composta)", ">= 0,70", "Coerencia interna do construto"],
        ["HTMT", "< 0,85", "Validade discriminante entre construtos"],
        ["R² do construto endogeno", ">= 0,25", "Poder explicativo do modelo"],
        ["Coeficientes de caminho (beta)", "p < 0,05", "Significancia das relacoes estruturais"],
    ]
    story.append(tabela_simples(dados_sem, [5.5 * cm, 4 * cm, 5.5 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("3.4 Experimento com Vinhetas (Vignettes)", s["h2"]))
    story.append(Paragraph(
        "Uma <b>vinheta</b> é uma descrição hipotética e controlada de uma situação ou objeto, "
        "apresentada aos respondentes para avaliar suas reações. Permite isolar o efeito de "
        "variáveis específicas ao manter tudo o mais constante. Na Proposta 2, os respondentes "
        "avaliam perfis fictícios de empresas instaladoras que diferem apenas em um atributo "
        "(ex: perfil A tem Trust Score alto; perfil B é idêntico mas sem Trust Score), "
        "permitindo estimar o efeito causal do sinal sobre a confiança.",
        s["body"]))
    story.append(caixa_colorida(
        Paragraph(
            "<b>Design 2x2:</b> Trust Score (alto/baixo) × Certificação (com/sem) = 4 perfis. "
            "Cada respondente avalia 1 perfil. Análise por ANOVA ou regressão com interações.",
            s["destaque"]), LARANJA_CLARO, LARANJA))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("3.5 Análise de Clusters — K-means", s["h2"]))
    story.append(Paragraph(
        "A <b>análise de clusters</b> é uma técnica de aprendizado não supervisionado que agrupa "
        "observações com base em sua similaridade, sem rótulos pré-definidos. O algoritmo <b>K-means</b> "
        "particiona os dados em K grupos minimizando a variância intra-cluster. "
        "No TCC, segmenta consumidores por perfil de sensibilidade a sinais: "
        "ex: Cluster 1 (alta sensibilidade a certificações), Cluster 2 (prioriza avaliações de pares), "
        "Cluster 3 (sensível a preço, menor responsividade a sinais institucionais).",
        s["body"]))
    story.append(PageBreak())

# ── PARTE IV — Proposta 3 ──────────────────────────────────────────────────
def parte_proposta3(story, s):
    _banner_parte(story, "PARTE IV", "Proposta 3 — Qualidade de Serviço e Satisfação do Consumidor", LARANJA)

    story.append(Paragraph("4.1 SERVQUAL e E-S-QUAL (Parasuraman et al.)", s["h2"]))
    story.append(Paragraph(
        "O <b>SERVQUAL</b> (1988) é o instrumento mais influente na medição de qualidade de serviços. "
        "Baseia-se na teoria das lacunas (<i>gap theory</i>): qualidade percebida = Percepção − Expectativa. "
        "Originalmente composto por 5 dimensões: <b>Tangibilidade, Confiabilidade, Responsividade, "
        "Segurança e Empatia</b>.",
        s["body"]))
    story.append(Paragraph(
        "O <b>E-S-QUAL</b> (2005) adapta o SERVQUAL para serviços eletrônicos, com dimensões: "
        "Eficiência, Cumprimento, Disponibilidade do Sistema e Privacidade. "
        "A Proposta 3 vai além: desenvolve um instrumento específico para o setor solar, "
        "incorporando dimensões técnicas que esses instrumentos genéricos não capturam.",
        s["body"]))
    dados_dim = [
        ["SERVQUAL (genérico)", "E-S-QUAL (digital)", "Escala Solar (proposta)"],
        ["Tangibilidade", "Eficiencia", "Competencia Tecnica"],
        ["Confiabilidade", "Cumprimento", "Desempenho Energetico Entregue"],
        ["Responsividade", "Disponibilidade", "Suporte Pos-Instalacao"],
        ["Seguranca", "Privacidade", "Transparencia Comercial"],
        ["Empatia", "—", "Conformidade Regulatoria"],
        ["—", "—", "Qualidade da Comunicacao"],
    ]
    story.append(tabela_simples(dados_dim, [5 * cm, 5 * cm, 5 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("4.2 Paradigma Churchill (1979)", s["h2"]))
    story.append(Paragraph(
        "Gilbert Churchill propôs um processo sistemático de 8 etapas para o desenvolvimento de "
        "escalas de medição em marketing e ciências sociais. É o padrão-ouro para desenvolvimento "
        "de novos instrumentos psicométricos:",
        s["body"]))
    etapas_ch = [
        ["Etapa", "Descrição"],
        ["1. Especificar o domínio do construto", "Definir exatamente o que se quer medir"],
        ["2. Gerar amostra de itens", "Pool de 60-80 itens via literatura + entrevistas + especialistas"],
        ["3. Coletar dados (Estudo 1)", "Survey com amostra de respondentes (N >= 200)"],
        ["4. Purificar a medida (AFE)", "Análise Fatorial Exploratória + alfa de Cronbach"],
        ["5. Coletar dados (Estudo 2)", "Nova amostra independente (N >= 300)"],
        ["6. Avaliar confiabilidade", "Alfa de Cronbach, confiabilidade composta"],
        ["7. Avaliar validade", "Validade convergente, discriminante e nomológica (AFC)"],
        ["8. Desenvolver normas", "Scores de referência para interpretação"],
    ]
    story.append(tabela_simples(etapas_ch, [6 * cm, 9 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("4.3 Técnica do Incidente Crítico (TIC)", s["h2"]))
    story.append(Paragraph(
        "A <b>Técnica do Incidente Crítico</b> (Flanagan, 1954) coleta relatos de experiências "
        "específicas que foram claramente positivas ou negativas. O foco em eventos concretos "
        "— não em opiniões abstratas — produz dados ricos e ancorados na realidade. "
        "Pergunta típica: <i>'Descreva uma situação específica em que a empresa instaladora fez algo "
        "que te impressionou positivamente (ou negativamente).'</i>",
        s["body"]))
    story.append(caixa_colorida(
        Paragraph(
            "<b>Por que usar no setor solar:</b> A instalação fotovoltaica é um serviço técnico complexo "
            "com múltiplos momentos de verdade (visita técnica, instalação, comissionamento, pós-venda). "
            "A TIC revela quais momentos são mais críticos para a satisfação, orientando a construção "
            "dos itens da escala.",
            s["destaque"]), LARANJA_CLARO, LARANJA))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("4.4 Grupos Focais e Think Aloud", s["h2"]))
    story.append(Paragraph(
        "O <b>grupo focal</b> é uma técnica qualitativa de coleta de dados em que um moderador "
        "conduz uma discussão com 6–8 participantes em torno de um tema. A interação entre "
        "participantes gera insights que entrevistas individuais não produziriam. "
        "São realizados 2 grupos focais com consumidores que instalaram sistemas solares nos últimos 3 anos.",
        s["body"]))
    story.append(Paragraph(
        "O <b>Think Aloud</b> (pensar em voz alta) é usado no pré-teste cognitivo do instrumento: "
        "o respondente verbaliza seus pensamentos enquanto responde ao questionário, revelando itens "
        "ambíguos, confusos ou com dupla interpretação. É aplicado com 15 participantes antes da "
        "coleta principal.",
        s["body"]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("4.5 Índice de Validade de Conteúdo (IVC)", s["h2"]))
    story.append(Paragraph(
        "O <b>IVC</b> mede o grau de concordância entre juízes especialistas sobre se um item "
        "representa adequadamente o construto que se pretende medir. Cada juiz avalia cada item "
        "em escala de 1 a 4 (1=irrelevante, 4=muito relevante). "
        "O IVC de cada item é: proporção de juízes que atribuíram 3 ou 4.",
        s["body"]))
    story.append(caixa_colorida(
        Paragraph(
            "<b>IVC por item &ge; 0,80</b> (com 10 juízes = no mínimo 8 devem avaliar 3 ou 4)<br/>"
            "<b>IVC da escala (IVC-S)</b> = média dos IVCs de todos os itens &ge; 0,90<br/>"
            "Itens abaixo do threshold são revisados ou excluídos.",
            s["destaque"]), VERDE_CLARO, VERDE))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("4.6 Análise Fatorial Exploratória (AFE)", s["h2"]))
    story.append(Paragraph(
        "A <b>AFE</b> é uma técnica estatística que identifica a estrutura dimensional subjacente "
        "a um conjunto de itens sem impor uma estrutura prévia. Revela quantas dimensões (fatores) "
        "existem nos dados e quais itens carregam em cada fator.",
        s["body"]))
    dados_afe = [
        ["Parâmetro", "Decisão adotada", "Justificativa"],
        ["Método de extração", "Eixos principais (PAF)", "Robustez com distribuições não normais"],
        ["Método de rotação", "Oblimin (oblíqua)", "Permite correlação entre fatores (realista)"],
        ["Retenção de fatores", "Eigenvalue > 1 + scree plot", "Combinação mais robusta"],
        ["Carga mínima aceitável", ">= 0,40", "Padrao da literatura de escalas"],
        ["KMO", ">= 0,70", "Adequacao da amostra para AFE"],
        ["Teste de esfericidade", "Bartlett p < 0,001", "Confirma que matriz não é identidade"],
    ]
    story.append(tabela_simples(dados_afe, [5 * cm, 5.5 * cm, 4.5 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("4.7 Análise Fatorial Confirmatória (AFC)", s["h2"]))
    story.append(Paragraph(
        "A <b>AFC</b> testa se a estrutura dimensional encontrada na AFE se confirma em uma nova amostra. "
        "Ao contrário da AFE, a AFC exige especificação a priori do modelo: quais itens carregam em "
        "quais fatores, quais fatores se correlacionam.",
        s["body"]))
    dados_afc = [
        ["Índice de ajuste", "Threshold aceitável", "Interpretação"],
        ["CFI (Índice de Ajuste Comparativo)", ">= 0,95", "Ajuste incremental vs. modelo nulo"],
        ["RMSEA (Erro médio quadrático de aprox.)", "<= 0,06", "Erro de aproximação na população"],
        ["SRMR (Resíduo padronizado médio)", "<= 0,08", "Diferença média entre correlacoes observadas e estimadas"],
        ["AVE (Variância média extraída)", ">= 0,50", "Validade convergente — itens explicam o fator"],
        ["Critério Fornell-Larcker", "AVE > r²", "Validade discriminante entre dimensoes"],
    ]
    story.append(tabela_simples(dados_afc, [6 * cm, 4.5 * cm, 5 * cm]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("4.8 NPS — Net Promoter Score (Reichheld, 2003)", s["h2"]))
    story.append(Paragraph(
        "O <b>NPS</b> é um indicador de lealdade e satisfação baseado em uma única pergunta: "
        "<i>'Em uma escala de 0 a 10, qual a probabilidade de você recomendar esta empresa a um amigo ou familiar?'</i> "
        "Respondentes são classificados em: <b>Promotores</b> (9–10), <b>Neutros</b> (7–8) e "
        "<b>Detratores</b> (0–6). <b>NPS = %Promotores − %Detratores</b>.",
        s["body"]))
    story.append(caixa_colorida(
        Paragraph(
            "<b>Uso no TCC:</b> O NPS setorial serve como variável critério (variável dependente) "
            "na validação nomológica da escala. Se as dimensões de qualidade desenvolvidas preveem "
            "significativamente o NPS (regressão, p &lt; 0,05), a escala tem validade nomológica confirmada.",
            s["destaque"]), AZUL_CLARO, AZUL_MEDIO))
    story.append(PageBreak())

# ── PARTE V — Glossário ────────────────────────────────────────────────────
def parte_glossario(story, s):
    _banner_parte(story, "PARTE V", "Glossário e Referências Rápidas", CINZA_ESCURO)

    story.append(Paragraph("Glossário de Termos Técnicos", s["h2"]))
    termos = [
        ["Termo", "Definição"],
        ["ABNT", "Associação Brasileira de Normas Técnicas — organismo nacional de normalização"],
        ["AFC", "Análise Fatorial Confirmatória — testa estrutura dimensional hipotetizada"],
        ["AFE", "Análise Fatorial Exploratória — identifica estrutura dimensional nos dados"],
        ["AHP", "Analytic Hierarchy Process — método MCDM de comparação par a par (Saaty, 1980)"],
        ["ANOVA", "Análise de Variância — testa diferenças entre médias de 3+ grupos"],
        ["AVE", "Variância Média Extraída — mede validade convergente (threshold >= 0,50)"],
        ["B2C", "Business-to-Consumer — relação comercial entre empresa e consumidor final"],
        ["CFI", "Índice de Ajuste Comparativo na AFC (threshold >= 0,95)"],
        ["Cronbach (alfa)", "Coeficiente de confiabilidade de uma escala (threshold >= 0,70)"],
        ["Delphi", "Técnica de consulta iterativa e anônima a especialistas para gerar consenso"],
        ["GFI", "Goodness of Fit Index na AFC (threshold >= 0,90)"],
        ["HTMT", "Heterotrait-Monotrait Ratio — critério de validade discriminante no PLS-SEM"],
        ["IVC", "Índice de Validade de Conteúdo — concordância entre juízes (threshold >= 0,80)"],
        ["KMO", "Kaiser-Meyer-Olkin — adequação amostral para AFE (threshold >= 0,70)"],
        ["Likert", "Escala de resposta ordinal com pontos de ancoragem verbais (ex: 1=discordo totalmente)"],
        ["MCDM", "Multi-Criteria Decision Making — família de métodos de decisão multicritério"],
        ["NPS", "Net Promoter Score — indicador de lealdade (%Promotores - %Detratores)"],
        ["ODS", "Objetivos de Desenvolvimento Sustentável da ONU (Agenda 2030)"],
        ["PLS-SEM", "Partial Least Squares SEM — variante do SEM adequada para amostras moderadas"],
        ["PRISMA", "Protocolo para revisão sistemática da literatura e meta-análises"],
        ["RC", "Razão de Consistência no AHP — tolerância de inconsistência (<= 0,10)"],
        ["RMSEA", "Root Mean Square Error of Approximation na AFC (threshold <= 0,06)"],
        ["RSL", "Revisão Sistemática da Literatura"],
        ["SEM", "Structural Equation Modeling — modelagem de equações estruturais"],
        ["SERVQUAL", "Escala de qualidade de serviços de Parasuraman, Zeithaml e Berry (1988)"],
        ["SRMR", "Standardized Root Mean Square Residual na AFC (threshold <= 0,08)"],
        ["TIC", "Técnica do Incidente Crítico — coleta de experiências positivas/negativas específicas"],
        ["TOPSIS", "Technique for Order Preference by Similarity to Ideal Solution (Hwang & Yoon, 1981)"],
        ["Trust Score", "Índice composto do Avalia Solar combinando TOPSIS e métricas de reputação"],
    ]
    story.append(tabela_simples(termos, [4 * cm, 11.5 * cm]))
    story.append(Spacer(1, 0.6 * cm))

    story.append(Paragraph("Referências Bibliográficas Completas", s["h2"]))
    refs = [
        "AKERLOF, G. A. The market for 'lemons': quality uncertainty and the market mechanism. The Quarterly Journal of Economics, v. 84, n. 3, p. 488-500, 1970.",
        "BARDIN, L. Análise de Conteúdo. Lisboa: Edições 70, 2011.",
        "CHURCHILL, G. A. A paradigm for developing better measures of marketing constructs. Journal of Marketing Research, v. 16, n. 1, p. 64-73, 1979.",
        "FLANAGAN, J. C. The critical incident technique. Psychological Bulletin, v. 51, n. 4, p. 327-358, 1954.",
        "FORNELL, C.; LARCKER, D. F. Evaluating structural equation models with unobservable variables and measurement error. Journal of Marketing Research, v. 18, n. 1, p. 39-50, 1981.",
        "HAIR, J. F. et al. A Primer on Partial Least Squares Structural Equation Modeling (PLS-SEM). 3. ed. Thousand Oaks: Sage, 2021.",
        "HU, L.; BENTLER, P. M. Cutoff criteria for fit indexes in covariance structure analysis. Structural Equation Modeling, v. 6, n. 1, p. 1-55, 1999.",
        "HWANG, C. L.; YOON, K. Multiple Attribute Decision Making. Berlin: Springer-Verlag, 1981.",
        "KABLAN, M. M. Decision support for energy conservation promotion: an analytic hierarchy process approach. Energy Policy, v. 32, n. 10, p. 1151-1158, 2004.",
        "LIMA, G. B. A.; CARPINETTI, L. C. R. Análise de métodos de tomada de decisão multicritério aplicados à seleção de fornecedores. Gestão & Produção, v. 20, n. 2, p. 337-352, 2013.",
        "MACKENZIE, S. B.; PODSAKOFF, P. M.; PODSAKOFF, N. P. Construct measurement and validation procedures in MIS and behavioral research. MIS Quarterly, v. 35, n. 2, p. 293-334, 2011.",
        "MAYER, R. C.; DAVIS, J. H.; SCHOORMAN, F. D. An integrative model of organizational trust. Academy of Management Review, v. 20, n. 3, p. 709-734, 1995.",
        "OLIVER, R. L. A cognitive model of the antecedents and consequences of satisfaction decisions. Journal of Marketing Research, v. 17, n. 4, p. 460-469, 1980.",
        "PARASURAMAN, A.; ZEITHAML, V. A.; BERRY, L. L. SERVQUAL: a multiple-item scale for measuring consumer perceptions of service quality. Journal of Retailing, v. 64, n. 1, p. 12-40, 1988.",
        "PARASURAMAN, A.; ZEITHAML, V. A.; MALHOTRA, A. E-S-QUAL: a multiple-item scale for assessing electronic service quality. Journal of Service Research, v. 7, n. 3, p. 213-233, 2005.",
        "PARKER, G. G.; VAN ALSTYNE, M. W.; CHOUDARY, S. P. Platform Revolution. New York: W. W. Norton, 2016.",
        "PAVLOU, P. A.; FYGENSON, M. Understanding and predicting electronic commerce adoption. MIS Quarterly, v. 30, n. 1, p. 115-143, 2006.",
        "POHEKAR, S. D.; RAMACHANDRAN, M. Application of multi-criteria decision making to sustainable energy planning. Renewable and Sustainable Energy Reviews, v. 8, n. 4, p. 365-381, 2004.",
        "REICHHELD, F. F. The one number you need to grow. Harvard Business Review, v. 81, n. 12, p. 46-54, 2003.",
        "ROCHET, J. C.; TIROLE, J. Platform competition in two-sided markets. Journal of the European Economic Association, v. 1, n. 4, p. 990-1029, 2003.",
        "SAATY, T. L. The Analytic Hierarchy Process. New York: McGraw-Hill, 1980.",
        "SPENCE, M. Job market signaling. The Quarterly Journal of Economics, v. 87, n. 3, p. 355-374, 1973.",
    ]
    for i, ref in enumerate(refs):
        bg = BRANCO if i % 2 == 0 else CINZA_CLARO
        t = Table([[Paragraph(ref, ParagraphStyle("ref", fontName="Helvetica", fontSize=8.5,
                    textColor=CINZA_ESCURO, leading=13, alignment=TA_JUSTIFY))]], colWidths=[15.5 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(t)

# ── Banner de parte ────────────────────────────────────────────────────────
def _banner_parte(story, parte, titulo, cor):
    dados = [[
        Paragraph(parte, ParagraphStyle("pn", fontName="Helvetica", fontSize=10,
                  textColor=colors.HexColor("#93C5FD"), alignment=TA_CENTER)),
        Paragraph(titulo, s_global["parte_titulo"]),
    ]]
    t = Table(dados, colWidths=[2.5 * cm, 13 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), cor),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBEFORE", (1, 0), (1, -1), 1, colors.HexColor("#FFFFFF50")),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

# ── Rodapé / cabeçalho ─────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Rodapé
    canvas.setFillColor(CINZA_MEDIO)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(2 * cm, 1.5 * cm, "TCC · Engenharia de Produção · UFSC · Avalia Solar · 2026")
    canvas.drawRightString(w - 2 * cm, 1.5 * cm, f"Página {doc.page}")
    canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
    canvas.setLineWidth(0.5)
    canvas.line(2 * cm, 1.8 * cm, w - 2 * cm, 1.8 * cm)
    canvas.restoreState()

# ── Main ───────────────────────────────────────────────────────────────────
s_global = None

def main():
    global s_global
    s = build_styles()
    s_global = s

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=2 * cm,
        bottomMargin=2.5 * cm,
        title="Propostas de TCC — Avalia Solar — Metodologia de Pesquisa",
        author="Engenharia de Produção UFSC",
        subject="Metodologia de Pesquisa Científica",
    )

    story = []

    pagina_capa(story, s)
    pagina_indice(story, s)
    parte_conceitos_gerais(story, s)
    parte_proposta1(story, s)
    parte_proposta2(story, s)
    parte_proposta3(story, s)
    parte_glossario(story, s)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF gerado: {OUTPUT}")

main()
