#!/usr/bin/env python3
"""Avalia Solar Agent-Native CLI (cli-anything-avalia / avalia).

Follows the HKUDS/CLI-Anything 7-Phase methodology:
- Subcommand CLI + stateful interactive REPL (ReplSkin) when invoked with no subcommand
- Dual output mode: human-readable tables/status by default, strict JSON with --json
- Risk-tier governance (R0..R3) with mandatory --reason and --dry-run (Plan/Apply)
"""

from __future__ import annotations

import json
import shlex
import sys
import time
from typing import Any, Callable, Dict, Optional

import click

from cli_anything.avalia import __version__
from cli_anything.avalia.utils.avalia_backend import (
    AvaliaBackend,
    AvaliaBackendError,
    AvaliaValidationError,
    build_envelope,
)
from cli_anything.avalia.utils.repl_skin import ReplSkin


REPL_COMMANDS_HELP: Dict[str, str] = {
    "founder briefing": "Resumo matinal do Founder (filas pendentes, empresas e planos) [R0]",
    "system doctor": "Diagnóstico de saúde do PostgreSQL, conexões e API HTTP [R0]",
    "billing drift-audit": "Audita integridade dos Stripe Price IDs e planos públicos [R0]",
    "billing plans-list": "Lista catálogo de planos e contagem de empresas [R0]",
    "billing grant-plan": "Atribui plano a uma empresa com Plan/Apply (--dry-run) [R3]",
    "company health <id>": "Calcula Profile Health Score (0-100) e Next Best Actions [R0]",
    "company claims-list": "Lista solicitações de reivindicação de empresa [R0]",
    "company approve-claim <id>": "Aprova reivindicação de empresa com Plan/Apply [R2]",
    "reputation queue": "Lista avaliações pendentes de moderação [R0]",
    "reputation moderate <id>": "Aprova ou rejeita avaliação com Plan/Apply [R2]",
    "revenue upgrade-candidates": "Lista empresas Free mais quentes para upgrade comercial [R1]",
    "leads stuck": "Lista leads do marketplace aguardando atendimento [R0]",
    "curation audit": "Audita dados faltantes e duplicidades cadastrais [R1]",
    "aeo validate-storefront": "Valida prontidão de vitrines para descoberta por IA [R0]",
    "help": "Exibe esta ajuda interativa",
    "exit / quit": "Encerra o REPL interativo",
}


class CliContext:
    """Shared context passed across Click command groups."""

    def __init__(self, env: str = "local", as_json: bool = False) -> None:
        self.env = env
        self.as_json = as_json
        self.backend = AvaliaBackend(env=env)


pass_ctx = click.make_pass_decorator(CliContext)


def execute_command(
    ctx: CliContext,
    command_name: str,
    risk_tier: str,
    fn: Callable[[], Dict[str, Any]],
    human_renderer: Callable[[Dict[str, Any], ReplSkin], None],
    dry_run: bool = False,
) -> None:
    """Execute a backend operation, measure duration, and render JSON or human output."""
    t0 = time.monotonic()
    skin = ReplSkin("avalia", version=__version__)
    try:
        data = fn()
        duration_ms = round((time.monotonic() - t0) * 1000)
        if ctx.as_json:
            envelope = build_envelope(
                command=command_name,
                env=ctx.env,
                risk_tier=risk_tier,
                data=data,
                dry_run=dry_run,
                ok=True,
                duration_ms=duration_ms,
            )
            click.echo(json.dumps(envelope, ensure_ascii=False, indent=2))
        else:
            human_renderer(data, skin)
    except AvaliaValidationError as exc:
        duration_ms = round((time.monotonic() - t0) * 1000)
        if ctx.as_json:
            envelope = build_envelope(
                command=command_name,
                env=ctx.env,
                risk_tier=risk_tier,
                data={"error": "validation_error", "message": str(exc)},
                dry_run=dry_run,
                ok=False,
                duration_ms=duration_ms,
            )
            click.echo(json.dumps(envelope, ensure_ascii=False, indent=2))
        else:
            skin.error(str(exc))
        sys.exit(2)
    except (AvaliaBackendError, Exception) as exc:
        duration_ms = round((time.monotonic() - t0) * 1000)
        if ctx.as_json:
            envelope = build_envelope(
                command=command_name,
                env=ctx.env,
                risk_tier=risk_tier,
                data={"error": "backend_error", "message": str(exc)},
                dry_run=dry_run,
                ok=False,
                duration_ms=duration_ms,
            )
            click.echo(json.dumps(envelope, ensure_ascii=False, indent=2))
        else:
            skin.error(str(exc))
        sys.exit(1)


