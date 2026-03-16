import re

with open('src/types/database.types.ts', 'r') as f:
    content = f.read()

rpc_addition = """      get_admin_metrics: {
        Args: Record<PropertyKey, never>
        Returns: { total_contractors: number; total_jobs: number; active_jobs: number }
      }
"""

content = re.sub(
    r'(    Functions: {\n)',
    r'\1' + rpc_addition,
    content
)

with open('src/types/database.types.ts', 'w') as f:
    f.write(content)
