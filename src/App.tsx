/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Letters from './pages/Letters';
import LetterForm from './pages/LetterForm';
import LetterView from './pages/LetterView';
import Settings from './pages/Settings';
import Counters from './pages/Counters';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/letters" element={<Letters />} />
              <Route path="/letters/new" element={<LetterForm />} />
              <Route path="/letters/:id/edit" element={<LetterForm />} />
              <Route path="/letters/:id" element={<LetterView />} />
              <Route path="/counters" element={<Counters />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
