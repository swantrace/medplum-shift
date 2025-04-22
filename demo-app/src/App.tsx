import { AppShell, ErrorBoundary, Loading, Logo, useMedplum, useMedplumProfile } from '@medplum/react';
import { IconStar, IconList, IconWebhook, IconPackage } from '@tabler/icons-react';
import { Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { SubscriptionsListPage } from './pages/SubscriptionsListPage';
import { ValueSetSelectorPage } from './pages/ValueSetSelectorPage';
import { BatchOperationsPage } from './pages/BatchOperationsPage';
import { SearchPage } from './pages/SearchPage'; // New search page for /Patient

export function App(): JSX.Element | null {
  const medplum = useMedplum();
  const profile = useMedplumProfile();

  if (medplum.isLoading()) {
    return null;
  }

  return (
    <AppShell
      logo={<Logo size={24} />}
      menus={[
        {
          title: 'Charts',
          links: [
            {
              icon: <IconStar />,
              label: 'Patients',
              href: '/Patient',
            },
          ],
        },
        {
          title: 'Admin',
          links: [
            { icon: <IconList />, label: 'ValueSet Selector', href: '/valueset-selector' },
            { icon: <IconWebhook />, label: 'Subscriptions', href: '/subscriptions' },
            { icon: <IconPackage />, label: 'Batch', href: '/batch' },
          ],
        },
      ]}
    >
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={profile ? <SearchPage /> : <LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/subscriptions" element={<SubscriptionsListPage />} />
            <Route path="/valueset-selector" element={<ValueSetSelectorPage />} />
            <Route path="/batch" element={<BatchOperationsPage />} />
            <Route path="/Patient" element={<SearchPage />} />
            <Route path="/Patient*" element={<SearchPage />} />
            {/* Add other resource search routes as needed */}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
