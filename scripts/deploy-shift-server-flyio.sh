#!/bin/bash
set -e

# Default application names
SERVER_APP_NAME="medplum-backend"
APP_NAME="medplum-admin"
POSTGRES_APP_NAME="medplum-postgres"
REDIS_APP_NAME="medplum-redis"

# Parse command line arguments
while getopts "n:a:p:r:" opt; do
  case $opt in
    n) SERVER_APP_NAME="$OPTARG" ;;
    a) APP_NAME="$OPTARG" ;;
    p) POSTGRES_APP_NAME="$OPTARG" ;;
    r) REDIS_APP_NAME="$OPTARG" ;;
    \?) echo "Invalid option -$OPTARG" >&2; exit 1 ;;
  esac
done

echo "Using server app name: $SERVER_APP_NAME"
echo "Using client app name: $APP_NAME"
echo "Using postgres app name: $POSTGRES_APP_NAME"
echo "Using redis app name: $REDIS_APP_NAME"

# Navigate to the repository root
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Clean turbo cache to ensure a fresh build
echo "Cleaning turbo cache..."
npx turbo clean

# Build at the root level using the fast build option
echo "Building medplum-server at root level..."
NODE_ENV=production npm run build:fast

# Move to the server directory
cd packages/server

# Create temporary fly.toml in server directory
echo "Creating temporary deployment files..."
cat > fly.toml << EOL
# fly.toml app configuration file

app = '${SERVER_APP_NAME}'
primary_region = 'iad'

[build]
  dockerfile = "Dockerfile"

[env]
  MEDPLUM_CONFIG_SOURCE = "env"
  MEDPLUM_PORT = "8103"
  MEDPLUM_BASE_URL = "https://${SERVER_APP_NAME}.fly.dev/"
  MEDPLUM_APP_BASE_URL = "https://${APP_NAME}.fly.dev/"
  MEDPLUM_BINARY_STORAGE = "file:./binary/"
  MEDPLUM_STORAGE_BASE_URL = "https://${SERVER_APP_NAME}.fly.dev/storage/"
  MEDPLUM_SIGNING_KEY_ID = "my-key-id"
  MEDPLUM_SIGNING_KEY = "-----BEGIN RSA PRIVATE KEY-----\nProc-Type: 4,ENCRYPTED\nDEK-Info: DES-EDE3-CBC,4C2E1B45FFF24610\n\n0SOZn3P0Bd9lZgv2eSWWLMQ4JqxhbJ+dWM+V1TtSwqxe3VP24z4bys5VRpmsEpqn\nROKxdXCeqAbYsLo8V9dOQvwaxo2TTWFgUFj7sQYklyr1g5S9+KCp+1B/5E7UgNDd\nhXA2u4uhz6Bck0mTPwoy3oHjNUaNBZilMdwiR3qeiGYC0DyX69+IJgwFUTt2a1jc\nU5aUyellGYa47QRZcePgyk7Cl4FcBW9YA0pS4rNpO4wNVN6GGuZti4c0Y3PHXSRE\nDse95ZN9iWBtufjpjk4s8MX0rzqMWcjbAhTs2N5YBgKsv2czm5YMdXsYH6tGL7a1\nPyNia0r1AnHAD3pK+vzaZGaLrvubZikrt7dr+Tp1U45b2YaZlMMaXwGU6WEK7kwr\n4sbl9hqQf/+oqBAdyJIgxIhFumK+ukUIlCV+b/XUuoatDXD127JwEyEM78Nzg5Bc\n/bKGEo9uehXpuIi0jp1BtegUIkfoV543PZZgslGVdzq0vXOir+PiHJBLlbWXXSAb\nEWKOQW2/bZ8JIHhi3Ag7KDlTVF1XetJ2TqYOOP9izfMp4lJ2vLtkH7P+jEKG8z6b\nurnXYkDWYEbzhG1frEssVQN0GP3wdyEK+n6LBCuj52Uje/M7LwahPX6dJRYPOpL9\nbApSNNJLahRRQREHp1wqEWism3r4+yRa4ha/BGc4dfKTsUtJEiHqdWvDzomN5C6A\nC7u3zjUv3ZZLoCLCbBUsiVdlJZJ5u/ymky5LKVbsscmZj93HE7/FL56I17bmTlDo\npvkJWk9SmVXvs3lwMMBRbykj974ZWEMw9EjCoP9rDJ0UNsy2kVRFfXoPMKL5S01D\niBRVSZB7k7qJofGtlBpDfooHOw4uAJ/6A0l8vpOm/Vpk8tdiRLL/RuzEKz5G3ltm\nrXPn83avfNc5+EvaM8IIKyPTvHegE5XszGK3NNlzUO1Ydze/xQPhdrp4QYFzJOuB\nXVIazLeXSJ5EjJ1ylWAWgNzsx+42NWeA2CZAZz+IJFw6C2iHEB8f8Nw6iJmFfm3I\nWsrvCRbuwIsW9fjtHTpOCCpxXu5EcvN5BKwFXeBatB7xqR6EnPbk6xDxZdroEKhH\nEZU4PlHu+BwTKKCwa4Ynwn1Qpu453qgNzaxgHLbdFipW5/AkreNWK5Il+5Bl8G90\no/MhO66eBXv3JbOtMUAqs9+Qyl5K1TaNqbStWmsiq+36Niz4ZRg7L/7W6zjG/hTH\npignoDyJYPjFFQ/sTsTUv0oKVI6KIYFlIHBDnGGnH09926sd+U/isSeMDP+Qa32m\nhHzScmDPsdyjdFsdXsJjZHe7mqCijGXu/LW4CoWoqln4y29c5BMJazwnIwegrLjJ\nQeW6InUhGZLy+uJbs1ZWxlqzOmMoTx2VVgoABdOHn/mQEC/AreUdvPMkVVYEuxel\nmAMOoefncx/EPxn7gY2SrEdmSnk9VuzR30KMC1qSw196QbQHR1G2vxKcXPwe/LH9\n7Pa0gwwqCaS2ggYt5Rvlxm7DeBIGHzGtPILnl1qyVGaqn64244JeLi9bY/O+E+uq\nBSgQmt2NwPK2RQgzzt/ETUXoOFHKiwS1v2Vp4H2PPDI8CzvlRralsQ==\n-----END RSA PRIVATE KEY-----"
  MEDPLUM_SIGNING_KEY_PASSPHRASE = "top_secret"
  MEDPLUM_SUPPORT_EMAIL = "\"Medplum\" <support@medplum.com>"
  MEDPLUM_GOOGLE_CLIENT_ID = "397236612778-c0b5tnjv98frbo1tfuuha5vkme3cmq4s.apps.googleusercontent.com"
  MEDPLUM_GOOGLE_CLIENT_SECRET = ""
  MEDPLUM_ADMIN_CLIENT_ID = "2a4b77f2-4d4e-43c6-9b01-330eb5ca772f"
  MEDPLUM_MAX_JSON_SIZE = "1mb"
  MEDPLUM_MAX_BATCH_SIZE = "50mb"
  MEDPLUM_BOT_LAMBDA_ROLE_ARN = ""
  MEDPLUM_BOT_LAMBDA_LAYER_NAME = "medplum-bot-layer"
  MEDPLUM_VM_CONTEXT_BOTS_ENABLED = "true"
  MEDPLUM_DEFAULT_BOT_RUNTIME_VERSION = "vmcontext"
  MEDPLUM_ALLOWED_ORIGINS = "*"
  MEDPLUM_INTROSPECTION_ENABLED = "true"
  MEDPLUM_DATABASE_HOST = "${POSTGRES_APP_NAME}.internal"
  MEDPLUM_DATABASE_PORT = "5432"
  MEDPLUM_DATABASE_DBNAME = "medplum"
  MEDPLUM_DATABASE_USERNAME = "medplum"
  MEDPLUM_DATABASE_PASSWORD = "medplum"
  MEDPLUM_REDIS_FAMILY = "6"
  MEDPLUM_REDIS_HOST = "${REDIS_APP_NAME}.internal"
  MEDPLUM_REDIS_PORT = "6379"
  MEDPLUM_REDIS_PASSWORD = "medplum"
  MEDPLUM_REDIS_MAX_RETRIES_PER_REQUEST = "5"
  MEDPLUM_REDIS_CONNECT_TIMEOUT = "5000"
  MEDPLUM_BULLMQ_REMOVE_ON_FAIL = "{\"count\": 1}"
  MEDPLUM_BULLMQ_REMOVE_ON_COMPLETE = "{\"count\": 1}"
  MEDPLUM_SHUTDOWN_TIMEOUT_MILLISECONDS = "30000"

