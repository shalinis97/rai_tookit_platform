import json
from datetime import datetime, timezone
from collections import defaultdict, deque
from app.models.execution import NodeExecutionLog
from app.core.exceptions import ExecutionError
import logging

logger = logging.getLogger(__name__)


class WorkflowEngine:
    def __init__(self, workflow, execution, db, ws_manager):
        self.workflow   = workflow
        self.execution  = execution
        self.db         = db
        self.ws_manager = ws_manager

    async def execute(self, input_data: dict) -> dict:
        nodes = {str(n.id): n for n in self.workflow.nodes}
        edges = self.workflow.edges

        logger.info("=" * 60)
        logger.info(f"[EXECUTION START] workflow='{self.workflow.name}' id={self.execution.id}")
        logger.info(f"[INPUT RECEIVED ] message={input_data.get('message', '(none)')!r}")
        if input_data.get("history"):
            logger.info(f"[INPUT HISTORY  ] {len(input_data['history'])} message(s)")
        logger.info("=" * 60)

        if not nodes:
            return {"output": "This workflow has no nodes configured.", "source": "engine"}

        # Build graph
        edges_from: dict[str, list[str]] = defaultdict(list)
        edges_to:   dict[str, list[str]] = defaultdict(list)
        in_degree:  dict[str, int]       = defaultdict(int)

        for node_id in nodes:
            in_degree.setdefault(node_id, 0)

        for edge in edges:
            frm = str(edge.from_node_id)
            to  = str(edge.to_node_id)
            edges_from[frm].append(to)
            edges_to[to].append(frm)
            in_degree[to] = in_degree.get(to, 0) + 1

        # Topological sort
        queue:      deque[str] = deque(nid for nid in nodes if in_degree.get(nid, 0) == 0)
        topo_order: list[str]  = []

        while queue:
            nid = queue.popleft()
            topo_order.append(nid)
            for neighbor in edges_from.get(nid, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(topo_order) != len(nodes):
            raise ExecutionError("Workflow contains a cycle — cannot execute")

        logger.info(f"[ENGINE] Order: {[nodes[nid].title for nid in topo_order]}")

        context:      dict[str, dict] = {}
        enriched      = {**input_data, "original": input_data}
        final_output  = {"output": "", "source": "engine"}

        for node_id in topo_order:
            node    = nodes[node_id]
            preds   = edges_to.get(node_id, [])

            if preds:
                node_input = {}
                for pid in preds:
                    if pid in context:
                        node_input.update(context[pid])
                # Always keep original chat fields accessible
                node_input["message"]  = input_data.get("message", "")
                node_input["history"]  = input_data.get("history", [])
                node_input["files"]    = input_data.get("files", [])
                node_input["original"] = input_data
            else:
                node_input = enriched

            logger.info(f"[NODE] Running '{node.title}' (type={node.type})")
            log = await self._create_log(node, node_input)

            try:
                await self._broadcast_node(node_id, "running", None)
                runner = self._get_runner(node.type)
                output = await runner.run(node.config, node_input)

                context[node_id] = output
                final_output     = output

                logger.info(f"[NODE] '{node.title}' → {json.dumps(output, default=str)[:300]}")
                await self._update_log(log, "completed", output, None)
                await self._broadcast_node(node_id, "completed", output)

            except Exception as e:
                error_msg = str(e)
                logger.error(f"[NODE] '{node.title}' FAILED: {error_msg}")
                await self._update_log(log, "failed", None, error_msg)
                await self._broadcast_node(node_id, "failed", None, error_msg)

                if node.config.get("onError", "stop") == "stop":
                    raise ExecutionError(error_msg, node_id=node_id)
                context[node_id] = {}

        logger.info("=" * 60)
        logger.info(f"[EXECUTION END  ] status=completed")
        logger.info(f"[FINAL OUTPUT   ] {json.dumps(final_output, default=str)[:600]}")
        logger.info("=" * 60)

        return final_output

    def _get_runner(self, node_type: str):
        from app.services.executor.agent_runner    import AgentRunner
        from app.services.executor.function_runner import FunctionRunner
        runners = {
            "agent":    AgentRunner(),
            "function": FunctionRunner(),
            "trigger":  _PassthroughRunner(),
            "output":   _OutputRunner(),
        }
        runner = runners.get(node_type)
        if not runner:
            raise ExecutionError(f"Unknown node type: {node_type}")
        return runner

    async def _create_log(self, node, input_data) -> NodeExecutionLog:
        log = NodeExecutionLog(
            execution_id=self.execution.id,
            node_id=node.id,
            node_type=node.type,
            node_title=node.title,
            status="running",
            input_data=input_data,
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def _update_log(self, log, status, output, error) -> None:
        log.status       = status
        log.output_data  = output
        log.error        = error
        log.completed_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def _broadcast_node(self, node_id, status, output, error=None) -> None:
        await self.ws_manager.broadcast(
            str(self.execution.id),
            {"type": "node_update", "node_id": node_id, "status": status,
             "output": output, "error": error},
        )


class _PassthroughRunner:
    async def run(self, config, input_data): return input_data

class _OutputRunner:
    async def run(self, config, input_data):
        output_text = (
            input_data.get("output") or input_data.get("text")
            or input_data.get("result") or input_data.get("message") or ""
        )
        return {
            "output":  output_text,
            "channel": config.get("channel", "console"),
            "format":  config.get("format", "json"),
            "data":    input_data,
        }