@click.group(invoke_without_command=True)
@click.option(
    "--env",
    type=click.Choice(["local", "prod"]),
    default="local",
    show_default=True,
    help="Ambiente alvo de execução (local Docker ou prod via SSH).",
)
@click.option(
    "--json",
    "as_json",
    is_flag=True,
    default=False,
    help="Emite saída determinística em JSON estruturado para consumo por agentes de IA.",
)
@click.version_option(version=__version__, prog_name="cli-anything-avalia")
@click.pass_context
def cli(click_ctx: click.Context, env: str, as_json: bool) -> None:
    """Avalia Solar 2026 — Agent-Native Founder & Backoffice CLI (CLI-Anything)."""
    click_ctx.obj = CliContext(env=env, as_json=as_json)
    if click_ctx.invoked_subcommand is None:
        click_ctx.invoke(repl)


@cli.command("repl")
@pass_ctx
def repl(ctx: CliContext) -> None:
    """Inicia o console interativo REPL do Avalia Solar OS."""
    skin = ReplSkin("avalia", version=__version__)
    skin.print_banner()
    skin.status("Ambiente", ctx.env)
    pt_session = skin.create_prompt_session()

    while True:
        try:
            line = skin.get_input(pt_session, project_name=ctx.env)
        except (EOFError, KeyboardInterrupt):
            skin.print_goodbye()
            break

        if not line:
            continue
        if line in ("exit", "quit", "q"):
            skin.print_goodbye()
            break
        if line in ("help", "?"):
            skin.help(REPL_COMMANDS_HELP)
            continue

        try:
            args = shlex.split(line)
        except ValueError as exc:
            skin.error(f"Erro de sintaxe: {exc}")
            continue

        try:
            cli.main(args=["--env", ctx.env] + args, standalone_mode=False)
        except SystemExit:
            pass
        except click.ClickException as exc:
            skin.error(exc.format_message())
        except Exception as exc:
            skin.error(str(exc))


# =============================================================================
# 1. FOUNDER GROUP
# =============================================================================
@cli.group("founder")
def founder_group() -> None:
    """Ritual diário do Founder e visão executiva 360 [R0]."""


@founder_group.command("briefing")
@pass_ctx
def founder_briefing_cmd(ctx: CliContext) -> None:
    """Resumo executivo matinal de filas pendentes, empresas e planos [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Founder Daily Briefing ({ctx.env.upper()})")
        q = data.get("queues", {})
        c = data.get("companies", {})
        skin.table(
            ["Fila Operacional", "Pendentes"],
            [
                ["Reivindicações de Empresa (Claims)", str(q.get("pending_claims", 0))],
                ["Avaliações Aguardando Moderação", str(q.get("pending_reviews", 0))],
                ["Alterações Cadastrais (PendingChanges)", str(q.get("pending_changes", 0))],
                ["Leads (Últimas 24h / Total)", f"{q.get('leads_last_24h', 0)} / {q.get('leads_total', 0)}"],
            ],
        )
        skin.status("Empresas (Ativas / Total)", f"{c.get('active', 0)} / {c.get('total', 0)}")
        skin.status("Empresas Verificadas / Pagantes", f"{c.get('verified', 0)} / {c.get('with_paid_plan', 0)}")
        skin.section("Próximas Ações Recomendadas")
        for item in data.get("recommended_founder_actions", []):
            skin.info(item)

    execute_command(ctx, "founder.briefing", "R0", ctx.backend.founder_briefing, render)


# =============================================================================
# 2. SYSTEM GROUP
# =============================================================================
@cli.group("system")
def system_group() -> None:
    """Diagnóstico de saúde da infraestrutura, banco e APIs [R0]."""


@system_group.command("doctor")
@pass_ctx
def system_doctor_cmd(ctx: CliContext) -> None:
    """Verifica conectividade e latência do PostgreSQL e API HTTP [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"System Doctor ({ctx.env.upper()})")
        db = data.get("database", {})
        api = data.get("http_api", {})
        skin.success(f"Status Geral: {data.get('status', 'unknown').upper()}")
        skin.status("Banco de Dados", f"{db.get('database_name')} ({db.get('query_latency_ms')} ms)")
        skin.status("Conexões Ativas PG", str(db.get("active_connections", 0)))
        skin.status("API HTTP", f"{api.get('url')} (reachable={api.get('reachable')})")

    execute_command(ctx, "system.doctor", "R0", ctx.backend.system_doctor, render)


