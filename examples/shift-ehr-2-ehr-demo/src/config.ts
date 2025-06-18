// Server URLs and endpoints
const MEDPLUM_BASE_URL = import.meta.env?.VITE_MEDPLUM_BASE_URL || 'http://localhost:8103/';
export const MEDPLUM_AUTH_URL = `${MEDPLUM_BASE_URL}oauth2/authorize`;
export const MEDPLUM_TOKEN_URL = `${MEDPLUM_BASE_URL}oauth2/token`;
export const MEDPLUM_FHIR_URL = `${MEDPLUM_BASE_URL}fhir/R4`;

// SLS and CDS service endpoints
export const SLS_SERVICE_BASE_URL = import.meta.env?.VITE_SLS_SERVICE_BASE_URL || 'http://localhost:3002/';
export const SLS_SERVICE_URL = `${SLS_SERVICE_BASE_URL}fhir/sls/label`;

export const CDS_SERVICE_BASE_URL = import.meta.env?.VITE_CDS_SERVICE_BASE_URL || 'http://localhost:8080/';
export const CDS_SERVICE_URL = `${CDS_SERVICE_BASE_URL}cds-services/patient-consent-consult`;

// Client credentials
export const MEDPLUM_CLIENT_ID = import.meta.env?.VITE_MEDPLUM_CLIENT_ID || '0197269d-0a10-7151-8f8d-ca55d00987c8';
export const SMART_HEALTH_IT_CLIENT_ID = import.meta.env?.VITE_SMART_HEALTH_IT_CLIENT_ID || 'your-client-id';
export const SMART_HEALTH_IT_AUTH_URL =
  import.meta.env?.VITE_SMART_HEALTH_IT_AUTH_URL || 'https://launch.smarthealthit.org/v/r4/fhir';

// OAuth scopes
export const FHIR_SCOPE = import.meta.env?.VITE_FHIR_SCOPE || 'launch/patient patient/*.* user/*.cruds';
export const EHR_TO_EHR_SCOPE = import.meta.env?.VITE_EHR_TO_EHR_SCOPE || 'user/*.cruds';

// Target EHR credentials
export const TARGET_CLIENT_ID = import.meta.env?.VITE_TARGET_CLIENT_ID || '019753b0-2a7c-73ec-b08a-5a1bfb426b2c';
export const TARGET_CLIENT_SECRET =
  import.meta.env?.VITE_TARGET_CLIENT_SECRET || '5ee40bfd4d3b28c53e6aacafa3461544b50d1d787cbadb69bd38f6cab7445f7c';
