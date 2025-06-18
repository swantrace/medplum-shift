import { JSX } from 'react';
import { Route, Routes } from 'react-router';
import { HomePage } from './pages/HomePage';
import { LaunchPage } from './pages/LaunchPage';
import { SmartEhr2EhrAppPage } from './pages/SmartEhr2EhrAppPage';

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/launch" element={<LaunchPage />} />
      <Route path="/patient" element={<SmartEhr2EhrAppPage />} />
    </Routes>
  );
}
