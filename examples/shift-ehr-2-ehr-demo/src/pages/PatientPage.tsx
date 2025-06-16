import {
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Stepper,
  Badge,
  Alert,
  SimpleGrid,
  Progress,
  useMantineTheme,
  Box,
  Timeline,
  ThemeIcon,
} from '@mantine/core';
import { type MedplumClient } from '@medplum/core';
import { Bundle, Patient } from '@medplum/fhirtypes';
import { useMedplumContext } from '@medplum/react';
import { JSX, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  IconInfoCircle,
  IconServer,
  IconShieldLock,
  IconTransfer,
  IconFilter,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

export function PatientPage(): JSX.Element {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [contextPatientBundle, setContextPatientBundle] = useState<Bundle | null>(null);
  const [loadingBundle, setLoadingBundle] = useState<boolean>(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [contextPatientId, setContextPatientId] = useState<string | null>(null);
  const [slsResult, setSlsResult] = useState<any | null>(null);
  const [loadingSls, setLoadingSls] = useState<boolean>(false);
  const [slsError, setSlsError] = useState<string | null>(null);
  const [cdsResult, setCdsResult] = useState<any | null>(null);
  const [loadingCds, setLoadingCds] = useState<boolean>(false);
  const [cdsError, setCdsError] = useState<string | null>(null);
  const [transactionResult, setTransactionResult] = useState<any | null>(null);
  const [loadingTransaction, setLoadingTransaction] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Stats for filtered resources
  const [sourceResourceCount, setSourceResourceCount] = useState(0);
  const [filteredResourceCount, setFilteredResourceCount] = useState(0);
  const [targetResourceCount, setTargetResourceCount] = useState(0);

  const medplumContext = useMedplumContext();
  const medplum = medplumContext.medplum as MedplumClient;

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:8103/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: '019753b0-2a7c-73ec-b08a-5a1bfb426b2c',
            client_secret: '5ee40bfd4d3b28c53e6aacafa3461544b50d1d787cbadb69bd38f6cab7445f7c',
            scope: 'user/*.cruds', // Broader scope to allow all resource operations
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setToken(data.access_token);
        console.log('Access token:', data.access_token);
        setActiveStep(1); // Move to next step automatically
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching token:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();

    // Try to get patient ID from SMART on FHIR context
    const smartPatientId = sessionStorage.getItem('smart_patient');
    if (smartPatientId) {
      setContextPatientId(smartPatientId);
      console.log('Found SMART patient ID in session storage:', smartPatientId);
    }
  }, []);

  const getContextPatientEverything = async () => {
    if (!contextPatientId) {
      setBundleError('No context patient ID found in session storage.');
      return;
    }

    if (!medplum.getAccessToken()) {
      setBundleError('No Medplum authentication token found');
      return;
    }

    try {
      setLoadingBundle(true);
      setBundleError(null);

      const bundle = await medplum.readPatientEverything(contextPatientId);
      console.log('Context patient everything bundle:', bundle);

      // Filter out AuditEvent, Practitioner and Consent resources before saving and sending to SLS
      const filteredBundle = { ...bundle };
      if (filteredBundle.entry && Array.isArray(filteredBundle.entry)) {
        filteredBundle.entry = filteredBundle.entry.filter((entry: any) => {
          const resource = entry.resource;
          return resource && resource.resourceType !== 'AuditEvent' && resource.resourceType !== 'Practitioner' && resource.resourceType !== 'Consent';
        });
      }

      setContextPatientBundle(filteredBundle);

      // Update stats - count only the filtered resources
      if (filteredBundle.entry) {
        setSourceResourceCount(filteredBundle.entry.length);
      }

      setActiveStep(2); // Move to next step
    } catch (err: any) {
      setBundleError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error getting context patient everything:', err);
    } finally {
      setLoadingBundle(false);
    }
  };

  const sendToSlsLabel = async () => {
    if (!contextPatientBundle) {
      setSlsError('No context patient bundle available. Please get the context patient data first.');
      return;
    }

    try {
      setLoadingSls(true);
      setSlsError(null);

      const response = await fetch('http://localhost:3002/fhir/sls/label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contextPatientBundle),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('SLS label result:', result);
      setSlsResult(result);
      setActiveStep(3); // Move to next step
    } catch (err: any) {
      setSlsError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error sending to SLS label endpoint:', err);
    } finally {
      setLoadingSls(false);
    }
  };

  const sendToCdsService = async () => {
    if (!slsResult) {
      setCdsError('No SLS result available. Please send the bundle to SLS label endpoint first.');
      return;
    }

    try {
      setLoadingCds(true);
      setCdsError(null);

      // Process the SLS result bundle
      const filteredBundle = { ...slsResult };

      // Create the CDS hook request
      const cdsRequest = {
        hook: 'patient-consent-consult',
        hookInstance: '1234',
        context: {
          patientId: [
            {
              system: 'http://shift.github.io/demo/identifier/mrn',
              value: '12345',
            },
          ],
          category: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/consentscope',
              code: 'patient-privacy',
            },
          ],
          actor: [
            {
              system: 'test-system',
              value: 'test-value',
            },
          ],
          content: filteredBundle,
        },
      };

      console.log('Sending to CDS service:', cdsRequest);

      const response = await fetch('http://localhost:8080/cds-services/patient-consent-consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cdsRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('CDS service result:', result);
      setCdsResult(result);

      // Update stats - count filtered resources
      const resourcesAfterFiltering = result.cards?.[0]?.extension?.content?.entry?.length || 0;
      setFilteredResourceCount(sourceResourceCount - resourcesAfterFiltering);

      setActiveStep(4); // Move to next step
    } catch (err: any) {
      setCdsError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error sending to CDS service:', err);
    } finally {
      setLoadingCds(false);
    }
  };

  const createResourcesFromCdsResult = async () => {
    if (!cdsResult || !token) {
      setTransactionError('No CDS result available or missing token. Please complete previous steps first.');
      return;
    }

    try {
      setLoadingTransaction(true);
      setTransactionError(null);

      // Extract resources from CDS result
      const resources = cdsResult.cards?.[0]?.extension?.content?.entry || [];

      if (!resources.length) {
        throw new Error('No resources found in CDS result');
      }

      // Create transaction bundle entries
      const entries = resources.map((entry: any) => {
        const resource = { ...entry.resource };

        // Remove id, meta, and updated properties
        if (resource) {
          delete resource.id;
          delete resource.meta;
          delete resource.updated;
        }

        return {
          resource,
          request: {
            method: 'POST',
            url: resource.resourceType,
          },
        };
      });

      // Create transaction bundle
      const transactionBundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: entries,
      };

      console.log('Transaction bundle:', transactionBundle);

      // Send transaction bundle to FHIR server
      const response = await fetch('http://localhost:8103/fhir/R4', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionBundle),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Transaction result:', result);
      setTransactionResult(result);

      // Update stats
      if (result.entry) {
        setTargetResourceCount(result.entry.length);
      }

      setActiveStep(5); // Move to final step
    } catch (err: any) {
      setTransactionError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error creating resources from CDS result:', err);
    } finally {
      setLoadingTransaction(false);
    }
  };

  // Helper function to get resource type counts from a bundle
  const getResourceTypeCounts = (bundle: any) => {
    if (!bundle?.entry || !Array.isArray(bundle.entry)) {
      return {};
    }

    const counts: { [key: string]: number } = {};
    bundle.entry.forEach((entry: any) => {
      const resourceType = entry.resource?.resourceType;
      // Only count resources that are not AuditEvent, Practitioner or Consent
      if (resourceType && resourceType !== 'AuditEvent' && resourceType !== 'Practitioner' && resourceType !== "Consent") {
        counts[resourceType] = (counts[resourceType] || 0) + 1;
      }
    });

    return counts;
  };

  // Formats resource counts for display
  const formatResourceCounts = (counts: { [key: string]: number }) => {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([type, count]) => (
        <Badge key={type} size="md" radius="sm" color="blue" mr={5} mb={5}>
          {type}: {count}
        </Badge>
      ));
  };

  return (
    <Container size="xl" py="xl">
      <Paper p="xl" withBorder shadow="md" radius="md">
        <Title order={1} ta="center" mb="xl">
          EHR-to-EHR Data Transfer with Privacy Filtering
        </Title>

        <Alert icon={<IconInfoCircle size="1.1rem" />} color="blue" mb="xl">
          This application demonstrates secure transfer of patient data between two EHR systems with privacy filtering.
          Data flows through a Security Labeling Service (SLS) and Clinical Decision Support (CDS) service to ensure
          privacy requirements are met.
        </Alert>

        <Stepper active={activeStep} color="blue" mb="xl">
          <Stepper.Step
            label="Authentication"
            description="Connect to target EHR"
            icon={<IconServer size="1.1rem" />}
            loading={loading}
            completedIcon={token ? <IconCheck size="1.1rem" /> : undefined}
          >
            <Paper p="md" withBorder mb="md">
              <Title order={3} mb="md">
                Step 1: Authenticate with Target EHR
              </Title>
              <Text mb="md">
                Connecting to the target EHR system to enable data transfer. This requires OAuth2 authentication.
              </Text>

              {loading && <Loader mt="md" />}
              {error && (
                <Alert color="red" title="Authentication Error" icon={<IconAlertCircle size="1rem" />} mt="md">
                  {error}
                </Alert>
              )}
              {token && (
                <Alert color="green" title="Authentication Successful" icon={<IconCheck size="1rem" />} mt="md">
                  Successfully authenticated with the target EHR system.
                </Alert>
              )}
            </Paper>
          </Stepper.Step>

          <Stepper.Step
            label="Source Data"
            description="Retrieve source patient data"
            icon={<IconServer size="1.1rem" />}
            loading={loadingBundle}
            completedIcon={contextPatientBundle ? <IconCheck size="1.1rem" /> : undefined}
          >
            <Paper p="md" withBorder mb="md">
              <Title order={3} mb="md">
                Step 2: Retrieve Source Patient Data
              </Title>
              <Text mb="md">
                Retrieve all clinical data for the patient from the source EHR system. This data will be transferred
                after privacy filtering.
              </Text>

              {contextPatientId ? (
                <>
                  <Alert color="blue" title="SMART on FHIR Context" icon={<IconInfoCircle size="1rem" />} mb="md">
                    <Text>Context Patient ID: {contextPatientId}</Text>
                  </Alert>

                  <Group justify="center" mt="md">
                    <Button
                      onClick={getContextPatientEverything}
                      loading={loadingBundle}
                      disabled={!contextPatientId || !medplum.getAccessToken()}
                      color="blue"
                      size="md"
                    >
                      Retrieve Source Patient Data
                    </Button>
                  </Group>
                </>
              ) : (
                <Alert color="orange" title="No SMART Context" icon={<IconAlertCircle size="1rem" />}>
                  No patient ID found in SMART on FHIR context. Please launch the app from an EHR.
                </Alert>
              )}

              {bundleError && (
                <Alert color="red" title="Data Retrieval Error" icon={<IconAlertCircle size="1rem" />} mt="md">
                  {bundleError}
                </Alert>
              )}

              {contextPatientBundle && (
                <Box mt="md">
                  <Alert
                    color="green"
                    title="Source Data Retrieved Successfully"
                    icon={<IconCheck size="1rem" />}
                    mb="md"
                  >
                    <Text>
                      Successfully retrieved {contextPatientBundle.entry?.length || 0} resources from source EHR.
                    </Text>
                    <Text mt="xs">
                      Resource types: {Object.keys(getResourceTypeCounts(contextPatientBundle)).join(', ')}
                    </Text>
                  </Alert>
                </Box>
              )}
            </Paper>
          </Stepper.Step>

          <Stepper.Step
            label="Security Labeling"
            description="Apply security labels"
            icon={<IconShieldLock size="1.1rem" />}
            loading={loadingSls}
            completedIcon={slsResult ? <IconCheck size="1.1rem" /> : undefined}
          >
            <Paper p="md" withBorder mb="md">
              <Title order={3} mb="md">
                Step 3: Security Labeling Service (SLS)
              </Title>
              <Text mb="md">
                The Security Labeling Service examines clinical data and adds security labels to identify sensitive
                information categories (e.g., mental health, substance abuse, HIV status).
              </Text>

              <Group justify="center" mt="md">
                <Button
                  onClick={sendToSlsLabel}
                  loading={loadingSls}
                  disabled={!contextPatientBundle}
                  color="indigo"
                  size="md"
                >
                  Process Data Through Security Labeling Service
                </Button>
              </Group>

              {slsError && (
                <Alert color="red" title="Security Labeling Error" icon={<IconAlertCircle size="1rem" />} mt="md">
                  {slsError}
                </Alert>
              )}

              {slsResult && (
                <Box mt="md">
                  <Alert color="green" title="Security Labeling Complete" icon={<IconCheck size="1rem" />} mb="md">
                    <Text>Security labels have been applied to all resources.</Text>
                    <Text mt="xs">Resources now contain security tags for privacy filtering.</Text>
                  </Alert>
                </Box>
              )}
            </Paper>
          </Stepper.Step>

          <Stepper.Step
            label="Privacy Filtering"
            description="Apply privacy policies"
            icon={<IconFilter size="1.1rem" />}
            loading={loadingCds}
            completedIcon={cdsResult ? <IconCheck size="1.1rem" /> : undefined}
          >
            <Paper p="md" withBorder mb="md">
              <Title order={3} mb="md">
                Step 4: Clinical Decision Support (CDS) Privacy Filtering
              </Title>
              <Text mb="md">
                The CDS service evaluates security labels against privacy policies and patient consent directives to
                determine which resources can be shared and which must be filtered out.
              </Text>

              <Group justify="center" mt="md">
                <Button onClick={sendToCdsService} loading={loadingCds} disabled={!slsResult} color="violet" size="md">
                  Apply Privacy Filtering via CDS Service
                </Button>
              </Group>

              {cdsError && (
                <Alert color="red" title="Privacy Filtering Error" icon={<IconAlertCircle size="1rem" />} mt="md">
                  {cdsError}
                </Alert>
              )}

              {cdsResult && (
                <Box mt="md">
                  <Alert color="green" title="Privacy Filtering Complete" icon={<IconCheck size="1rem" />} mb="md">
                    <Text>Privacy policies have been applied to filter sensitive data.</Text>
                  </Alert>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">
                      Filtered Data Summary
                    </Title>

                    <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
                      <Paper p="md" withBorder radius="md" bg={theme.colors.blue[0]}>
                        <Text ta="center" fw={700}>
                          Source Resources
                        </Text>
                        <Text ta="center" fz="xl">
                          {sourceResourceCount}
                        </Text>
                      </Paper>

                      <Paper p="md" withBorder radius="md" bg={theme.colors.red[0]}>
                        <Text ta="center" fw={700}>
                          Filtered Out
                        </Text>
                        <Text ta="center" fz="xl">
                          {filteredResourceCount}
                        </Text>
                      </Paper>

                      <Paper p="md" withBorder radius="md" bg={theme.colors.green[0]}>
                        <Text ta="center" fw={700}>
                          Remaining Resources
                        </Text>
                        <Text ta="center" fz="xl">
                          {cdsResult.cards?.[0]?.extension?.content?.entry?.length || 0}
                        </Text>
                      </Paper>
                    </SimpleGrid>

                    <Text fw={600} mb="sm">
                      What happened?
                    </Text>
                    <Text mb="md">
                      The CDS service has evaluated all security labels against privacy policies and patient consent
                      directives. Resources with sensitive information that the patient did not consent to share have
                      been filtered out.
                    </Text>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Stepper.Step>

          <Stepper.Step
            label="Data Transfer"
            description="Create resources in target EHR"
            icon={<IconTransfer size="1.1rem" />}
            loading={loadingTransaction}
            completedIcon={transactionResult ? <IconCheck size="1.1rem" /> : undefined}
          >
            <Paper p="md" withBorder mb="md">
              <Title order={3} mb="md">
                Step 5: Transfer to Target EHR
              </Title>
              <Text mb="md">
                Create the privacy-filtered resources in the target EHR system, completing the secure transfer process.
              </Text>

              <Group justify="center" mt="md">
                <Button
                  onClick={createResourcesFromCdsResult}
                  loading={loadingTransaction}
                  disabled={!cdsResult || !token}
                  color="teal"
                  size="md"
                >
                  Transfer Filtered Data to Target EHR
                </Button>
              </Group>

              {transactionError && (
                <Alert color="red" title="Transfer Error" icon={<IconAlertCircle size="1rem" />} mt="md">
                  {transactionError}
                </Alert>
              )}

              {transactionResult && (
                <Box mt="md">
                  <Alert color="green" title="Transfer Complete" icon={<IconCheck size="1rem" />} mb="md">
                    <Text>All privacy-compliant resources have been successfully transferred to the target EHR.</Text>
                  </Alert>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">
                      Transfer Summary
                    </Title>

                    <SimpleGrid cols={1} mb="md">
                      <Paper p="md" withBorder radius="md" bg={theme.colors.green[0]}>
                        <Text ta="center" fw={700}>
                          Resources Created in Target EHR
                        </Text>
                        <Text ta="center" fz="xl">
                          {targetResourceCount}
                        </Text>
                      </Paper>
                    </SimpleGrid>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Stepper.Step>

          <Stepper.Completed>
            <Paper p="md" withBorder mb="md" bg={theme.colors.green[0]}>
              <Title order={3} mb="md" ta="center">
                EHR-to-EHR Transfer Complete
              </Title>

              <Box mb="xl">
                <Progress
                  value={(targetResourceCount / sourceResourceCount) * 100}
                  size="xl"
                  radius="xl"
                  color="green"
                  mb="sm"
                />

                <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
                  <Paper p="md" withBorder radius="md" ta="center">
                    <Text fw={700}>Source Resources</Text>
                    <Text fz="xl">{sourceResourceCount}</Text>
                  </Paper>

                  <Paper p="md" withBorder radius="md" ta="center">
                    <Text fw={700}>Filtered for Privacy</Text>
                    <Text fz="xl">{filteredResourceCount}</Text>
                  </Paper>

                  <Paper p="md" withBorder radius="md" ta="center">
                    <Text fw={700}>Transferred Resources</Text>
                    <Text fz="xl">{targetResourceCount}</Text>
                  </Paper>
                </SimpleGrid>
              </Box>

              <Title order={4} mb="md" ta="center">
                Transfer Process Summary
              </Title>

              <Timeline active={5} bulletSize={24} lineWidth={2} color="blue">
                <Timeline.Item title="Source Data Retrieved" bullet={<IconServer size="0.8rem" />}>
                  <Text color="dimmed" size="sm">
                    Retrieved {sourceResourceCount} resources from source EHR
                  </Text>
                </Timeline.Item>

                <Timeline.Item title="Security Labels Applied" bullet={<IconShieldLock size="0.8rem" />}>
                  <Text color="dimmed" size="sm">
                    Security Labeling Service (SLS) added privacy tags to resources
                  </Text>
                </Timeline.Item>

                <Timeline.Item title="Privacy Policies Applied" bullet={<IconFilter size="0.8rem" />}>
                  <Text color="dimmed" size="sm">
                    Clinical Decision Support (CDS) service filtered out {filteredResourceCount} sensitive resources
                  </Text>
                </Timeline.Item>

                <Timeline.Item title="Data Transferred" bullet={<IconTransfer size="0.8rem" />}>
                  <Text color="dimmed" size="sm">
                    {targetResourceCount} privacy-compliant resources created in target EHR
                  </Text>
                </Timeline.Item>

                <Timeline.Item title="Transfer Complete" bullet={<IconCheck size="0.8rem" />}>
                  <Text color="dimmed" size="sm">
                    Patient data successfully transferred with privacy protections
                  </Text>
                </Timeline.Item>
              </Timeline>

              <Alert
                color="green"
                icon={<IconCheck size="1rem" />}
                title="Transfer Completed Successfully"
                mt="xl"
                mb="md"
              >
                Patient data has been securely transferred with privacy protections applied. You may now close this
                application.
              </Alert>
            </Paper>
          </Stepper.Completed>
        </Stepper>
      </Paper>
    </Container>
  );
}
