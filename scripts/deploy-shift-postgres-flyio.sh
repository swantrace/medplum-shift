#!/bin/bash
set -euo pipefail

# Display usage information
function show_usage() {
  echo "Usage: $0 [app_name]"
  echo "  app_name: Custom Fly.io app name (optional, defaults to medplum-postgres)"
  echo ""
  exit 1
}

# Show help if requested
if [[ "$#" -gt 0 && ("$1" == "-h" || "$1" == "--help") ]]; then
  show_usage
fi

# Constants
SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
POSTGRES_DIR=$(cd "$SCRIPT_DIR/../postgres" && pwd)
TEMP_DIR=$(mktemp -d)
DEFAULT_APP_NAME="medplum-postgres"

# Allow custom app name as command-line argument
APP_NAME=${1:-$DEFAULT_APP_NAME}

echo "Preparing postgres deployment for Fly.io (app: $APP_NAME)..."

# Create temporary deployment directory structure
mkdir -p $TEMP_DIR/init-scripts

# Copy only the tracked files we want to keep after deployment
if [ -f "$POSTGRES_DIR/init_test.sql" ]; then
  cp "$POSTGRES_DIR/init_test.sql" "$TEMP_DIR/"
fi
if [ -f "$POSTGRES_DIR/postgres.conf" ]; then
  cp "$POSTGRES_DIR/postgres.conf" "$TEMP_DIR/"
fi

# Create Dockerfile on the fly
cat > "$TEMP_DIR/Dockerfile" << 'EOF'
FROM postgres:16

# Copy configuration and initialization scripts
COPY postgres.conf /usr/local/etc/postgres/postgres.conf
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# Set command to use custom config
CMD ["postgres", "-c", "config_file=/usr/local/etc/postgres/postgres.conf"]
EOF

# Create fly.toml on the fly
cat > "$TEMP_DIR/fly.toml" << EOF
# fly.toml app configuration file
app = '$APP_NAME'
primary_region = 'iad'

[build]
  dockerfile = 'Dockerfile'

[env]
  POSTGRES_PASSWORD = 'medplum'
  POSTGRES_USER = 'medplum'

[[services]]
  protocol = 'tcp'
  internal_port = 5432
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1
  ports = []

  [services.concurrency]
    type = 'connections'
    hard_limit = 25
    soft_limit = 20

[[vm]]
  size = 'shared-cpu-2x'
  memory = '2gb'
  cpus = 2
EOF

echo "Deploying postgres to Fly.io..."

# Deploy to Fly.io
cd $TEMP_DIR
flyctl deploy --app $APP_NAME

# Cleanup temporary directory
rm -rf $TEMP_DIR

echo "Postgres deployment completed successfully"
