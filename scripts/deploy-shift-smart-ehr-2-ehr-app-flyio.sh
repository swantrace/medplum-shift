#!/bin/bash
set -e

# This script deploys the Shift EHR-2-EHR demo app to Fly.io
# 
# Usage:
#   ./deploy-shift-smart-ehr-2-ehr-app-flyio.sh [-n server-app-name] [-a app-name] [-e env-file-name]
#
# Options:
#   -n  Server app name (default: medplum-backend)
#   -a  Client app name (default: shift-ehr-2-ehr-demo)
#   -e  Environment file name without .env. prefix (default: production)
#       Script will use .env.[name] file, e.g. .env.production

# Default application names
SERVER_APP_NAME="medplum-backend"
APP_NAME="shift-ehr-2-ehr-demo"
ENV_FILE=""  # Will be determined later

# Parse command line arguments
while getopts "n:a:e:" opt; do
  case $opt in
    n) SERVER_APP_NAME="$OPTARG" ;;
    a) APP_NAME="$OPTARG" ;;
    e) ENV_FILE="$OPTARG" ;;
    \?) echo "Invalid option -$OPTARG" >&2; exit 1 ;;
  esac
done

echo "Using server app name: $SERVER_APP_NAME"
echo "Using client app name: $APP_NAME"

# Navigate to the repository root
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Navigate to the example directory
EXAMPLE_DIR="$REPO_ROOT/examples/shift-ehr-2-ehr-demo"
if [ ! -d "$EXAMPLE_DIR" ]; then
  echo "Error: Example directory not found: $EXAMPLE_DIR"
  exit 1
fi

cd "$EXAMPLE_DIR"

# If ENV_FILE is not explicitly set, try to use APP_NAME first, then fall back to production
if [ -z "$ENV_FILE" ]; then
  # Check if .env.APP_NAME exists
  if [ -f ".env.${APP_NAME}" ]; then
    ENV_FILE="${APP_NAME}"
    echo "Found .env.${APP_NAME}, using it as environment file."
  else
    ENV_FILE="production"
    echo "No environment file specified and .env.${APP_NAME} not found, defaulting to .env.production."
  fi
fi

echo "Using environment file: .env.${ENV_FILE}"

# Check if the specified .env file exists
ENV_FILE_PATH=".env.${ENV_FILE}"
if [ ! -f "$ENV_FILE_PATH" ]; then
  echo "Error: Environment file $ENV_FILE_PATH not found."
  echo "Please create this file first with appropriate environment variables."
  exit 1
else
  # Make a backup of the original environment file
  cp "$ENV_FILE_PATH" "${ENV_FILE_PATH}.backup"
  
  # Update MEDPLUM_BASE_URL in the environment file
  if grep -q "MEDPLUM_BASE_URL=" "$ENV_FILE_PATH"; then
    # Replace existing MEDPLUM_BASE_URL line
    sed -i "s|MEDPLUM_BASE_URL=.*|MEDPLUM_BASE_URL=https://${SERVER_APP_NAME}.fly.dev/|" "$ENV_FILE_PATH"
  else
    # Add MEDPLUM_BASE_URL if it doesn't exist
    echo "MEDPLUM_BASE_URL=https://${SERVER_APP_NAME}.fly.dev/" >> "$ENV_FILE_PATH"
  fi
fi

# Make sure the .env file uses the same values
cp "$ENV_FILE_PATH" .env

# Clean turbo cache to ensure a fresh build
echo "Cleaning turbo cache..."
npx turbo clean

# Build the app with these environment variables
echo "Building shift-ehr-2-ehr-demo with ${ENV_FILE} environment..."
NODE_ENV=$ENV_FILE npm run build -- --mode $ENV_FILE

# Create tarball of the build
BUILD_DIR="dist"
if [ ! -d "$BUILD_DIR" ]; then
  BUILD_DIR="build"  # Alternative build directory name
fi

if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: Build directory not found. Please check your build configuration."
  exit 1
fi

tar -czf app-build.tar.gz -C "$BUILD_DIR" .

# Create a temporary Dockerfile for Fly.io
cat > Dockerfile.flyio << EOL
FROM nginxinc/nginx-unprivileged:alpine

# Start off as user root so we have permissions
USER root

# Copy nginx configuration
COPY nginx.flyio.conf /etc/nginx/conf.d/default.conf

# Copy and extract the app tarball
ADD ./app-build.tar.gz /usr/share/nginx/html

# Grant ownership of the html dir to the nginx default user/group
RUN chown -R 101:101 /usr/share/nginx/html

# Switch back to the 101 UID (non-root user)
USER 101

# Fly.io uses port 8080 by default
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
EOL

# Create nginx config for Fly.io
cat > nginx.flyio.conf << EOL
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
EOL

# Update fly.toml with appropriate settings
cat > fly.toml << EOL
app = '${APP_NAME}'
primary_region = 'iad'

[build]
  dockerfile = 'Dockerfile.flyio'

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1
  processes = ['app']

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
EOL

# Deploy to Fly.io
if command -v flyctl &> /dev/null || command -v fly &> /dev/null; then
    FLY_CMD=$(command -v flyctl || command -v fly)
    echo "Deploying ${APP_NAME} to Fly.io..."
    # Check if the app already exists
    if ! $FLY_CMD apps list 2>/dev/null | awk -v app="${APP_NAME}" '$1 == app {found=1} END {exit !found}'; then
        echo "Creating new Fly.io app..."
        $FLY_CMD launch --no-deploy --dockerfile Dockerfile.flyio --name "${APP_NAME}"
    fi
    
    # Deploy the app
    $FLY_CMD deploy --dockerfile Dockerfile.flyio --app "${APP_NAME}"
    
    echo "Deployment completed successfully!"
else
    echo "Error: Fly.io CLI not found. Please install it with:"
    echo "  curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Clean up
echo "Cleaning up..."
rm -f app-build.tar.gz Dockerfile.flyio nginx.flyio.conf .env fly.toml

# Restore original environment file if a backup was made
if [ -f "${ENV_FILE_PATH}.backup" ]; then
  echo "Restoring original environment file: $ENV_FILE_PATH"
  mv "${ENV_FILE_PATH}.backup" "$ENV_FILE_PATH"
fi

echo "Done!"