[http_service]
  internal_port = 8103
  force_https = true
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1
  processes = ['app']

  [http_service.concurrency]
    type = "requests"
    soft_limit = 200
    hard_limit = 250

  [[http_service.checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/healthcheck"
    protocol = "http"

[[vm]]
  memory = '2gb'
  cpu_kind = 'shared'
  cpus = 2
EOL

# Create temporary Dockerfile in server directory
cat > Dockerfile << EOL
# syntax = docker/dockerfile:1

FROM node:20.17.0-slim AS base
LABEL fly_launch_runtime="Node.js"

# Create app directory and set proper permissions
WORKDIR /app
RUN mkdir -p /app/binary && chmod 777 /app/binary

# Copy the already-built files from the dist directory
COPY dist/ /app/dist/

# Copy package.json for dependencies
COPY package.json /app/

# Install only production dependencies
RUN npm install --omit=dev

# Expose the server port
EXPOSE 8103

# Set environment variable
ENV NODE_ENV=production

# Run the application with the env argument
CMD ["node", "--require", "./dist/otel/instrumentation.js", "dist/index.js", "env"]
EOL

# Deploy to Fly.io
if command -v flyctl &> /dev/null || command -v fly &> /dev/null; then
    FLY_CMD=$(command -v flyctl || command -v fly)
    echo "Deploying ${SERVER_APP_NAME} to Fly.io..."
    
    # Check if app exists, if not create it
    if ! $FLY_CMD apps list | grep -q "${SERVER_APP_NAME}"; then
        echo "Creating new Fly.io app..."
        $FLY_CMD launch --no-deploy --dockerfile Dockerfile --name "${SERVER_APP_NAME}"
    fi
    
    # Deploy the app
    $FLY_CMD deploy --dockerfile Dockerfile --app "${SERVER_APP_NAME}"
    
    echo "Deployment completed successfully!"
else
    echo "Error: Fly.io CLI not found. Please install it with:"
    echo "  curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Clean up
echo "Cleaning up temporary files..."
rm -f fly.toml Dockerfile
rm -rf deploy

echo "Done!"