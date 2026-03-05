class NotFoundError(Exception):
    """Raised when a requested resource does not exist."""
    def __init__(self, resource: str, id: str):
        self.resource = resource
        self.id = id
        super().__init__(f"{resource} with id={id} not found")


class DuplicateError(Exception):
    """Raised when a unique constraint would be violated."""
    def __init__(self, message: str):
        super().__init__(message)


class ValidationError(Exception):
    """Raised when business logic validation fails."""
    def __init__(self, message: str):
        super().__init__(message)


class ExecutionError(Exception):
    """Raised when workflow execution fails."""
    def __init__(self, message: str, node_id: str | None = None):
        self.node_id = node_id
        super().__init__(message)
