import React from 'react';
import ApproverDetailPage from './ApproverDetailPage';

// Public-facing wrapper — keeps the same route while allowing a future read-only mode
export default function PublicApprover() {
  return <ApproverDetailPage />;
}