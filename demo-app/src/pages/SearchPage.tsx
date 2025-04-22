import { Document, SearchControl } from '@medplum/react';
import { useLocation, useNavigate } from 'react-router';

export function SearchPage(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  // Parse resourceType from pathname (e.g. /Patient)
  const resourceType = (location.pathname.split('/')[1] as any) || 'Patient';
  // Parse search params from URL
  const searchParams = Object.fromEntries(new URLSearchParams(location.search));

  return (
    <Document>
      <SearchControl
        search={{ resourceType, ...searchParams } as any}
        onClick={(e) => navigate(`/${resourceType}/${e.resource.id}`)}
      />
    </Document>
  );
}
