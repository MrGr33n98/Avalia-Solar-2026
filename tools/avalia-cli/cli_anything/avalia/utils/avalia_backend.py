"""Zero-Boot backend connector and business logic for cli-anything-avalia.

Executes parameterized SQL returning JSON directly via ab0-postgres (local Docker
or remote SSH) in ~20-80ms without booting a 300MB Rails process for R0/R1 reads,
and enforces Plan/Apply (--dry-run + mandatory --reason + audit records) for R2/R3 mutations.
"""

from __future__ import annotations

import datetime
import json
import os
import shlex
import subprocess
import time
import urllib.error
import urllib.request
from typing import Any, Callable, Dict, List, Optional


VERSION = "0.1.0"
DEFAULT_PROD_SSH_TARGET = os.environ.get("AVALIA_PROD_SSH", "root@64.225.59.107")
DEFAULT_LOCAL_API_URL = os.environ.get("AVALIA_LOCAL_API_URL", "http://127.0.0.1:3001")
DEFAULT_PROD_API_URL = os.environ.get("AVALIA_PROD_API_URL", "https://api.avaliasolar.com.br")


class AvaliaBackendError(RuntimeError):
    """Raised when a backend operation fails."""


class AvaliaValidationError(ValueError):
    """Raised when command arguments or safety gates fail validation."""


def validate_reason(reason: Optional[str]) -> str:
    """Enforce mandatory audit reason on R2/R3 mutations."""
    cleaned = (reason or "").strip()
    if len(cleaned) < 5:
        raise AvaliaValidationError(
            "Operações mutáveis (R2/R3) exigem --reason com pelo menos 5 caracteres para auditoria."
        )
    return cleaned


