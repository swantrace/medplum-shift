# SHIFT Task Force SMART EHR-to-EHR Demo

This project provides a streamlined approach to demonstrating EHR interoperability using SMART applications for the SHIFT Task Force. It leverages [Medplum](https://github.com/medplum/medplum) as a FHIR data store and includes deployment scripts for quickly setting up the necessary infrastructure on Fly.io.

## Demo Video

Watch our demonstration video to see the SHIFT EHR-to-EHR demo in action:

[download the demo video](https://github.com/SHIFT-Task-Force/medplum-shift-demo/raw/refs/heads/main/assets/videos/smart-ehr-2-ehr-demo.webm).

## Quick Start Guide for Testers

The demo environment is already set up and ready for testing at [medplum-admin.fly.dev](https://medplum-admin.fly.dev).

### Access the Demo

1. Login to the Source EHR at [medplum-admin.fly.dev](https://medplum-admin.fly.dev) with credentials provided by the administrator

2. Set up easy account switching:
   - Click on your username in the left corner
   - Select "EHR1 SHIFT" in the dropdown menu
   - Click "Add another account"
   - Login with the Target EHR credentials provided by the administrator
   - Now you can easily switch between the two EHRs using the account dropdown

### Run the Demo

1. Navigate to the **Patient** tab in the left sidebar
2. Select the test patient from the list
3. In the patient view, switch to the **Apps** tab
4. Click on the **Transfer Data App** link to launch the SMART app
5. Follow the on-screen instructions in the SMART app

### After Each Test

To reset the environment for the next demo:

1. Switch to the Target EHR account
2. Navigate to each resource type that was transferred
3. Select the transferred resources
4. Click "Delete" to remove them from the target EHR

## For Developers: Deploying New Instances

This section describes how to set up a complete new deployment of the SHIFT Task Force demo environment on Fly.io.

### Prerequisites

- [Fly.io account](https://fly.io/signup)
- [Flyctl installed](https://fly.io/docs/hands-on/install-flyctl/)
- Authenticated with Fly.io: `fly auth login`

### Deployment Process

#### 1. Deploy Core Infrastructure

```sh
# 1. Deploy PostgreSQL database
./scripts/deploy-shift-postgres-flyio.sh [custom-app-name]

# 2. Deploy Redis cache
./scripts/deploy-shift-redis-flyio.sh [custom-app-name]

# 3. Deploy the Medplum backend server
./scripts/deploy-shift-server-flyio.sh [-n server-app-name] [-a admin-app-name] [-p postgres-app-name] [-r redis-app-name]

# 4. Deploy the Medplum admin interface
./scripts/deploy-shift-app-flyio.sh [-n server-app-name] [-a admin-app-name]
```

#### 2. Create Initial Admin User

After deploying the infrastructure, you need to create the first admin user:

1. **Create Super Admin User**:

   ```sh
   # SSH into your Medplum server
   fly ssh console -a [server-app-name]

   # Inside the server, run the create super admin command
   node dist/index.js create-super-admin [admin-email] [secure-password]
   ```

2. **Access Admin Interface**:
   - Navigate to `https://[admin-app-name].fly.dev/`
   - Login with the super admin credentials you just created

#### 3. Set Up EHR Environments

1. **Create Projects for Source and Target EHRs**:

   - In the admin interface, go to "Projects"
   - Create a new project for "Source EHR" (e.g., "EHR1 SHIFT")
   - Create another project for "Target EHR" (e.g., "EHR2 SHIFT")
   - Note the project IDs for later use

2. **Create Users for Each EHR**:

   - In the admin interface, go to "Users"
   - Create a user for Source EHR:
     - Email: Use your organization's email pattern
     - Password: Create a secure password
     - Assign to the Source EHR project
   - Create a user for Target EHR:
     - Email: Use your organization's email pattern
     - Password: Create a secure password
     - Assign to the Target EHR project

3. **Load Demo Data**:

   - Clone the demo FHIR data: `git clone https://github.com/SHIFT-Task-Force/demo-fhir-data`
   - Login to the Source EHR using the created user credentials
   - Navigate to "Batch Upload" and upload the FHIR resources from the demo repository
   - Verify the resources were uploaded successfully

4. **Create Consent Resource**:
   Create a Consent resource in the Source EHR:

```json
{
  "resourceType": "Consent",
  "status": "active",
  "scope": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/consentscope",
        "code": "patient-privacy",
        "display": "Privacy Consent"
      }
    ]
  },
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/consentscope",
          "code": "patient-privacy",
          "display": "Privacy Consent"
        }
      ]
    }
  ],
  "patient": {
    "reference": "Patient/0197837a-cb6c-72e2-9f3f-b9dec6c0f4d7",
    "display": "Carl Frederickson"
  },
  "policyRule": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
        "code": "hipaa-self-pay",
        "display": "HIPAA Self-Pay Restriction"
      }
    ]
  },
  "provision": {
    "type": "permit",
    "provision": [
      {
        "type": "deny",
        "securityLabel": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
            "code": "R"
          }
        ]
      }
    ]
  }
}
```

#### 4. Configure Client Applications

1. **Source EHR Client Application for CDS Service**:

   - Login as the Source EHR user
   - Navigate to "Client Applications" and create a new application
   - Set a meaningful name like "CDS Service Client"
   - Note the Client ID for later use
   - Get a long-lived access token using [medplum-oauth](https://github.com/SHIFT-Task-Force/medplum-oauth)
   - Store this token securely as it will be used by the CDS service

2. **Target EHR Client Application for Resource Creation**:

   - Login as the Target EHR user
   - Create a Client Application for the SMART app to create resources in the target EHR
   - Set a meaningful name like "Target EHR Resource Creator"
   - Note the Client ID and Secret for later use in environment variables

3. **Source EHR Client Application for SMART App Launch**:
   - Login as the Source EHR user
   - Create another Client Application for the SMART app launching
   - Set a meaningful name like "SMART EHR-to-EHR App"
   - This will be configured after deploying the SMART app

#### 5. Deploy Supporting Services

##### Deploy SLS Service

1. Clone the repository:

   ```sh
   git clone https://github.com/SHIFT-Task-Force/leap-sls
   ```

2. Follow the repository's instructions to deploy to Fly.io

##### Deploy CDS Service

1. Clone the repository:

   ```sh
   git clone https://github.com/SHIFT-Task-Force/leap-cds-plus
   ```

2. Configure environment variables:

   ```
   CONSENT_FHIR_SERVERS=https://[your-medplum-server].fly.dev/fhir/R4
   CONSENT_FHIR_SERVERS_AUTH='{"https://[your-medplum-server].fly.dev/fhir/R4": {"type": "bearer","auth_token": "[your-long-lived-access-token]"}}'
   ```

3. Deploy the service to Fly.io

#### 6. Deploy SMART EHR-to-EHR Demo App

1. **Prepare Environment Variables**:

   ```sh
   # Navigate to the demo app directory
   cd examples/shift-ehr-2-ehr-demo

   # Copy example environment file
   cp .env.example .env.production
   ```

2. **Update Environment Variables**:
   Update `.env.production` with the actual domains of your deployed instances:

   ```
   # Use your actual deployed service URLs
   VITE_MEDPLUM_BASE_URL=https://[your-medplum-server].fly.dev/
   VITE_SLS_SERVICE_BASE_URL=https://[your-sls-service].fly.dev/
   VITE_CDS_SERVICE_BASE_URL=https://[your-cds-service].fly.dev/

   # Target EHR credentials - use environment variables or secure configuration
   VITE_TARGET_CLIENT_ID=[your-target-client-id]
   VITE_TARGET_CLIENT_SECRET=[your-target-client-secret]
   ```

3. **Deploy the SMART App**:

   ```sh
   ./scripts/deploy-shift-smart-ehr-2-ehr-app-flyio.sh [-n server-app-name] [-a app-name] [-e production]
   ```

4. **Complete SMART App Registration**:

   - Update the Source EHR SMART App Client Application:
     - Set redirect URL to `https://[app-name].fly.dev/launch`
     - Set launch URL to `https://[app-name].fly.dev/launch`
     - Check PKCE Optional
   - Note the Client ID

5. **Update App Configuration and Redeploy**:
   - Add to `.env.production`:
     ```
     VITE_MEDPLUM_CLIENT_ID=[your-smart-app-client-id]
     ```
   - Redeploy the app:
     ```sh
     ./scripts/deploy-shift-smart-ehr-2-ehr-app-flyio.sh [-n server-app-name] [-a app-name] [-e production]
     ```

## Project Details

### What is Medplum?

[Medplum](https://www.medplum.com) is a developer platform that enables flexible and rapid development of healthcare apps with:

- FHIR-based API for healthcare data exchange
- Authentication using OAuth, OpenID, and SMART-on-FHIR
- Clinical Data Repository (CDR)
- Bot framework for server-side automation

For complete documentation on Medplum itself, visit the [main Medplum repository](https://github.com/medplum/medplum).

### Repository Structure

This repository follows the standard Medplum structure with additional deployment scripts for Fly.io:

- **`scripts/`**: Contains deployment scripts for various components
  - `deploy-shift-postgres-flyio.sh` - Deploy PostgreSQL database
  - `deploy-shift-redis-flyio.sh` - Deploy Redis cache
  - `deploy-shift-server-flyio.sh` - Deploy Medplum backend server
  - `deploy-shift-app-flyio.sh` - Deploy Medplum admin interface
  - `deploy-shift-smart-ehr-2-ehr-app-flyio.sh` - Deploy the SMART EHR-to-EHR demo app

## SMART EHR-to-EHR Demo Application

The demo application showcases privacy-respecting interoperability using the Security Label Service (SLS) and Consent Decision Service (CDS). It demonstrates:

1. Authenticating with source EHR using SMART App Launch Framework
2. Retrieving patient data from the source EHR
3. Using the SLS to apply appropriate security labels to the data based on content
4. Using the CDS to filter data based on patient consent preferences
5. Transferring appropriately labeled and filtered data to a target EHR

This workflow demonstrates the practical implementation of:

- **Security Label Service (SLS)**: Analyzes clinical data to detect sensitive information and applies appropriate security labels following the HL7 Healthcare Privacy and Security Classification System. For detailed information about the SLS implementation, see the [LEAP SLS repository](https://github.com/SHIFT-Task-Force/leap-sls).

- **Consent Decision Service (CDS)**: Enforces patient privacy preferences by evaluating security-labeled resources against consent policies, determining what data can be shared. For more about the CDS implementation, see the [LEAP CDS Plus repository](https://github.com/SHIFT-Task-Force/leap-cds-plus).

Together, these services enable privacy-preserving data exchange while respecting patient consent preferences.

## Security Considerations

- Store all credentials securely using environment variables or secure configuration management
- Use strong, unique passwords for all accounts
- Regularly rotate access tokens and API keys
- Never commit credentials to version control
- Use HTTPS for all communications
- Follow your organization's security policies for credential management

## Troubleshooting

- Check service logs: `fly logs -a [app-name]`
- SSH into a VM: `fly ssh console -a [app-name]`
- View service status: `fly status -a [app-name]`

## Related Repositories

- [LEAP CDS Plus Service](https://github.com/SHIFT-Task-Force/leap-cds-plus) - Consent Decision Service that enforces patient privacy preferences
- [LEAP SLS Service](https://github.com/SHIFT-Task-Force/leap-sls) - Security Labeling Service that identifies and labels sensitive information
- [Medplum OAuth Helper](https://github.com/SHIFT-Task-Force/medplum-oauth) - Tool for obtaining long-lived access tokens
- [Demo FHIR Data](https://github.com/SHIFT-Task-Force/demo-fhir-data) - Sample FHIR resources for demonstration

## Additional Resources

- [Medplum Documentation](https://www.medplum.com/docs)
- [SMART App Launch Framework](https://hl7.org/fhir/smart-app-launch/)
- [Fly.io Documentation](https://fly.io/docs/)
