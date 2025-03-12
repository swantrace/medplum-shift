# SHIFT Task Force Demo Deployment

This project provides a comprehensive setup for facilitating the demonstration of the Security Label Service (SLS) and Batch Orchestrator for the SHIFT Task Force. It leverages [Medplum](https://github.com/medplum/medplum) as a FHIR data store with built-in `meta.security` support and FHIR subscription capabilities. One demo application can be developed to allow users to create new FHIR resources, view the original and labeled resources side by side, and visualize the resources graphically.

## Project Overview

This repository contains the configuration needed to deploy the necessary components to Fly.io, including a demo application to facilitate the creation and visualization of FHIR resources with security labels.

## Folder Structure

- **medplum-postgres**: PostgreSQL database configuration for Medplum

  - Contains Dockerfile, initialization scripts, and Fly.io configuration
  - Persistent storage via Fly volumes

- **medplum-redis**: Redis cache configuration for Medplum

  - Contains Dockerfile, entrypoint script, and Fly.io configuration
  - Used for session management and caching

- **medplum-backend**: Medplum server backend configuration

  - Contains Node.js application Dockerfile and Fly.io configuration
  - Provides the FHIR API and core Medplum functionality
  - The `$meta-add` and `$meta-delete` operations can be added to the FHIR API to support the SLS, but they are not ready yet.
  - Hosted at [medplum-backend.fly.io](https://medplum-backend.fly.io)

- **medplum-admin**: Medplum admin interface

  - Contains Dockerfile for the admin web interface and Fly.io configuration
  - Provides the web UI for managing Medplum Backend, such as creating Subscriptions and viewing resources
  - Hosted at [medplum-admin.fly.io](https://medplum-admin.fly.io)

- **demo-app**: Demo application to facilitate sending POST requests to create new FHIR resources, display original and labeled resources side by side, and visualize resources graphically.

## Local Development

### Prerequisites

- Docker and Docker Compose
- Node.js (recommended v20.x)
- Git

### Running Locally

1. Clone this repository:

   ```sh
   git clone https://github.com/your-username/medplum-fly-deployment.git
   cd medplum-fly-deployment
   ```

2. Start the required services using Docker Compose:

   ```sh
   docker-compose up --build
   ```

   This will start PostgreSQL and Redis services on your local machine.

3. Access the services:

   - PostgreSQL: localhost:5432 (username: medplum, password: medplum)
   - Redis: localhost:6379 (password: medplum)

4. Start the Medplum backend:

   ```sh
   cd medplum-backend/server
   npm install
   npm run dev
   ```

5. Start the Medplum admin interface:

   ```sh
   cd medplum-admin/app
   npm install
   npm run dev
   ```

6. Start the demo application:
   ```sh
   cd demo-app
   npm install
   npm start
   ```

## Deploying to Fly.io

### Prerequisites

- [Fly.io account](https://fly.io/signup)
- [Flyctl installed](https://fly.io/docs/hands-on/install-flyctl/)

### Deployment Steps

1. Authenticate with Fly.io:

   ```sh
   fly auth login
   ```

2. Deploy the PostgreSQL database:

   ```sh
   cd medplum-postgres
   fly launch # Skip this if you've already created the app
   fly deploy
   ```

3. Deploy the Redis cache:

   ```sh
   cd ../medplum-redis
   fly launch # Skip this if you've already created the app
   fly deploy
   ```

4. Deploy the Medplum backend:

   ```sh
   cd ../medplum-backend
   fly launch # Skip this if you've already created the app
   fly deploy
   ```

5. Deploy the Medplum admin interface:

   ```sh
   cd ../medplum-admin
   fly launch # Skip this if you've already created the app
   fly deploy
   ```

6. Deploy the demo application:

   ```sh
   cd ../demo-app
   fly launch # Skip this if you've already created the app
   fly deploy
   ```

7. Verify the deployment:
   ```sh
   fly status
   ```

## Configuration

Each service is configured through its respective `fly.toml` file. The Medplum backend environment variables in `medplum-backend/fly.toml` control the functionality of the platform.

## Troubleshooting

- Check service logs: `fly logs -a [app-name]`
- SSH into a VM: `fly ssh console -a [app-name]`
- View service status: `fly status -a [app-name]`