def sql_literal(val: Any) -> str:
    """Safely format a Python scalar as a PostgreSQL literal."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, int):
        return str(val)
    if isinstance(val, float):
        return str(val)
    text = str(val).replace("'", "''")
    return f"'{text}'"


class AvaliaBackend:
    """Zero-Boot connector for Avalia Solar local and production environments."""

    def __init__(
        self,
        env: str = "local",
        runner: Optional[Callable[[str, str], str]] = None,
    ) -> None:
        if env not in ("local", "prod"):
            raise AvaliaValidationError(f"Ambiente inválido: {env}. Use 'local' ou 'prod'.")
        self.env = env
        self._custom_runner = runner

    def run_sql_json(self, sql_expr: str) -> Any:
        """Wrap a SQL query or JSON expression in row_to_json/COALESCE and parse it."""
        if self._custom_runner is not None:
            raw = self._custom_runner(self.env, sql_expr)
            return json.loads(raw) if isinstance(raw, str) else raw

        psql_script = (
            'DB_USER="${POSTGRES_USER:-postgres}"; '
            'DB_NAME="${POSTGRES_DB:-ab0_development}"; '
            'psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -t -A'
        )
        if self.env == "local":
            cmd = ["docker", "exec", "-i", "ab0-postgres", "sh", "-c", psql_script]
        else:
            remote_cmd = f"docker exec -i ab0-postgres sh -c {shlex.quote(psql_script)}"
            cmd = [
                "ssh",
                "-o",
                "BatchMode=yes",
                "-o",
                "ConnectTimeout=10",
                DEFAULT_PROD_SSH_TARGET,
                remote_cmd,
            ]

        proc = subprocess.run(
            cmd,
            input=sql_expr,
            text=True,
            capture_output=True,
            timeout=30,
            check=False,
        )
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout or "").strip()
            raise AvaliaBackendError(f"Falha ao executar SQL no ambiente '{self.env}': {err}")

        lines = [line.strip() for line in (proc.stdout or "").splitlines() if line.strip()]
        if not lines:
            return {}
        for line in reversed(lines):
            if line.startswith("{") or line.startswith("["):
                return json.loads(line)
        return json.loads(lines[-1])

    # -------------------------------------------------------------------------
    # 1. FOUNDER BRIEFING (R0)
    # -------------------------------------------------------------------------
    def founder_briefing(self) -> Dict[str, Any]:
        sql = """
        SELECT json_build_object(
          'queues', json_build_object(
            'pending_claims', (SELECT COUNT(*) FROM company_access_requests WHERE status = 'pending'),
            'pending_reviews', (SELECT COUNT(*) FROM reviews WHERE status = 0),
            'pending_changes', (SELECT COUNT(*) FROM pending_changes WHERE status = 'pending'),
            'leads_last_24h', (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '24 hours'),
            'leads_total', (SELECT COUNT(*) FROM leads)
          ),
          'companies', json_build_object(
            'total', (SELECT COUNT(*) FROM companies),
            'active', (SELECT COUNT(*) FROM companies WHERE status = 'active'),
            'verified', (SELECT COUNT(*) FROM companies WHERE verified = TRUE),
            'with_paid_plan', (SELECT COUNT(*) FROM companies c JOIN plans p ON p.id = c.plan_id WHERE p.price > 0)
          ),
          'plans_distribution', COALESCE((
            SELECT json_agg(row_to_json(t)) FROM (
              SELECT COALESCE(p.name, 'Sem Plano (NULL)') AS plan_name,
                     p.id AS plan_id,
                     COUNT(c.id) AS companies_count
              FROM companies c
              LEFT JOIN plans p ON p.id = c.plan_id
              GROUP BY p.id, p.name
              ORDER BY companies_count DESC
            ) t
          ), '[]'::json)
        )::text;
        """
        data = self.run_sql_json(sql)
        queues = data.get("queues", {})
        action_items: List[str] = []
        if queues.get("pending_claims", 0) > 0:
            action_items.append(
                f"Aprovar/analisar {queues['pending_claims']} reivindicação(ões) de empresa (avalia company claims-list)"
            )
        if queues.get("pending_reviews", 0) > 0:
            action_items.append(
                f"Moderar {queues['pending_reviews']} avaliação(ões) na fila (avalia reputation queue)"
            )
        if queues.get("pending_changes", 0) > 0:
            action_items.append(
                f"Revisar {queues['pending_changes']} alteração(ões) cadastral(is) pendente(s)"
            )
        if not action_items:
            action_items.append("Filas críticas zeradas. Focar em conversão Free -> Pago (avalia revenue upgrade-candidates).")
        data["recommended_founder_actions"] = action_items
        return data

    # -------------------------------------------------------------------------
    # 2. SYSTEM DOCTOR (R0)
    # -------------------------------------------------------------------------
    def system_doctor(self) -> Dict[str, Any]:
        t0 = time.monotonic()
        sql = """
        SELECT json_build_object(
          'postgres_ok', TRUE,
          'database_name', current_database(),
          'server_version', version(),
          'active_connections', (SELECT COUNT(*) FROM pg_stat_activity),
          'companies_count', (SELECT COUNT(*) FROM companies),
          'plans_count', (SELECT COUNT(*) FROM plans)
        )::text;
        """
        db_info = self.run_sql_json(sql)
        db_latency_ms = round((time.monotonic() - t0) * 1000, 1)

        api_url = DEFAULT_LOCAL_API_URL if self.env == "local" else DEFAULT_PROD_API_URL
        api_ok = False
        api_status = None
        try:
            req = urllib.request.Request(f"{api_url}/api/v1/billing/plans", method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                api_status = resp.status
                api_ok = 200 <= resp.status < 300
        except Exception:
            api_ok = False

        return {
            "status": "healthy" if db_info.get("postgres_ok") else "degraded",
            "database": {
                **db_info,
                "query_latency_ms": db_latency_ms,
            },
            "http_api": {
                "url": api_url,
                "reachable": api_ok,
                "http_status": api_status,
            },
        }

    # -------------------------------------------------------------------------
    # 3. BILLING DRIFT AUDIT & PLANS (R0 / R3)
    # -------------------------------------------------------------------------
    def billing_plans_list(self, public_only: bool = False) -> Dict[str, Any]:
        where_clause = "WHERE is_public = TRUE" if public_only else ""
        sql = f"""
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (
          SELECT id, name, price::float AS price, is_public, display_order,
                 stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly,
                 (SELECT COUNT(*) FROM companies c WHERE c.plan_id = plans.id) AS companies_count
          FROM plans
          {where_clause}
          ORDER BY id ASC
        ) t;
        """
        plans = self.run_sql_json(sql)
        return {"plans": plans, "count": len(plans)}

    def billing_drift_audit(self) -> Dict[str, Any]:
        sql = """
        SELECT json_build_object(
          'plans', COALESCE((
            SELECT json_agg(row_to_json(p)) FROM (
              SELECT id, name, price::float AS price, is_public,
                     stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly
              FROM plans ORDER BY id ASC
            ) p
          ), '[]'::json),
          'paid_companies_without_stripe_sub', COALESCE((
            SELECT json_agg(row_to_json(c)) FROM (
              SELECT comp.id, comp.name, comp.plan_id, pl.name AS plan_name
              FROM companies comp
              JOIN plans pl ON pl.id = comp.plan_id
              LEFT JOIN billing_company_subscriptions bcs
                ON bcs.company_id = comp.id AND bcs.status IN ('active', 'trialing')
              WHERE pl.price > 0 AND bcs.id IS NULL
              ORDER BY comp.id ASC
            ) c
          ), '[]'::json)
        )::text;
        """
        raw = self.run_sql_json(sql)
        plans = raw.get("plans", [])
        paid_without_sub = raw.get("paid_companies_without_stripe_sub", [])

        issues: List[Dict[str, Any]] = []
        seen_prices: Dict[str, int] = {}

        for p in plans:
            pid = p["id"]
            is_pub = p.get("is_public", False)
            price_val = float(p.get("price") or 0)
            m_id = (p.get("stripe_price_id_monthly") or "").strip()
            y_id = (p.get("stripe_price_id_yearly") or "").strip()

            if is_pub and price_val > 0:
                if not m_id or not y_id:
                    issues.append({
                        "severity": "high",
                        "code": "MISSING_STRIPE_PRICE_ID",
                        "plan_id": pid,
                        "message": f"Plano público pago '{p['name']}' (ID {pid}) está sem stripe_price_id_monthly ou yearly.",
                    })
                elif m_id == y_id:
                    issues.append({
                        "severity": "critical",
                        "code": "IDENTICAL_6M_12M_PRICE_ID",
                        "plan_id": pid,
                        "message": f"Plano '{p['name']}' (ID {pid}) usa o mesmo Stripe Price ID ({m_id}) para 6m e 12m.",
                    })

            for label, val in (("monthly", m_id), ("yearly", y_id)):
                if val:
                    if val in seen_prices and seen_prices[val] != pid:
                        issues.append({
                            "severity": "critical",
                            "code": "DUPLICATE_STRIPE_PRICE_ACROSS_PLANS",
                            "plan_id": pid,
                            "message": f"Stripe Price ID {val} ({label}) duplicado entre os planos {seen_prices[val]} e {pid}.",
                        })
                    seen_prices[val] = pid

        return {
            "status": "healthy" if not issues else "drift_detected",
            "issues_count": len(issues),
            "issues": issues,
            "public_plans_count": sum(1 for p in plans if p.get("is_public")),
            "plans": plans,
            "paid_companies_without_stripe_subscription": paid_without_sub,
        }

    def billing_grant_plan(
        self,
        company_id: int,
        plan_id: int,
        reason: str,
        dry_run: bool = True,
    ) -> Dict[str, Any]:
        cleaned_reason = validate_reason(reason)
        check_sql = f"""
        SELECT json_build_object(
          'company', (SELECT row_to_json(c) FROM (SELECT id, name, plan_id, plan_status FROM companies WHERE id = {int(company_id)}) c),
          'target_plan', (SELECT row_to_json(p) FROM (SELECT id, name, price::float AS price FROM plans WHERE id = {int(plan_id)}) p)
        )::text;
        """
        state = self.run_sql_json(check_sql)
        comp = state.get("company")
        tplan = state.get("target_plan")
        if not comp:
            raise AvaliaValidationError(f"Empresa ID {company_id} não encontrada.")
        if not tplan:
            raise AvaliaValidationError(f"Plano ID {plan_id} não encontrado.")

        plan_preview = {
            "action": "billing.grant-plan",
            "company_id": comp["id"],
            "company_name": comp["name"],
            "before": {"plan_id": comp.get("plan_id"), "plan_status": comp.get("plan_status")},
            "after": {"plan_id": tplan["id"], "plan_name": tplan["name"], "plan_status": "active"},
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run:
            return plan_preview

        mutate_sql = f"""
        BEGIN;
        UPDATE companies
        SET plan_id = {int(plan_id)},
            plan_status = 'active',
            updated_at = NOW()
        WHERE id = {int(company_id)};
        COMMIT;
        SELECT json_build_object('updated_company_id', {int(company_id)}, 'new_plan_id', {int(plan_id)})::text;
        """
        self.run_sql_json(mutate_sql)
        return plan_preview

    # -------------------------------------------------------------------------
    # 4. COMPANY HEALTH & CLAIMS (R0 / R2)
    # -------------------------------------------------------------------------
    def company_health(self, company_id: int, with_actions: bool = True) -> Dict[str, Any]:
        sql = f"""
        SELECT COALESCE((
          SELECT row_to_json(t) FROM (
            SELECT c.id, c.name, c.slug, c.status, c.verified, c.description,
                   c.website, c.phone, c.whatsapp, c.email_public, c.cnpj,
                   c.state, c.city, c.address, c.latitude, c.longitude,
                   c.working_hours, c.payment_methods, c.certifications,
                   c.founded_year, c.employees_count, c.social_proof_enabled,
                   c.cta_whatsapp_enabled, c.ga4_property_id, c.plan_id,
                   p.name AS plan_name,
                   COALESCE(c.reviews_count, 0) AS reviews_count,
                   COALESCE(c.rating_avg, 0)::float AS rating_avg,
                   (SELECT COUNT(*) FROM categories_companies cc WHERE cc.company_id = c.id) AS categories_count,
                   (SELECT COUNT(*) FROM reviews r WHERE r.company_id = c.id AND r.reply IS NULL) AS unreplied_reviews_count,
                   (SELECT COUNT(*) FROM active_storage_attachments a WHERE a.record_type = 'Company' AND a.record_id = c.id AND a.name = 'logo') AS has_logo,
                   (SELECT COUNT(*) FROM active_storage_attachments a WHERE a.record_type = 'Company' AND a.record_id = c.id AND a.name = 'banner') AS has_banner
            FROM companies c
            LEFT JOIN plans p ON p.id = c.plan_id
            WHERE c.id = {int(company_id)}
          ) t
        ), '{{}}'::json)::text;
        """
        c = self.run_sql_json(sql)
        if not c or not c.get("id"):
            raise AvaliaValidationError(f"Empresa ID {company_id} não encontrada.")

        # Calculate 5 dimensions matching CompanyHealthService
        profile_checks = [
            ("profile_name_present", bool(c.get("name"))),
            ("profile_description_present", bool(c.get("description"))),
            ("profile_logo_present", (c.get("has_logo") or 0) > 0),
            ("profile_banner_present", (c.get("has_banner") or 0) > 0),
            ("profile_contact_present", any(bool(c.get(k)) for k in ("website", "phone", "whatsapp", "email_public"))),
            ("profile_address_present", bool(c.get("city")) and bool(c.get("state"))),
            ("profile_cnpj_present", bool(c.get("cnpj"))),
            ("profile_categories_present", (c.get("categories_count") or 0) > 0),
        ]
        profile_score = round((sum(1 for _, ok in profile_checks if ok) / len(profile_checks)) * 100)

        rev_count = int(c.get("reviews_count") or 0)
        rating_avg = float(c.get("rating_avg") or 0.0)
        reputation_pts = (
            (35 if rev_count >= 1 else 0)
            + (25 if rev_count >= 5 else 0)
            + (20 if rating_avg >= 4.0 else 0)
            + (20 if c.get("verified") else 0)
        )

        discoverability_pts = (
            (40 if (c.get("categories_count") or 0) > 0 else 0)
            + (30 if bool(c.get("city")) and bool(c.get("state")) else 0)
            + (30 if c.get("latitude") is not None and c.get("longitude") is not None else 0)
        )

        integration_pts = (
            (50 if c.get("cta_whatsapp_enabled") or bool(c.get("whatsapp")) else 0)
            + (50 if bool(c.get("ga4_property_id")) else 0)
        )

        content_pts = (
            (50 if bool(c.get("description")) and len(str(c.get("description"))) >= 60 else 0)
            + (50 if bool(c.get("working_hours")) or bool(c.get("certifications")) else 0)
        )

        dimensions = {
            "profile": profile_score,
            "reputation": reputation_pts,
            "content": content_pts,
            "discoverability": discoverability_pts,
            "integration": integration_pts,
        }
        overall_score = round(sum(dimensions.values()) / 5.0)
        missing_items = [name.replace("_present", "_missing") for name, ok in profile_checks if not ok]

        actions: List[Dict[str, Any]] = []
        if with_actions:
            if (c.get("categories_count") or 0) == 0:
                actions.append({"id": "add_categories", "priority": 95, "severity": "high", "title": "Associe a empresa a categorias"})
            if not any(bool(c.get(k)) for k in ("website", "phone", "whatsapp", "email_public")):
                actions.append({"id": "add_contact_info", "priority": 90, "severity": "high", "title": "Adicione canais de contato (WhatsApp/Telefone)"})
            if (c.get("unreplied_reviews_count") or 0) > 0:
                actions.append({"id": "reply_to_reviews", "priority": 85, "severity": "medium", "title": f"Responda a {c['unreplied_reviews_count']} avaliação(ões) pendente(s)"})
            if not c.get("description"):
                actions.append({"id": "add_description", "priority": 80, "severity": "medium", "title": "Escreva uma descrição institucional da empresa"})
            if (c.get("has_logo") or 0) == 0:
                actions.append({"id": "add_logo", "priority": 75, "severity": "medium", "title": "Adicione a logo da empresa"})
            if rev_count < 5:
                actions.append({"id": "invite_reviews", "priority": 70, "severity": "medium", "title": "Convide clientes para atingir 5 avaliações verificadas"})

        return {
            "company_id": c["id"],
            "name": c["name"],
            "city": c.get("city"),
            "state": c.get("state"),
            "plan_id": c.get("plan_id"),
            "plan_name": c.get("plan_name") or "Free / Sem Plano",
            "verified": bool(c.get("verified")),
            "score": overall_score,
            "max_score": 100,
            "dimensions": dimensions,
            "missing_items": missing_items,
            "next_best_actions": actions,
        }

    def company_claims_list(self, status: str = "pending") -> Dict[str, Any]:
        sql = f"""
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (
          SELECT car.id, car.company_id, c.name AS company_name, car.user_id,
                 u.email AS user_email, u.name AS user_name, car.status,
                 car.message, car.created_at
          FROM company_access_requests car
          LEFT JOIN companies c ON c.id = car.company_id
          LEFT JOIN users u ON u.id = car.user_id
          WHERE car.status = {sql_literal(status)}
          ORDER BY car.created_at DESC
          LIMIT 50
        ) t;
        """
        claims = self.run_sql_json(sql)
        return {"status_filter": status, "count": len(claims), "claims": claims}

    def company_approve_claim(
        self,
        claim_id: int,
        reason: str,
        verify_badge: bool = False,
        dry_run: bool = True,
    ) -> Dict[str, Any]:
        cleaned_reason = validate_reason(reason)
        sql = f"""
        SELECT COALESCE((
          SELECT row_to_json(t) FROM (
            SELECT car.id, car.company_id, c.name AS company_name, c.verified AS company_verified,
                   car.user_id, u.email AS user_email, car.status
            FROM company_access_requests car
            LEFT JOIN companies c ON c.id = car.company_id
            LEFT JOIN users u ON u.id = car.user_id
            WHERE car.id = {int(claim_id)}
          ) t
        ), '{{}}'::json)::text;
        """
        claim = self.run_sql_json(sql)
        if not claim or not claim.get("id"):
            raise AvaliaValidationError(f"CompanyAccessRequest ID {claim_id} não encontrada.")

        preview = {
            "action": "company.approve-claim",
            "claim_id": claim["id"],
            "company_id": claim.get("company_id"),
            "company_name": claim.get("company_name"),
            "user_id": claim.get("user_id"),
            "user_email": claim.get("user_email"),
            "before": {"status": claim.get("status"), "company_verified": claim.get("company_verified")},
            "after": {
                "status": "approved",
                "company_verified": True if verify_badge else claim.get("company_verified"),
            },
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run:
            return preview

        verify_sql = (
            f"UPDATE companies SET verified = TRUE, updated_at = NOW() WHERE id = {int(claim['company_id'])};"
            if verify_badge and claim.get("company_id")
            else ""
        )
        mutate_sql = f"""
        BEGIN;
        UPDATE company_access_requests
        SET status = 'approved',
            admin_note = {sql_literal(cleaned_reason)},
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = {int(claim_id)};
        {verify_sql}
        COMMIT;
        SELECT json_build_object('approved_claim_id', {int(claim_id)})::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    def category_sync_counters(self, reason: str, dry_run: bool = True) -> Dict[str, Any]:
        cleaned_reason = validate_reason(reason)
        listing = self.category_list(empty_only=False)
        drifted = [
            {
                "id": c["id"],
                "name": c["name"],
                "cached_companies_count": c["cached_companies_count"],
                "actual_companies_count": c["actual_companies_count"],
            }
            for c in listing.get("categories", [])
            if int(c.get("cached_companies_count") or 0) != int(c.get("actual_companies_count") or 0)
        ]
        preview = {
            "action": "category.sync-counters",
            "drifted_categories_count": len(drifted),
            "drifted_categories": drifted,
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run or not drifted:
            return preview

        mutate_sql = """
        BEGIN;
        UPDATE categories cat
        SET companies_count = (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id),
            updated_at = NOW()
        WHERE COALESCE(cat.companies_count, 0) <> (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id);
        COMMIT;
        SELECT json_build_object('synced', TRUE)::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    # -------------------------------------------------------------------------
    # 5. REPUTATION & REVIEWS (R0 / R2)
    # -------------------------------------------------------------------------
    def reputation_queue(self, limit: int = 20) -> Dict[str, Any]:
        sql = f"""
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (
          SELECT r.id, r.company_id, c.name AS company_name, r.rating::float AS rating,
                 r.headline, LEFT(COALESCE(r.comment, ''), 200) AS comment_excerpt,
                 r.status, r.verified, r.capture_flow_source, r.created_at
          FROM reviews r
          LEFT JOIN companies c ON c.id = r.company_id
          WHERE r.status = 0
          ORDER BY r.created_at DESC
          LIMIT {int(limit)}
        ) t;
        """
        reviews = self.run_sql_json(sql)
        return {"pending_count": len(reviews), "reviews": reviews}

    def reputation_moderate(
        self,
        review_id: int,
        action: str,
        reason: str,
        dry_run: bool = True,
    ) -> Dict[str, Any]:
        if action not in ("approve", "reject"):
            raise AvaliaValidationError("Ação inválida: use 'approve' ou 'reject'.")
        cleaned_reason = validate_reason(reason)
        new_status = "approved" if action == "approve" else "rejected"
        new_status_int = 1 if action == "approve" else 2

        sql = f"""
        SELECT COALESCE((
          SELECT row_to_json(t) FROM (
            SELECT r.id, r.company_id, c.name AS company_name, r.rating::float AS rating,
                   r.status, LEFT(COALESCE(r.comment, ''), 140) AS comment_excerpt
            FROM reviews r
            LEFT JOIN companies c ON c.id = r.company_id
            WHERE r.id = {int(review_id)}
          ) t
        ), '{{}}'::json)::text;
        """
        rev = self.run_sql_json(sql)
        if not rev or not rev.get("id"):
            raise AvaliaValidationError(f"Review ID {review_id} não encontrada.")

        preview = {
            "action": f"reputation.{action}",
            "review_id": rev["id"],
            "company_id": rev.get("company_id"),
            "company_name": rev.get("company_name"),
            "before": {"status": rev.get("status")},
            "after": {"status": new_status, "status_code": new_status_int},
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run:
            return preview

        mutate_sql = f"""
        BEGIN;
        UPDATE reviews
        SET status = {new_status_int},
            moderation_notes = {sql_literal(cleaned_reason)},
            moderated_at = NOW(),
            updated_at = NOW()
        WHERE id = {int(review_id)};
        COMMIT;
        SELECT json_build_object('moderated_review_id', {int(review_id)}, 'status', {sql_literal(new_status)})::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    def category_sync_counters(self, reason: str, dry_run: bool = True) -> Dict[str, Any]:
        cleaned_reason = validate_reason(reason)
        listing = self.category_list(empty_only=False)
        drifted = [
            {
                "id": c["id"],
                "name": c["name"],
                "cached_companies_count": c["cached_companies_count"],
                "actual_companies_count": c["actual_companies_count"],
            }
            for c in listing.get("categories", [])
            if int(c.get("cached_companies_count") or 0) != int(c.get("actual_companies_count") or 0)
        ]
        preview = {
            "action": "category.sync-counters",
            "drifted_categories_count": len(drifted),
            "drifted_categories": drifted,
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run or not drifted:
            return preview

        mutate_sql = """
        BEGIN;
        UPDATE categories cat
        SET companies_count = (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id),
            updated_at = NOW()
        WHERE COALESCE(cat.companies_count, 0) <> (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id);
        COMMIT;
        SELECT json_build_object('synced', TRUE)::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    # -------------------------------------------------------------------------
    # 6. REVENUE UPGRADE CANDIDATES (R1)
    # -------------------------------------------------------------------------
    def revenue_upgrade_candidates(
        self,
        limit: int = 10,
        state: Optional[str] = None,
    ) -> Dict[str, Any]:
        state_filter = f"AND c.state = {sql_literal(state.upper())}" if state else ""
        sql = f"""
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (
          SELECT c.id, c.name, c.city, c.state, c.verified,
                 COALESCE(p.name, 'Free / Sem Plano') AS current_plan,
                 COALESCE(c.profile_views_count, 0) AS profile_views,
                 COALESCE(c.cta_clicks_count, 0) AS cta_clicks,
                 COALESCE(c.whatsapp_clicks_count, 0) AS whatsapp_clicks,
                 COALESCE(c.leads_count, 0) AS leads_count,
                 COALESCE(c.reviews_count, 0) AS reviews_count,
                 COALESCE((SELECT MAX(total_score) FROM intent_scores i WHERE i.company_id = c.id), 0)::float AS max_intent_score,
                 (COALESCE(c.profile_views_count, 0) + COALESCE(c.cta_clicks_count, 0) * 5 + COALESCE(c.reviews_count, 0) * 10) AS commercial_heat_score
          FROM companies c
          LEFT JOIN plans p ON p.id = c.plan_id
          WHERE (c.plan_id IS NULL OR COALESCE(p.price, 0) = 0)
            AND c.status = 'active'
            {state_filter}
          ORDER BY commercial_heat_score DESC, c.reviews_count DESC NULLS LAST, c.id ASC
          LIMIT {int(limit)}
        ) t;
        """
        candidates = self.run_sql_json(sql)
        return {"count": len(candidates), "state_filter": state, "candidates": candidates}

    # -------------------------------------------------------------------------
    # 7. LEADS STUCK (R0)
    # -------------------------------------------------------------------------
    def leads_stuck(self, older_than_hours: int = 2, limit: int = 20) -> Dict[str, Any]:
        sql = f"""
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (
          SELECT l.id, l.name, l.city, l.state, l.monthly_kwh, l.bill_value,
                 l.company_id, c.name AS target_company_name,
                 l.wizard_status, l.created_at
          FROM leads l
          LEFT JOIN companies c ON c.id = l.company_id
          WHERE l.created_at <= NOW() - INTERVAL '{int(older_than_hours)} hours'
            AND COALESCE(l.wizard_status, 'pending') NOT IN ('converted', 'closed', 'archived')
          ORDER BY l.created_at DESC
          LIMIT {int(limit)}
        ) t;
        """
        leads = self.run_sql_json(sql)
        return {"older_than_hours": older_than_hours, "count": len(leads), "leads": leads}

    # -------------------------------------------------------------------------
    # 8. CURATION AUDIT (R1)
    # -------------------------------------------------------------------------
    def curation_audit(
        self,
        state: Optional[str] = None,
        detect_duplicates: bool = True,
    ) -> Dict[str, Any]:
        state_where = f"WHERE state = {sql_literal(state.upper())}" if state else ""
        sql = f"""
        SELECT json_build_object(
          'summary', (
            SELECT row_to_json(s) FROM (
              SELECT COUNT(*) AS total_companies,
                     COUNT(*) FILTER (WHERE phone IS NULL AND whatsapp IS NULL) AS missing_phone_or_whatsapp,
                     COUNT(*) FILTER (WHERE description IS NULL OR description = '') AS missing_description,
                     COUNT(*) FILTER (WHERE city IS NULL OR state IS NULL) AS missing_location,
                     COUNT(*) FILTER (WHERE cnpj IS NULL OR cnpj = '') AS missing_cnpj
              FROM companies
              {state_where}
            ) s
          ),
          'duplicate_names', COALESCE((
            SELECT json_agg(row_to_json(d)) FROM (
              SELECT LOWER(TRIM(name)) AS normalized_name,
                     COUNT(*) AS occurrences,
                     json_agg(json_build_object('id', id, 'name', name, 'city', city, 'state', state)) AS records
              FROM companies
              {state_where}
              GROUP BY LOWER(TRIM(name))
              HAVING COUNT(*) > 1
              ORDER BY COUNT(*) DESC
              LIMIT 25
            ) d
          ), '[]'::json)
        )::text;
        """
        res = self.run_sql_json(sql)
        if not detect_duplicates:
            res.pop("duplicate_names", None)
        return res

    def curation_pending_changes(self, status: str = "pending", limit: int = 30) -> Dict[str, Any]:
        sql = f"""
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (
          SELECT pc.id, pc.company_id, c.name AS company_name, pc.user_id,
                 pc.change_type, pc.status, pc.data, pc.created_at
          FROM pending_changes pc
          LEFT JOIN companies c ON c.id = pc.company_id
          WHERE pc.status = {sql_literal(status)}
          ORDER BY pc.created_at DESC
          LIMIT {int(limit)}
        ) t;
        """
        changes = self.run_sql_json(sql)
        return {"status_filter": status, "count": len(changes), "pending_changes": changes}

    def curation_resolve_change(
        self,
        change_id: int,
        action: str,
        reason: str,
        dry_run: bool = True,
    ) -> Dict[str, Any]:
        if action not in ("approve", "reject"):
            raise AvaliaValidationError("Ação inválida: use 'approve' ou 'reject'.")
        cleaned_reason = validate_reason(reason)
        new_status = "approved" if action == "approve" else "rejected"

        sql = f"""
        SELECT COALESCE((
          SELECT row_to_json(t) FROM (
            SELECT pc.id, pc.company_id, c.name AS company_name,
                   pc.change_type, pc.status, pc.data
            FROM pending_changes pc
            LEFT JOIN companies c ON c.id = pc.company_id
            WHERE pc.id = {int(change_id)}
          ) t
        ), '{{}}'::json)::text;
        """
        pc = self.run_sql_json(sql)
        if not pc or not pc.get("id"):
            raise AvaliaValidationError(f"PendingChange ID {change_id} não encontrada.")

        preview = {
            "action": f"curation.resolve-change.{action}",
            "change_id": pc["id"],
            "company_id": pc.get("company_id"),
            "company_name": pc.get("company_name"),
            "change_type": pc.get("change_type"),
            "before": {"status": pc.get("status")},
            "after": {"status": new_status},
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run:
            return preview

        ts_col = "approved_at = NOW()" if action == "approve" else f"rejected_at = NOW(), rejection_reason = {sql_literal(cleaned_reason)}"
        mutate_sql = f"""
        BEGIN;
        UPDATE pending_changes
        SET status = {sql_literal(new_status)},
            {ts_col},
            updated_at = NOW()
        WHERE id = {int(change_id)};
        COMMIT;
        SELECT json_build_object('resolved_change_id', {int(change_id)}, 'status', {sql_literal(new_status)})::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    def category_sync_counters(self, reason: str, dry_run: bool = True) -> Dict[str, Any]:
        cleaned_reason = validate_reason(reason)
        listing = self.category_list(empty_only=False)
        drifted = [
            {
                "id": c["id"],
                "name": c["name"],
                "cached_companies_count": c["cached_companies_count"],
                "actual_companies_count": c["actual_companies_count"],
            }
            for c in listing.get("categories", [])
            if int(c.get("cached_companies_count") or 0) != int(c.get("actual_companies_count") or 0)
        ]
        preview = {
            "action": "category.sync-counters",
            "drifted_categories_count": len(drifted),
            "drifted_categories": drifted,
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run or not drifted:
            return preview

        mutate_sql = """
        BEGIN;
        UPDATE categories cat
        SET companies_count = (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id),
            updated_at = NOW()
        WHERE COALESCE(cat.companies_count, 0) <> (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id);
        COMMIT;
        SELECT json_build_object('synced', TRUE)::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    def curation_deactivate_duplicate(
        self,
        duplicate_id: int,
        keep_id: int,
        reason: str,
        dry_run: bool = True,
    ) -> Dict[str, Any]:
        if int(duplicate_id) == int(keep_id):
            raise AvaliaValidationError("O ID duplicado e o ID mantido (--keep) devem ser diferentes.")
        cleaned_reason = validate_reason(reason)

        sql = f"""
        SELECT json_build_object(
          'duplicate', (SELECT row_to_json(d) FROM (SELECT id, name, city, state, status, reviews_count FROM companies WHERE id = {int(duplicate_id)}) d),
          'master', (SELECT row_to_json(m) FROM (SELECT id, name, city, state, status, reviews_count FROM companies WHERE id = {int(keep_id)}) m)
        )::text;
        """
        pair = self.run_sql_json(sql)
        dup = pair.get("duplicate")
        master = pair.get("master")
        if not dup:
            raise AvaliaValidationError(f"Empresa duplicada ID {duplicate_id} não encontrada.")
        if not master:
            raise AvaliaValidationError(f"Empresa principal (--keep) ID {keep_id} não encontrada.")

        preview = {
            "action": "curation.deactivate-duplicate",
            "duplicate_company": dup,
            "keep_master_company": master,
            "before": {"duplicate_status": dup.get("status")},
            "after": {"duplicate_status": "inactive"},
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run:
            return preview

        mutate_sql = f"""
        BEGIN;
        UPDATE companies
        SET status = 'inactive',
            rejected_reason = {sql_literal(f"Duplicata de ID {keep_id}: {cleaned_reason}")},
            updated_at = NOW()
        WHERE id = {int(duplicate_id)};
        COMMIT;
        SELECT json_build_object('deactivated_id', {int(duplicate_id)}, 'kept_id', {int(keep_id)})::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    def category_sync_counters(self, reason: str, dry_run: bool = True) -> Dict[str, Any]:
        cleaned_reason = validate_reason(reason)
        listing = self.category_list(empty_only=False)
        drifted = [
            {
                "id": c["id"],
                "name": c["name"],
                "cached_companies_count": c["cached_companies_count"],
                "actual_companies_count": c["actual_companies_count"],
            }
            for c in listing.get("categories", [])
            if int(c.get("cached_companies_count") or 0) != int(c.get("actual_companies_count") or 0)
        ]
        preview = {
            "action": "category.sync-counters",
            "drifted_categories_count": len(drifted),
            "drifted_categories": drifted,
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run or not drifted:
            return preview

        mutate_sql = """
        BEGIN;
        UPDATE categories cat
        SET companies_count = (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id),
            updated_at = NOW()
        WHERE COALESCE(cat.companies_count, 0) <> (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id);
        COMMIT;
        SELECT json_build_object('synced', TRUE)::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    # -------------------------------------------------------------------------
    # 8B. CATEGORIES MANAGEMENT & ACTIONS (R0 / R2)
    # -------------------------------------------------------------------------
    def category_list(self, empty_only: bool = False) -> Dict[str, Any]:
        sql = """
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (
          SELECT cat.id, cat.name, cat.seo_url, cat.parent_id, cat.kind,
                 cat.status, cat.featured,
                 COALESCE(cat.companies_count, 0) AS cached_companies_count,
                 (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id) AS actual_companies_count,
                 (SELECT COUNT(*) FROM companies c WHERE c.primary_category_id = cat.id) AS primary_companies_count,
                 (cat.seo_title IS NOT NULL AND cat.seo_title <> '') AS has_seo_title
          FROM categories cat
          ORDER BY cat.parent_id NULLS FIRST, cat.id ASC
        ) t;
        """
        cats = self.run_sql_json(sql)
        if empty_only:
            cats = [c for c in cats if int(c.get("actual_companies_count") or 0) == 0]
        drift_count = sum(
            1 for c in cats if int(c.get("cached_companies_count") or 0) != int(c.get("actual_companies_count") or 0)
        )
        return {
            "count": len(cats),
            "empty_only": empty_only,
            "counter_cache_drift_count": drift_count,
            "categories": cats,
        }

    def category_uncategorized_companies(
        self,
        state: Optional[str] = None,
        limit: int = 30,
    ) -> Dict[str, Any]:
        state_filter = f"AND c.state = {sql_literal(state.upper())}" if state else ""
        sql = f"""
        SELECT json_build_object(
          'total_uncategorized_active', (
            SELECT COUNT(*)
            FROM companies c
            LEFT JOIN categories_companies cc ON cc.company_id = c.id
            WHERE c.status = 'active' AND cc.category_id IS NULL {state_filter}
          ),
          'companies', COALESCE((
            SELECT json_agg(row_to_json(t)) FROM (
              SELECT c.id, c.name, c.city, c.state, c.primary_category_id, c.verified
              FROM companies c
              LEFT JOIN categories_companies cc ON cc.company_id = c.id
              WHERE c.status = 'active' AND cc.category_id IS NULL {state_filter}
              ORDER BY c.verified DESC, c.id ASC
              LIMIT {int(limit)}
            ) t
          ), '[]'::json)
        )::text;
        """
        return self.run_sql_json(sql)

    def category_assign(
        self,
        company_id: int,
        category_id: int,
        reason: str,
        set_primary: bool = True,
        dry_run: bool = True,
    ) -> Dict[str, Any]:
        cleaned_reason = validate_reason(reason)
        sql = f"""
        SELECT json_build_object(
          'company', (SELECT row_to_json(c) FROM (SELECT id, name, city, state, primary_category_id FROM companies WHERE id = {int(company_id)}) c),
          'category', (SELECT row_to_json(cat) FROM (SELECT id, name, seo_url, status FROM categories WHERE id = {int(category_id)}) cat),
          'already_linked', EXISTS(SELECT 1 FROM categories_companies WHERE company_id = {int(company_id)} AND category_id = {int(category_id)})
        )::text;
        """
        info = self.run_sql_json(sql)
        comp = info.get("company")
        cat = info.get("category")
        if not comp:
            raise AvaliaValidationError(f"Empresa ID {company_id} não encontrada.")
        if not cat:
            raise AvaliaValidationError(f"Categoria ID {category_id} não encontrada.")

        already = bool(info.get("already_linked"))
        preview = {
            "action": "category.assign",
            "company_id": comp["id"],
            "company_name": comp["name"],
            "category_id": cat["id"],
            "category_name": cat["name"],
            "before": {
                "already_linked": already,
                "primary_category_id": comp.get("primary_category_id"),
            },
            "after": {
                "linked": True,
                "primary_category_id": cat["id"] if set_primary else comp.get("primary_category_id"),
            },
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run:
            return preview

        insert_link_sql = (
            ""
            if already
            else f"INSERT INTO categories_companies (company_id, category_id) VALUES ({int(company_id)}, {int(category_id)});"
        )
        primary_sql = (
            f"UPDATE companies SET primary_category_id = {int(category_id)}, updated_at = NOW() WHERE id = {int(company_id)};"
            if set_primary
            else ""
        )
        sync_counter_sql = f"""
        UPDATE categories
        SET companies_count = (SELECT COUNT(*) FROM categories_companies WHERE category_id = {int(category_id)}),
            updated_at = NOW()
        WHERE id = {int(category_id)};
        """
        mutate_sql = f"""
        BEGIN;
        {insert_link_sql}
        {primary_sql}
        {sync_counter_sql}
        COMMIT;
        SELECT json_build_object('assigned', TRUE, 'company_id', {int(company_id)}, 'category_id', {int(category_id)})::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    def category_sync_counters(self, reason: str, dry_run: bool = True) -> Dict[str, Any]:
        cleaned_reason = validate_reason(reason)
        listing = self.category_list(empty_only=False)
        drifted = [
            {
                "id": c["id"],
                "name": c["name"],
                "cached_companies_count": c["cached_companies_count"],
                "actual_companies_count": c["actual_companies_count"],
            }
            for c in listing.get("categories", [])
            if int(c.get("cached_companies_count") or 0) != int(c.get("actual_companies_count") or 0)
        ]
        preview = {
            "action": "category.sync-counters",
            "drifted_categories_count": len(drifted),
            "drifted_categories": drifted,
            "reason": cleaned_reason,
            "applied": not dry_run,
        }
        if dry_run or not drifted:
            return preview

        mutate_sql = """
        BEGIN;
        UPDATE categories cat
        SET companies_count = (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id),
            updated_at = NOW()
        WHERE COALESCE(cat.companies_count, 0) <> (SELECT COUNT(*) FROM categories_companies cc WHERE cc.category_id = cat.id);
        COMMIT;
        SELECT json_build_object('synced', TRUE)::text;
        """
        self.run_sql_json(mutate_sql)
        return preview

    # -------------------------------------------------------------------------
    # 9. AEO VALIDATE STOREFRONT (R0)
    # -------------------------------------------------------------------------
    def aeo_validate_storefront(self, company_id: Optional[int] = None) -> Dict[str, Any]:
        target_filter = f"WHERE c.id = {int(company_id)}" if company_id else "WHERE c.status = 'active'"
        sql = f"""
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (
          SELECT c.id, c.name, c.slug, c.city, c.state, c.verified,
                 p.name AS plan_name,
                 (c.seo_title IS NOT NULL AND c.seo_title <> '') AS has_seo_title,
                 (c.meta_description IS NOT NULL AND c.meta_description <> '') AS has_meta_description,
                 COALESCE(c.reviews_count, 0) AS reviews_count,
                 COALESCE(c.rating_avg, 0)::float AS rating_avg
          FROM companies c
          LEFT JOIN plans p ON p.id = c.plan_id
          {target_filter}
          ORDER BY c.verified DESC, c.reviews_count DESC NULLS LAST
          LIMIT 5
        ) t;
        """
        samples = self.run_sql_json(sql)
        return {
            "storefront_ready": len(samples) > 0,
            "evaluated_profiles_count": len(samples),
            "profiles": samples,
        }


def build_envelope(
    command: str,
    env: str,
    risk_tier: str,
    data: Any,
    dry_run: bool = False,
    ok: bool = True,
    duration_ms: int = 0,
) -> Dict[str, Any]:
    """Build the canonical CLI-Anything JSON output envelope."""
    return {
        "ok": ok,
        "command": command,
        "env": env,
        "risk_tier": risk_tier,
        "dry_run": dry_run,
        "data": data,
        "meta": {
            "duration_ms": duration_ms,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "version": VERSION,
        },
    }
