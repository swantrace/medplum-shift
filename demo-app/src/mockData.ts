// Mock data for demo app UI approval

export const mockPatients = [
  {
    id: 'pat-1',
    name: 'John Doe',
    birthDate: '1960-01-01',
    gender: 'male',
    lastUpdated: '2025-04-01',
    status: 'No provider',
  },
  {
    id: 'pat-2',
    name: 'Jane Smith',
    birthDate: '1985-05-12',
    gender: 'female',
    lastUpdated: '2025-03-28',
    status: 'No provider',
  },
  {
    id: 'pat-3',
    name: 'Alex Johnson',
    birthDate: '1972-09-23',
    gender: 'other',
    lastUpdated: '2025-04-10',
    status: 'No provider',
  },
];

export const mockConditions = [
  {
    id: 'cond-1',
    code: 'Hypertension',
    onsetDate: '2025-01-01',
    securityLabels: ['SUD'],
    summary: 'Hypertension',
    date: '2025-01-01',
  },
  {
    id: 'cond-2',
    code: 'Diabetes',
    onsetDate: '2024-11-15',
    securityLabels: ['R'],
    summary: 'Diabetes',
    date: '2024-11-15',
  },
];

export const mockEncounters = [
  {
    id: 'enc-1',
    reason: 'Routine Checkup',
    startDate: '2025-03-01',
    securityLabels: [],
    summary: 'Routine Checkup',
    date: '2025-03-01',
  },
];

export const mockSubscriptions = [
  {
    id: 'sub-123',
    status: 'active',
    criteria: 'Patient?status=active',
    channel: 'rest-hook',
  },
  {
    id: 'sub-456',
    status: 'off',
    criteria: 'Encounter?date=2025',
    channel: 'websocket',
  },
];

export const mockValueSetSuggestions = ['allergyintolerance-code', 'condition-code', 'rxnorm-branded-drugs'];

export const mockValueSetExample = `{
  "resourceType": "ValueSet",
  "status": "active",
  "name": "RxNormBrandedDrugs",
  "compose": {
    "include": [
      {
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "filter": [
          {
            "property": "TTY",
            "op": "=",
            "value": "SBD"
          }
        ]
      }
    ]
  }
}`;

// Add Carl Frederickson and all related resources from carl.json

export const carlPatient = {
  id: 'CarlFrederickson',
  resourceType: 'Patient',
  name: 'Carl Frederickson',
  birthDate: '1949-09-12',
  gender: 'male',
  lastUpdated: '2025-04-01',
  status: 'No provider',
  identifier: [{ system: 'http://example.org/fhir/identifier/mrn', value: '12345' }],
  maritalStatus: 'Married',
  emergencyContact: 'Ellie Frederickson',
};

export const carlRelatedPersons = [
  {
    id: 'EllieFrederickson',
    resourceType: 'RelatedPerson',
    name: 'Ellie Frederickson',
    relationship: ['wife', 'responsible party'],
    patient: 'CarlFrederickson',
  },
];

export const carlConditions = [
  {
    id: 'CarlFredericksonOUD',
    resourceType: 'Condition',
    code: 'Opiate Use Disorder',
    recordedDate: '2025-03-12',
    securityLabels: ['42CFRPart2', 'SUD'],
    summary: 'Opiate Use Disorder',
    date: '2025-03-12',
    subject: 'CarlFrederickson',
  },
];

export const carlObservations = [
  {
    id: 'CarlFredericksonPHQ9',
    resourceType: 'Observation',
    code: 'PHQ-9 depression assessment',
    date: '2023-07-20',
    performer: 'Dr. Sarah Johnson, Psychiatrist',
    value: 15,
    interpretation: 'High',
    note: 'Score indicates moderate to severe depression. Follow-up appointment scheduled.',
    subject: 'CarlFrederickson',
  },
  {
    id: 'CarlFredericksonOUDThoughtRecord',
    resourceType: 'Observation',
    code: 'OUD self-help thought record',
    date: '2023-08-05',
    performer: 'Carl Frederickson',
    securityLabels: ['42CFRPart2'],
    note: 'Patient completed this thought record as part of self-help CBT exercises.',
    subject: 'CarlFrederickson',
  },
  {
    id: 'CarlFredericksonBloodPressure',
    resourceType: 'Observation',
    code: 'Blood pressure',
    date: '2023-08-15',
    performer: 'Dr. Jane Wilson',
    subject: 'CarlFrederickson',
  },
];

export const carlDiagnosticReports = [
  {
    id: 'CarlFredericksonXrayFeet',
    resourceType: 'DiagnosticReport',
    code: 'X-ray, bilateral feet',
    date: '2022-11-15',
    performer: 'Dr. Robert Smith, Radiologist',
    subject: 'CarlFrederickson',
    conclusion: 'Bilateral bunions with hallux valgus deformity, moderate degenerative changes.',
  },
];

export const carlCareTeam = [
  {
    id: 'CarlFredericksonCareTeam',
    resourceType: 'CareTeam',
    name: "Carl Frederickson's Care Team",
    status: 'active',
    participants: [
      { role: 'Primary care provider', member: 'Dr. Hibbert' },
      { role: 'Psychiatrist', member: 'Dr. Funke' },
      { role: 'Psychotherapist', member: 'Lucy van Pelt' },
      { role: 'Psychiatrist', member: 'Dr. White', security: '42CFRPart2' },
      { role: 'Podiatrist', member: 'Dr. Sasquatch' },
      { role: 'Anesthesiologist', member: 'Dr. Aurora' },
      { role: 'Radiologist', member: 'Dr. Banner' },
      { role: 'Care manager', member: 'ACO Care Manager' },
    ],
    subject: 'CarlFrederickson',
    note: 'Monthly care coordination meetings scheduled to coordinate care across behavioral health, primary care, and specialty services. Substance use treatment protected under 42 CFR Part 2.',
  },
];

export const carlMedications = [
  {
    id: 'MedicationFluoxetine',
    resourceType: 'Medication',
    code: 'Fluoxetine 20 MG Oral Capsule',
    form: 'Capsule',
  },
  {
    id: 'MedicationCaptopril',
    resourceType: 'Medication',
    code: 'Captopril 12.5 MG Oral Tablet',
    form: 'Tablet',
  },
  {
    id: 'MedicationBuprenorphineNaltrexone',
    resourceType: 'Medication',
    code: 'Buprenorphine / Naltrexone',
    form: 'Tablet',
  },
];

export const carlMedicationRequests = [
  {
    id: 'CarlFredericksonFluoxetine',
    resourceType: 'MedicationRequest',
    status: 'active',
    medication: 'MedicationFluoxetine',
    subject: 'CarlFrederickson',
    dosage: '20mg daily',
    performer: 'Dr. Sarah Johnson, Psychiatrist',
  },
  {
    id: 'CarlFredericksonCaptopril',
    resourceType: 'MedicationRequest',
    status: 'active',
    medication: 'MedicationCaptopril',
    subject: 'CarlFrederickson',
    dosage: '12.5mg PO BID',
    performer: 'Dr. Hibbert',
  },
  {
    id: 'CarlFredericksonBuprenorphineNaltrexone',
    resourceType: 'MedicationRequest',
    status: 'active',
    medication: 'MedicationBuprenorphineNaltrexone',
    subject: 'CarlFrederickson',
    dosage: '16mg/4mg SL daily',
    performer: 'Dr. White',
    securityLabels: ['42CFRPart2'],
  },
];
