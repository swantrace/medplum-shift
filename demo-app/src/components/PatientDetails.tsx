import React, { useState } from 'react';
import useDynTabs from 'react-dyn-tabs';
import 'react-dyn-tabs/style/react-dyn-tabs.css';
import 'react-dyn-tabs/themes/react-dyn-tabs-bootstrap.css';
import MoreButtonPlugin from 'react-dyn-tabs/plugins/moreButtonPlugin';
import { showNotification } from '@mantine/notifications';
import { normalizeErrorString, Operator, SearchRequest } from '@medplum/core';
import { Patient, Resource } from '@medplum/fhirtypes';
import { Document, ResourceForm, ResourceHistoryTable, ResourceTable, SearchControl, useMedplum } from '@medplum/react';
import { IconCircleCheck, IconCircleOff } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
// import { cleanResource } from '../utils';
// import { ClinicalImpressionDisplay } from './ClinicalImpressionDisplay';
// import { PatientObservations } from './PatientObservations';

interface PatientDetailsProps {
  patient: Patient;
  onChange: (patient: Patient) => void;
}

export function PatientDetails(props: PatientDetailsProps): JSX.Element {
  const medplum = useMedplum();
  const navigate = useNavigate();
  const id = props.patient.id;

  // Only these tabs are non-closeable and shown initially
  const fixedTabs = [
    { id: 'details', title: 'Details' },
    { id: 'edit', title: 'Edit' },
    { id: 'history', title: 'History' },
  ];

  // Resource types that can be added as tabs
  const resourceTabOptions = [
    { id: 'encounter', title: 'Encounters' },
    { id: 'observation', title: 'Observations' },
    { id: 'condition', title: 'Conditions' },
    { id: 'medicationrequest', title: 'Medication Requests' },
    { id: 'careteam', title: 'Care Teams' },
    { id: 'diagnosticreport', title: 'Diagnostic Reports' },
    { id: 'relatedperson', title: 'Related Persons' },
    { id: 'medication', title: 'Medications' },
  ];

  function handlePatientEdit(resource: Resource): void {
    medplum
      .updateResource(resource)
      .then((patient) => {
        props.onChange(patient as Patient);
        showNotification({
          icon: <IconCircleCheck />,
          title: 'Success',
          message: 'Patient edited',
        });
        navigate(`/Patient/${id}/details`)?.catch(console.error);
        window.scrollTo(0, 0);
      })
      .catch((err) => {
        showNotification({
          color: 'red',
          icon: <IconCircleOff />,
          title: 'Error',
          message: normalizeErrorString(err),
        });
      });
  }

  const encounterSearch: SearchRequest = {
    resourceType: 'Encounter',
    filters: [{ code: 'patient', operator: Operator.EQUALS, value: `Patient/${id}` }],
    fields: ['date', 'patient', 'class'],
  };
  const observationSearch: SearchRequest = {
    resourceType: 'Observation',
    filters: [{ code: 'subject', operator: Operator.EQUALS, value: `Patient/${id}` }],
  };
  const conditionSearch: SearchRequest = {
    resourceType: 'Condition',
    filters: [{ code: 'subject', operator: Operator.EQUALS, value: `Patient/${id}` }],
  };
  const medicationRequestSearch: SearchRequest = {
    resourceType: 'MedicationRequest',
    filters: [{ code: 'subject', operator: Operator.EQUALS, value: `Patient/${id}` }],
  };
  const careTeamSearch: SearchRequest = {
    resourceType: 'CareTeam',
    filters: [{ code: 'subject', operator: Operator.EQUALS, value: `Patient/${id}` }],
  };
  const diagnosticReportSearch: SearchRequest = {
    resourceType: 'DiagnosticReport',
    filters: [{ code: 'subject', operator: Operator.EQUALS, value: `Patient/${id}` }],
  };
  const relatedPersonSearch: SearchRequest = {
    resourceType: 'RelatedPerson',
    filters: [{ code: 'patient', operator: Operator.EQUALS, value: `Patient/${id}` }],
  };
  const medicationSearch: SearchRequest = {
    resourceType: 'Medication',
    filters: [],
  };

  // Map tab keys to their content
  const tabPanels: Record<string, React.ReactNode> = {
    details: <ResourceTable value={props.patient} />,
    edit: <ResourceForm defaultValue={props.patient} onSubmit={handlePatientEdit} />,
    history: <ResourceHistoryTable resourceType="Patient" id={id} />,
    encounter: (
      <SearchControl
        search={encounterSearch}
        hideFilters={true}
        hideToolbar={true}
        onClick={(e) => navigate(`/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)}
      />
    ),
    observation: (
      <SearchControl
        search={observationSearch}
        hideFilters={true}
        hideToolbar={true}
        onClick={(e) => navigate(`/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)}
      />
    ),
    condition: (
      <SearchControl
        search={conditionSearch}
        hideFilters={true}
        hideToolbar={true}
        onClick={(e) => navigate(`/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)}
      />
    ),
    medicationrequest: (
      <SearchControl
        search={medicationRequestSearch}
        hideFilters={true}
        hideToolbar={true}
        onClick={(e) => navigate(`/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)}
      />
    ),
    careteam: (
      <SearchControl
        search={careTeamSearch}
        hideFilters={true}
        hideToolbar={true}
        onClick={(e) => navigate(`/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)}
      />
    ),
    diagnosticreport: (
      <SearchControl
        search={diagnosticReportSearch}
        hideFilters={true}
        hideToolbar={true}
        onClick={(e) => navigate(`/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)}
      />
    ),
    relatedperson: (
      <SearchControl
        search={relatedPersonSearch}
        hideFilters={true}
        hideToolbar={true}
        onClick={(e) => navigate(`/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)}
      />
    ),
    medication: (
      <SearchControl
        search={medicationSearch}
        hideFilters={true}
        hideToolbar={true}
        onClick={(e) => navigate(`/${e.resource.resourceType}/${e.resource.id}`)?.catch(console.error)}
      />
    ),
  };

  // State for dynamic tabs and dropdown
  const [dynamicTabs, setDynamicTabs] = useState<{ id: string; title: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Compose all tabs for react-dyn-tabs
  const allTabs = [
    ...fixedTabs.map((tab) => ({
      ...tab,
      panelComponent: <div style={{ padding: 16 }}>{tabPanels[tab.id]}</div>,
      closable: false,
    })),
    ...dynamicTabs.map((tab) => ({
      ...tab,
      panelComponent: <div style={{ padding: 16 }}>{tabPanels[tab.id]}</div>,
      closable: true,
    })),
    {
      id: 'add',
      title: '+',
      panelComponent: (
        <div style={{ padding: 16 }}>
          {showDropdown && (
            <div style={{ position: 'relative', zIndex: 10 }}>
              <select
                autoFocus
                onBlur={() => setShowDropdown(false)}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId && !dynamicTabs.find((t) => t.id === selectedId)) {
                    const tabOption = resourceTabOptions.find((t) => t.id === selectedId);
                    if (tabOption) {
                      setDynamicTabs((prev) => [...prev, tabOption]);
                    }
                  }
                  setShowDropdown(false);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Select resource type...
                </option>
                {resourceTabOptions
                  .filter((t) => !dynamicTabs.find((dt) => dt.id === t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          )}
          {!showDropdown && <span>Select a resource type to add a tab.</span>}
        </div>
      ),
      closable: false,
    },
  ];

  console.log('allTabs', allTabs);

  // Determine selected tab from URL or default to 'details'
  const tabFromUrl = window.location.pathname.split('/').pop();
  const validTabIds = [...fixedTabs, ...dynamicTabs, { id: 'add' }].map((t) => t.id);
  const selectedTabID = validTabIds.includes(tabFromUrl || '') ? tabFromUrl : 'details';

  // Remove tab handler
  function handleTabClose(closedTabIDs: string[]) {
    setDynamicTabs((prev) => prev.filter((t) => !closedTabIDs.includes(t.id)));
  }

  // Set up react-dyn-tabs
  const [TabList, PanelList, ready] = useDynTabs({
    tabs: allTabs,
    selectedTabID,
    // theme: 'card', // Removed as it is not a valid property
    onChange: ({ currentData }) => {
      const tabId = currentData.selectedTabID;
      if (tabId === 'add') {
        setShowDropdown(true);
        // Stay on the add tab
        // ready.select('add');
      } else {
        setShowDropdown(false);
        // Do not change URL when changing tab
      }
    },
    onClose: handleTabClose,
  });

  return (
    <Document>
      {/* Mantine-like tab title styles for react-dyn-tabs */}
      <style>{`
        /* Style for react-dyn-tabs tab titles */
        #patitent-details-tabs .rc-dyn-tabs-title {
          font-size: 0.766rem;
          padding: 0.547rem 0.875rem;
          margin-right: 0.547rem;
          line-height: 1.55;
          box-sizing: border-box;
        }
      `}</style>
      <div id="patitent-details-tabs">
        <TabList />
        <PanelList />
      </div>
    </Document>
  );
}