# =============================================================================
# 3. BILLING GROUP
# =============================================================================
@cli.group("billing")
def billing_group() -> None:
    """Auditoria de planos, reconciliação Stripe e concessão auditada [R0/R3]."""


@billing_group.command("drift-audit")
@pass_ctx
def billing_drift_audit_cmd(ctx: CliContext) -> None:
    """Audita unicidade dos Stripe Price IDs, planos públicos e cortesias Pro [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Billing & Stripe Drift Audit ({ctx.env.upper()})")
        if data.get("status") == "healthy":
            skin.success("Nenhum drift comercial detectado nos planos públicos.")
        else:
            skin.warning(f"Foram detectadas {data.get('issues_count', 0)} divergência(s)!")
            for issue in data.get("issues", []):
                skin.error(f"[{issue['code']}] {issue['message']}")

        rows = [
            [
                str(p["id"]),
                str(p["name"]),
                f"R$ {p['price']:.2f}",
                "SIM" if p["is_public"] else "NÃO",
                str(p.get("stripe_price_id_monthly") or "-"),
                str(p.get("stripe_price_id_yearly") or "-"),
            ]
            for p in data.get("plans", [])
        ]
        skin.table(["ID", "Plano", "Preço Ref", "Público", "Stripe 6m", "Stripe 12m"], rows)

    execute_command(ctx, "billing.drift-audit", "R0", ctx.backend.billing_drift_audit, render)


@billing_group.command("plans-list")
@click.option("--public-only", is_flag=True, default=False, help="Filtra apenas planos exibidos no /pricing.")
@pass_ctx
def billing_plans_list_cmd(ctx: CliContext, public_only: bool) -> None:
    """Lista os planos cadastrados e quantidade de empresas vinculadas [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        rows = [
            [
                str(p["id"]),
                str(p["name"]),
                f"R$ {p['price']:.2f}",
                "SIM" if p["is_public"] else "NÃO",
                str(p.get("companies_count", 0)),
            ]
            for p in data.get("plans", [])
        ]
        skin.table(["ID", "Plano", "Preço", "Público", "Empresas"], rows)

    execute_command(
        ctx,
        "billing.plans-list",
        "R0",
        lambda: ctx.backend.billing_plans_list(public_only=public_only),
        render,
    )


@billing_group.command("grant-plan")
@click.option("--company", "company_id", type=int, required=True, help="ID da empresa.")
@click.option("--plan", "plan_id", type=int, required=True, help="ID do plano (ex: 1=Free, 2=Essential, 3=Pro).")
@click.option("--reason", type=str, required=True, help="Motivo obrigatório para trilha de auditoria.")
@click.option("--dry-run/--apply", default=True, show_default=True, help="Simula (Plan) ou aplica (Apply) a alteração.")
@pass_ctx
def billing_grant_plan_cmd(ctx: CliContext, company_id: int, plan_id: int, reason: str, dry_run: bool) -> None:
    """Atribui plano a uma empresa com governança Plan/Apply [R3]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        mode = "DRY-RUN (Simulação)" if dry_run else "APLICADO"
        skin.section(f"Grant Plan [{mode}]")
        skin.status("Empresa", f"{data['company_name']} (ID {data['company_id']})")
        skin.status("Antes", json.dumps(data["before"], ensure_ascii=False))
        skin.status("Depois", json.dumps(data["after"], ensure_ascii=False))
        skin.status("Motivo", data["reason"])

    execute_command(
        ctx,
        "billing.grant-plan",
        "R3",
        lambda: ctx.backend.billing_grant_plan(company_id, plan_id, reason, dry_run=dry_run),
        render,
        dry_run=dry_run,
    )


# =============================================================================
# 4. COMPANY GROUP
# =============================================================================
@cli.group("company")
def company_group() -> None:
    """Onboarding, Profile Health Score e aprovação de reivindicações [R0/R2]."""


@company_group.command("health")
@click.argument("company_id", type=int)
@click.option("--with-actions/--no-actions", default=True, show_default=True, help="Inclui recomendações NextBestAction.")
@pass_ctx
def company_health_cmd(ctx: CliContext, company_id: int, with_actions: bool) -> None:
    """Calcula o Profile Health Score (0-100) nas 5 dimensões e Next Best Actions [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Company Health: {data['name']} (ID {data['company_id']})")
        skin.status("Localização", f"{data.get('city') or '-'} / {data.get('state') or '-'}")
        skin.status("Plano / Verificada", f"{data['plan_name']} / verified={data['verified']}")
        skin.status("Health Score Geral", f"{data['score']} / 100")
        dims = data.get("dimensions", {})
        skin.table(
            ["Dimensão", "Score (0-100)"],
            [[k.capitalize(), str(v)] for k, v in dims.items()],
        )
        if data.get("next_best_actions"):
            skin.section("Next Best Actions (Priorizadas)")
            for act in data["next_best_actions"]:
                skin.info(f"[P{act['priority']} - {act['severity'].upper()}] {act['title']}")

    execute_command(
        ctx,
        "company.health",
        "R0",
        lambda: ctx.backend.company_health(company_id, with_actions=with_actions),
        render,
    )


@company_group.command("claims-list")
@click.option("--status", default="pending", show_default=True, help="Filtro de status (pending, approved, rejected).")
@pass_ctx
def company_claims_list_cmd(ctx: CliContext, status: str) -> None:
    """Lista solicitações de reivindicação de perfil de empresa [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        rows = [
            [
                str(item["id"]),
                str(item.get("company_id") or "-"),
                str(item.get("company_name") or "-"),
                str(item.get("user_email") or "-"),
                str(item.get("status") or "-"),
            ]
            for item in data.get("claims", [])
        ]
        skin.table(["Claim ID", "Company ID", "Empresa", "Usuário", "Status"], rows)

    execute_command(
        ctx,
        "company.claims-list",
        "R0",
        lambda: ctx.backend.company_claims_list(status=status),
        render,
    )


@company_group.command("approve-claim")
@click.argument("claim_id", type=int)
@click.option("--reason", type=str, required=True, help="Motivo de auditoria da aprovação.")
@click.option("--verify-badge", is_flag=True, default=False, help="Ativa também o selo verified na empresa.")
@click.option("--dry-run/--apply", default=True, show_default=True, help="Simula (Plan) ou aplica (Apply).")
@pass_ctx
def company_approve_claim_cmd(ctx: CliContext, claim_id: int, reason: str, verify_badge: bool, dry_run: bool) -> None:
    """Aprova reivindicação de titularidade de empresa com Plan/Apply [R2]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Approve Claim ID {claim_id} ({'DRY-RUN' if dry_run else 'APLICADO'})")
        skin.status("Empresa", f"{data.get('company_name')} (ID {data.get('company_id')})")
        skin.status("Solicitante", str(data.get("user_email")))
        skin.status("Antes", json.dumps(data["before"], ensure_ascii=False))
        skin.status("Depois", json.dumps(data["after"], ensure_ascii=False))

    execute_command(
        ctx,
        "company.approve-claim",
        "R2",
        lambda: ctx.backend.company_approve_claim(claim_id, reason, verify_badge=verify_badge, dry_run=dry_run),
        render,
        dry_run=dry_run,
    )


# =============================================================================
# 5. REPUTATION GROUP
# =============================================================================
@cli.group("reputation")
def reputation_group() -> None:
    """Fila e moderação assistida de avaliações (Reviews) [R0/R2]."""


@reputation_group.command("queue")
@click.option("--limit", type=int, default=20, show_default=True, help="Limite de avaliações listadas.")
@pass_ctx
def reputation_queue_cmd(ctx: CliContext, limit: int) -> None:
    """Lista avaliações pendentes de moderação [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        rows = [
            [
                str(r["id"]),
                str(r.get("company_name") or r.get("company_id")),
                f"{r.get('rating', 0):.1f}",
                str(r.get("comment_excerpt") or "")[:60],
            ]
            for r in data.get("reviews", [])
        ]
        skin.table(["Review ID", "Empresa", "Nota", "Trecho"], rows)

    execute_command(
        ctx,
        "reputation.queue",
        "R0",
        lambda: ctx.backend.reputation_queue(limit=limit),
        render,
    )


@reputation_group.command("moderate")
@click.argument("review_id", type=int)
@click.option("--action", type=click.Choice(["approve", "reject"]), required=True, help="Ação de moderação.")
@click.option("--reason", type=str, required=True, help="Motivo obrigatório para auditoria.")
@click.option("--dry-run/--apply", default=True, show_default=True, help="Simula (Plan) ou aplica (Apply).")
@pass_ctx
def reputation_moderate_cmd(ctx: CliContext, review_id: int, action: str, reason: str, dry_run: bool) -> None:
    """Aprova ou rejeita uma avaliação com Plan/Apply [R2]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Moderação de Review ID {review_id} ({'DRY-RUN' if dry_run else 'APLICADO'})")
        skin.status("Empresa", str(data.get("company_name")))
        skin.status("Antes -> Depois", f"{data['before']['status']} -> {data['after']['status']}")
        skin.status("Motivo", data["reason"])

    execute_command(
        ctx,
        "reputation.moderate",
        "R2",
        lambda: ctx.backend.reputation_moderate(review_id, action, reason, dry_run=dry_run),
        render,
        dry_run=dry_run,
    )


# =============================================================================
# 6. REVENUE GROUP
# =============================================================================
@cli.group("revenue")
def revenue_group() -> None:
    """Inteligência comercial e candidatos de upgrade Free -> Pago [R1]."""


@revenue_group.command("upgrade-candidates")
@click.option("--limit", type=int, default=10, show_default=True, help="Quantidade de empresas retornadas.")
@click.option("--state", type=str, default=None, help="Filtro opcional por UF (ex: SC, SP, MG).")
@pass_ctx
def revenue_upgrade_candidates_cmd(ctx: CliContext, limit: int, state: Optional[str]) -> None:
    """Lista empresas Free com maior atividade, reviews e sinais de intenção [R1]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        rows = [
            [
                str(c["id"]),
                str(c["name"])[:32],
                f"{c.get('city') or '-'}/{c.get('state') or '-'}",
                str(c.get("reviews_count", 0)),
                str(c.get("profile_views", 0)),
                str(c.get("commercial_heat_score", 0)),
            ]
            for c in data.get("candidates", [])
        ]
        skin.table(["ID", "Empresa", "Cidade/UF", "Reviews", "Views", "Heat Score"], rows)

    execute_command(
        ctx,
        "revenue.upgrade-candidates",
        "R1",
        lambda: ctx.backend.revenue_upgrade_candidates(limit=limit, state=state),
        render,
    )


# =============================================================================
# 7. LEADS GROUP
# =============================================================================
@cli.group("leads")
def leads_group() -> None:
    """Monitoramento de leads do marketplace [R0]."""


@leads_group.command("stuck")
@click.option("--older-than", "older_than_hours", type=int, default=2, show_default=True, help="Horas sem conclusão.")
@click.option("--limit", type=int, default=20, show_default=True)
@pass_ctx
def leads_stuck_cmd(ctx: CliContext, older_than_hours: int, limit: int) -> None:
    """Lista leads pendentes aguardando atendimento além da janela [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        rows = [
            [
                str(l["id"]),
                str(l.get("name") or "-"),
                f"{l.get('city') or '-'}/{l.get('state') or '-'}",
                str(l.get("target_company_name") or "Pool Regional"),
                str(l.get("wizard_status") or "pending"),
            ]
            for l in data.get("leads", [])
        ]
        skin.table(["Lead ID", "Cliente", "Cidade/UF", "Empresa Alvo", "Status"], rows)

    execute_command(
        ctx,
        "leads.stuck",
        "R0",
        lambda: ctx.backend.leads_stuck(older_than_hours=older_than_hours, limit=limit),
        render,
    )


# =============================================================================
# 8. CURATION GROUP
# =============================================================================
@cli.group("curation")
def curation_group() -> None:
    """Curadoria JEV 2.0, higiene cadastral e detecção de duplicidades [R1]."""


@curation_group.command("audit")
@click.option("--state", type=str, default=None, help="Filtra por UF (ex: SC, SP, MG).")
@click.option("--detect-duplicates/--no-duplicates", default=True, show_default=True)
@pass_ctx
def curation_audit_cmd(ctx: CliContext, state: Optional[str], detect_duplicates: bool) -> None:
    """Audita completude da base de empresas e detecta nomes duplicados [R1]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        s = data.get("summary", {})
        skin.section(f"Curation Quality Audit ({state or 'BRASIL'})")
        skin.status("Total de Empresas", str(s.get("total_companies", 0)))
        skin.status("Sem Telefone/WhatsApp", str(s.get("missing_phone_or_whatsapp", 0)))
        skin.status("Sem Descrição", str(s.get("missing_description", 0)))
        skin.status("Sem CNPJ", str(s.get("missing_cnpj", 0)))
        dups = data.get("duplicate_names", [])
        skin.status("Grupos de Nomes Duplicados", str(len(dups)))

    execute_command(
        ctx,
        "curation.audit",
        "R1",
        lambda: ctx.backend.curation_audit(state=state, detect_duplicates=detect_duplicates),
        render,
    )


@curation_group.command("pending-changes")
@click.option("--status", default="pending", show_default=True, help="Status (pending, approved, rejected).")
@click.option("--limit", type=int, default=30, show_default=True)
@pass_ctx
def curation_pending_changes_cmd(ctx: CliContext, status: str, limit: int) -> None:
    """Lista alterações cadastrais pendentes de aprovação (PendingChange) [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        rows = [
            [
                str(pc["id"]),
                str(pc.get("company_id") or "-"),
                str(pc.get("company_name") or "-")[:28],
                str(pc.get("change_type") or "-"),
                str(pc.get("status") or "-"),
            ]
            for pc in data.get("pending_changes", [])
        ]
        skin.table(["Change ID", "Company ID", "Empresa", "Tipo de Alteração", "Status"], rows)

    execute_command(
        ctx,
        "curation.pending-changes",
        "R0",
        lambda: ctx.backend.curation_pending_changes(status=status, limit=limit),
        render,
    )


@curation_group.command("resolve-change")
@click.argument("change_id", type=int)
@click.option("--action", type=click.Choice(["approve", "reject"]), required=True, help="Aprovar ou rejeitar alteração.")
@click.option("--reason", type=str, required=True, help="Justificativa obrigatória para auditoria.")
@click.option("--dry-run/--apply", default=True, show_default=True, help="Simula (Plan) ou aplica (Apply).")
@pass_ctx
def curation_resolve_change_cmd(ctx: CliContext, change_id: int, action: str, reason: str, dry_run: bool) -> None:
    """Aprova ou rejeita uma PendingChange cadastral com Plan/Apply [R2]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Resolve PendingChange ID {change_id} ({'DRY-RUN' if dry_run else 'APLICADO'})")
        skin.status("Empresa", f"{data.get('company_name')} (ID {data.get('company_id')})")
        skin.status("Tipo", str(data.get("change_type")))
        skin.status("Antes -> Depois", f"{data['before']['status']} -> {data['after']['status']}")
        skin.status("Motivo", data["reason"])

    execute_command(
        ctx,
        "curation.resolve-change",
        "R2",
        lambda: ctx.backend.curation_resolve_change(change_id, action, reason, dry_run=dry_run),
        render,
        dry_run=dry_run,
    )


@curation_group.command("deactivate-duplicate")
@click.argument("duplicate_id", type=int)
@click.option("--keep", "keep_id", type=int, required=True, help="ID da empresa principal que será mantida ativa.")
@click.option("--reason", type=str, required=True, help="Motivo obrigatório para desativação da duplicata.")
@click.option("--dry-run/--apply", default=True, show_default=True, help="Simula (Plan) ou aplica (Apply).")
@pass_ctx
def curation_deactivate_duplicate_cmd(
    ctx: CliContext,
    duplicate_id: int,
    keep_id: int,
    reason: str,
    dry_run: bool,
) -> None:
    """Desativa um registro de empresa duplicado mantendo a empresa master ativa [R2]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Deactivate Duplicate ID {duplicate_id} -> Keep Master ID {keep_id}")
        dup = data["duplicate_company"]
        mst = data["keep_master_company"]
        skin.status("Duplicata (Desativar)", f"ID {dup['id']} - {dup['name']} ({dup.get('city')}/{dup.get('state')})")
        skin.status("Master (Manter)", f"ID {mst['id']} - {mst['name']} ({mst.get('city')}/{mst.get('state')})")
        skin.status("Antes -> Depois", f"{data['before']['duplicate_status']} -> {data['after']['duplicate_status']}")

    execute_command(
        ctx,
        "curation.deactivate-duplicate",
        "R2",
        lambda: ctx.backend.curation_deactivate_duplicate(duplicate_id, keep_id, reason, dry_run=dry_run),
        render,
        dry_run=dry_run,
    )


# =============================================================================
# 8B. CATEGORY GROUP (TAXONOMIA & VÍNCULO DE EMPRESAS)
# =============================================================================
@cli.group("category")
def category_group() -> None:
    """Taxonomia de categorias, auditoria de vínculos e atribuição de empresas [R0/R2]."""


@category_group.command("list")
@click.option("--empty-only", is_flag=True, default=False, help="Filtra apenas categorias com 0 empresas vinculadas.")
@pass_ctx
def category_list_cmd(ctx: CliContext, empty_only: bool) -> None:
    """Lista todas as categorias, contagem real vs cacheada de empresas e SEO [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Catálogo de Categorias (Total: {data['count']} | Drift de Cache: {data['counter_cache_drift_count']})")
        rows = [
            [
                str(c["id"]),
                str(c.get("parent_id") or "-"),
                str(c["name"])[:30],
                str(c.get("seo_url") or "-")[:26],
                f"{c.get('actual_companies_count', 0)} (cache={c.get('cached_companies_count', 0)})",
                str(c.get("status") or "-"),
            ]
            for c in data.get("categories", [])
        ]
        skin.table(["ID", "Parent", "Nome", "Slug / SEO URL", "Empresas Reais", "Status"], rows)

    execute_command(
        ctx,
        "category.list",
        "R0",
        lambda: ctx.backend.category_list(empty_only=empty_only),
        render,
    )


@category_group.command("uncategorized-companies")
@click.option("--state", type=str, default=None, help="Filtra por UF (ex: SC, SP, MG).")
@click.option("--limit", type=int, default=30, show_default=True)
@pass_ctx
def category_uncategorized_companies_cmd(ctx: CliContext, state: Optional[str], limit: int) -> None:
    """Lista empresas ativas que não possuem nenhuma categoria vinculada [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Empresas Ativas Sem Categoria (Total: {data.get('total_uncategorized_active', 0)})")
        rows = [
            [
                str(c["id"]),
                str(c["name"])[:35],
                f"{c.get('city') or '-'}/{c.get('state') or '-'}",
                "SIM" if c.get("verified") else "NÃO",
            ]
            for c in data.get("companies", [])
        ]
        skin.table(["ID", "Empresa", "Cidade/UF", "Verificada"], rows)

    execute_command(
        ctx,
        "category.uncategorized-companies",
        "R0",
        lambda: ctx.backend.category_uncategorized_companies(state=state, limit=limit),
        render,
    )


@category_group.command("assign")
@click.option("--company", "company_id", type=int, required=True, help="ID da empresa.")
@click.option("--category", "category_id", type=int, required=True, help="ID da categoria.")
@click.option("--reason", type=str, required=True, help="Motivo obrigatório para auditoria.")
@click.option("--set-primary/--no-primary", default=True, show_default=True, help="Define também como primary_category_id.")
@click.option("--dry-run/--apply", default=True, show_default=True, help="Simula (Plan) ou aplica (Apply).")
@pass_ctx
def category_assign_cmd(
    ctx: CliContext,
    company_id: int,
    category_id: int,
    reason: str,
    set_primary: bool,
    dry_run: bool,
) -> None:
    """Vincula uma empresa a uma categoria e sincroniza o counter cache com Plan/Apply [R2]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Assign Category ({'DRY-RUN' if dry_run else 'APLICADO'})")
        skin.status("Empresa", f"{data['company_name']} (ID {data['company_id']})")
        skin.status("Categoria", f"{data['category_name']} (ID {data['category_id']})")
        skin.status("Antes", json.dumps(data["before"], ensure_ascii=False))
        skin.status("Depois", json.dumps(data["after"], ensure_ascii=False))

    execute_command(
        ctx,
        "category.assign",
        "R2",
        lambda: ctx.backend.category_assign(
            company_id,
            category_id,
            reason,
            set_primary=set_primary,
            dry_run=dry_run,
        ),
        render,
        dry_run=dry_run,
    )


@category_group.command("sync-counters")
@click.option("--reason", type=str, required=True, help="Motivo obrigatório para sincronizar os contadores.")
@click.option("--dry-run/--apply", default=True, show_default=True, help="Simula (Plan) ou aplica (Apply).")
@pass_ctx
def category_sync_counters_cmd(ctx: CliContext, reason: str, dry_run: bool) -> None:
    """Sincroniza companies_count cacheado de todas as categorias com categories_companies [R2]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        skin.section(f"Sync Category Counters ({'DRY-RUN' if dry_run else 'APLICADO'})")
        skin.status("Categorias Defasadas", str(data.get("drifted_categories_count", 0)))
        rows = [
            [
                str(c["id"]),
                str(c["name"])[:32],
                str(c["cached_companies_count"]),
                str(c["actual_companies_count"]),
            ]
            for c in data.get("drifted_categories", [])
        ]
        if rows:
            skin.table(["ID", "Categoria", "Cache Antes", "Real (Depois)"], rows)

    execute_command(
        ctx,
        "category.sync-counters",
        "R2",
        lambda: ctx.backend.category_sync_counters(reason=reason, dry_run=dry_run),
        render,
        dry_run=dry_run,
    )


# =============================================================================
# 9. AEO GROUP
# =============================================================================
@cli.group("aeo")
def aeo_group() -> None:
    """Validação de Storefront e Answer Engine Optimization (AEO) [R0]."""


@aeo_group.command("validate-storefront")
@click.option("--company", "company_id", type=int, default=None, help="ID opcional da empresa a validar.")
@pass_ctx
def aeo_validate_storefront_cmd(ctx: CliContext, company_id: Optional[int]) -> None:
    """Valida metadados SEO/AEO e prontidão de vitrines para agentes de IA [R0]."""

    def render(data: Dict[str, Any], skin: ReplSkin) -> None:
        rows = [
            [
                str(p["id"]),
                str(p["name"])[:30],
                str(p.get("plan_name") or "Free"),
                "OK" if p.get("has_seo_title") else "MISSING",
                str(p.get("reviews_count", 0)),
            ]
            for p in data.get("profiles", [])
        ]
        skin.table(["ID", "Empresa", "Plano", "SEO Title", "Reviews"], rows)

    execute_command(
        ctx,
        "aeo.validate-storefront",
        "R0",
        lambda: ctx.backend.aeo_validate_storefront(company_id=company_id),
        render,
    )


def main() -> None:
    """Main console_scripts entrypoint."""
    cli(prog_name="avalia")


if __name__ == "__main__":
    main()

