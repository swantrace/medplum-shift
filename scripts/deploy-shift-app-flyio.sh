#!/bin/bash
set -e

# Default application names
SERVER_APP_NAME="medplum-backend"
APP_NAME="medplum-admin"

# Parse command line arguments
while getopts "n:a:" opt; do
  case $opt in
    n) SERVER_APP_NAME="$OPTARG" ;;
    a) APP_NAME="$OPTARG" ;;
    \?) echo "Invalid option -$OPTARG" >&2; exit 1 ;;
  esac
done

echo "Using server app name: $SERVER_APP_NAME"
echo "Using client app name: $APP_NAME"

# Navigate to the repository root
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Create build-specific environment file for Vite
cd packages/app
cat > .env.production << EOL
MEDPLUM_BASE_URL=https://${SERVER_APP_NAME}.fly.dev/
RECAPTCHA_SITE_KEY=6LfHdsYdAAAAAC0uLnnRrDrhcXnziiUwKd8VtLNq
MEDPLUM_REGISTER_ENABLED=true
EOL

# Make sure the .env file uses the same production values
cp .env.production .env

# Clean turbo cache to ensure a fresh build
echo "Cleaning turbo cache..."
npx turbo clean

# Build the app with these environment variables
echo "Building medplum-app with production environment..."
NODE_ENV=production npm run build -- --mode production

# Create tarball of the build
tar -czf medplum-app.tar.gz -C dist .

# Create a temporary Dockerfile for Fly.io
cat > Dockerfile.flyio << EOL
FROM nginxinc/nginx-unprivileged:alpine

# Start off as user root so we have permissions
USER root

# Copy nginx configuration
COPY nginx.flyio.conf /etc/nginx/conf.d/default.conf

# Copy and extract the app tarball
ADD ./medplum-app.tar.gz /usr/share/nginx/html

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

# Update fly.toml with same environment variables (for consistency)
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

[env]
  MEDPLUM_BASE_URL = "https://${SERVER_APP_NAME}.fly.dev/"
  RECAPTCHA_SITE_KEY = "6LfHdsYdAAAAAC0uLnnRrDrhcXnziiUwKd8VtLNq"
  MEDPLUM_REGISTER_ENABLED = "true"

[[vm]]
  memory = '2gb'
  cpu_kind = 'shared'
  cpus = 2
EOL

# Deploy to Fly.io
if command -v flyctl &> /dev/null || command -v fly &> /dev/null; then
    FLY_CMD=$(command -v flyctl || command -v fly)
    echo "Deploying ${APP_NAME} to Fly.io..."
    
    # Check if app exists, if not create it
    if ! $FLY_CMD apps list | grep -q "${APP_NAME}"; then
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
rm -f medplum-app.tar.gz Dockerfile.flyio nginx.flyio.conf .env.production fly.toml .env

echo "Done!"