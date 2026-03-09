"""
Policy Engine — the bridge between workflow execution and OPA.

Check points:
  - workflow_input   : before any node runs
  - inter_node       : after agent/function, before passing to next node
  - mcp_call         : before/after MCP tool invocations
  - workflow_output  : before execution is marked complete
"""
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from app.policy.opa_client import get_opa_client

logger = logging.getLogger(__name__)


class PolicyViolationError(Exception):
    """Raised when OPA denies execution at any check point."""

    def __init__(self, violations: list[str], check_point: str, node_id: str | None = None):
        self.violations  = violations
        self.check_point = check_point
        self.node_id     = node_id
        super().__init__(f"Policy violation at {check_point}: {'; '.join(violations)}")


class PolicyEngine:
    def __init__(
        self,
        workflow_id: str,
        workflow_name: str,
        execution_id: str,
        db=None,
        policies: list | None = None,
    ):
        self.workflow_id   = workflow_id
        self.workflow_name = workflow_name
        self.execution_id  = execution_id
        self.db            = db
        self.policies      = policies or []
        self.opa           = get_opa_client()

    # ── Public check methods ──────────────────────────────────

    async def check_input(self, input_data: dict) -> None:
        await self._evaluate(
            check_point = "workflow_input",
            output_text = input_data.get("message", ""),
            extra       = {"message": input_data.get("message", "")},
            node_id     = None, node_type = None, node_title = None,
        )

    async def check_inter_node(self, node_id, node_type, node_title, output_data, input_data) -> None:
        output_text = (
            output_data.get("output") or output_data.get("text")
            or output_data.get("result")
            or json.dumps(output_data, default=str)[:500]
        )
        await self._evaluate(
            check_point = "inter_node",
            output_text = output_text,
            extra = {
                "message":         input_data.get("message", ""),
                "job_description": input_data.get("job_description", ""),
                "resumes":         input_data.get("resumes", []),
                "consent":         input_data.get("consent", True),
            },
            node_id=node_id, node_type=node_type, node_title=node_title,
        )

    async def check_mcp_call(self, node_id, tool_name, arguments, result) -> None:
        await self._evaluate(
            check_point = "mcp_call",
            output_text = json.dumps(result, default=str)[:1000],
            extra       = {"tool_name": tool_name, "arguments": arguments},
            node_id=node_id, node_type="function", node_title=tool_name,
        )

    async def check_output(self, output_data: dict, input_data: dict) -> None:
        output_text = (
            output_data.get("output") or output_data.get("text")
            or json.dumps(output_data, default=str)[:500]
        )
        await self._evaluate(
            check_point = "workflow_output",
            output_text = output_text,
            extra       = {"message": input_data.get("message", "")},
            node_id=None, node_type="output", node_title="Output",
        )

    # ── Core evaluation ───────────────────────────────────────

    async def _evaluate(self, check_point, output_text, extra, node_id, node_type, node_title) -> None:
        active = [p for p in self.policies if p.enabled]
        if not active:
            return

        opa_input = self._build_input(
            check_point = check_point,
            output_text = output_text,
            node_type   = node_type or "",
            node_title  = node_title or "",
            extra       = extra,
        )

        all_violations: list[str] = []

        for policy in active:
            if policy.scope == "local":
                assigned_ids = [str(a.workflow_id) for a in (policy.assignments or [])]
                if self.workflow_id not in assigned_ids:
                    continue

            # Upload is cached — no-op if Rego unchanged
            await self.opa.upload_policy(policy.rego_code, policy_name=policy.name)
            result = await self.opa.evaluate(opa_input, policy_name=policy.name)

            allow      = result.get("allow", False)
            deny_raw   = result.get("deny", [])
            violations = list(deny_raw) if isinstance(deny_raw, (list, set)) else []

            logger.info(f"[POLICY] {check_point} | policy='{policy.name}' allow={allow} violations={violations}")

            await self._write_audit_isolated(
                policy_id   = policy.id,
                check_point = check_point,
                node_id     = node_id,
                allow       = allow,
                violations  = violations,
                opa_input   = opa_input,
            )

            if not allow or violations:
                all_violations.extend(violations)

        if all_violations:
            raise PolicyViolationError(
                violations  = all_violations,
                check_point = check_point,
                node_id     = node_id,
            )

    def _build_input(self, check_point, output_text, node_type, node_title, extra) -> dict:
        return {
            "agent":           node_title.lower().replace(" ", "_"),
            "output":          str(output_text),
            "job_description": extra.get("job_description", ""),
            "resumes":         extra.get("resumes", []),
            "consent":         extra.get("consent", True),
            "check_point":     check_point,
            "node_type":       node_type,
            "node_title":      node_title,
            "workflow_id":     self.workflow_id,
            "workflow_name":   self.workflow_name,
            "execution_id":    self.execution_id,
            "message":         extra.get("message", ""),
            "tool_name":       extra.get("tool_name", ""),
            "arguments":       extra.get("arguments", {}),
        }

    async def _write_audit_isolated(
        self,
        policy_id: uuid.UUID,
        check_point: str,
        node_id: str | None,
        allow: bool,
        violations: list[str],
        opa_input: dict,
    ) -> None:
        """
        Write the audit log in a completely independent DB session.
        This guarantees the log is committed even if the caller's session
        is rolled back due to a policy violation.
        """
        try:
            from app.database import AsyncSessionLocal
            from app.models.policy import PolicyAuditLog

            async with AsyncSessionLocal() as session:
                log = PolicyAuditLog(
                    execution_id   = uuid.UUID(self.execution_id),
                    workflow_id    = uuid.UUID(self.workflow_id),
                    node_id        = node_id,
                    policy_id      = policy_id,
                    check_point    = check_point,
                    decision       = "allow" if allow else "deny",
                    violations     = violations,
                    input_snapshot = opa_input,
                    created_at     = datetime.now(timezone.utc),
                )
                session.add(log)
                await session.commit()
        except Exception as e:
            logger.error(f"[POLICY] Audit log write failed: {e}")
