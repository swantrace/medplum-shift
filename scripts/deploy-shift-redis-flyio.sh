#!/bin/bash
set -euo pipefail

# Display usage information
function show_usage() {
  echo "Usage: $0 [app_name]"
  echo "  app_name: Custom Fly.io app name (optional, defaults to medplum-redis)"
  echo ""
  exit 1
}

# Show help if requested
if [[ "$#" -gt 0 && ("$1" == "-h" || "$1" == "--help") ]]; then
  show_usage
fi

# Constants
SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
REDIS_DIR=$(cd "$SCRIPT_DIR/../redis" && pwd)
TEMP_DIR=$(mktemp -d)
DEFAULT_APP_NAME="medplum-redis"

# Allow custom app name as command-line argument
APP_NAME=${1:-$DEFAULT_APP_NAME}

echo "Preparing redis deployment for Fly.io (app: $APP_NAME)..."

# Create temporary deployment directory
mkdir -p $TEMP_DIR

# Create Dockerfile on the fly
cat > "$TEMP_DIR/Dockerfile" << 'EOF'
FROM redis:7

# Copy the entrypoint script into the image
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint to run the script
ENTRYPOINT ["/entrypoint.sh"]
EOF

# Create entrypoint.sh on the fly
cat > "$TEMP_DIR/entrypoint.sh" << 'EOF'
#!/bin/sh

# Set vm.overcommit_memory to 1
echo "Setting vm.overcommit_memory to 1"
if ! echo 1 > /proc/sys/vm/overcommit_memory; then
  echo "Failed to set vm.overcommit_memory (might be restricted by Fly.io)"
else
  echo "Successfully set vm.overcommit_memory"
fi

# Verify the setting (optional, for logging)
cat /proc/sys/vm/overcommit_memory

# Start Redis with the same command Fly.io uses
exec redis-server --requirepass medplum --port 6379
EOF

# Make entrypoint.sh executable
chmod +x "$TEMP_DIR/entrypoint.sh"

# Create fly.toml on the fly
cat > "$TEMP_DIR/fly.toml" << EOF
# fly.toml app configuration file
app = '$APP_NAME'
primary_region = 'iad'

[build]
  dockerfile = 'Dockerfile'

[processes]
  app = 'sh /entrypoint.sh'

[[services]]
  protocol = 'tcp'
  internal_port = 6379
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1
  ports = []
  processes = ['app']

  [services.concurrency]
    type = 'connections'
    hard_limit = 25
    soft_limit = 20

[[vm]]
  size = 'shared-cpu-2x'
  memory = '2gb'
  cpus = 2
EOF

echo "Deploying redis to Fly.io..."

# Deploy to Fly.io
cd $TEMP_DIR
flyctl deploy --app $APP_NAME

# Cleanup temporary directory
rm -rf $TEMP_DIR

echo "Redis deployment completed successfully"
