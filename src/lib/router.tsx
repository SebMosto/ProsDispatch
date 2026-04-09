// eslint-disable-next-line react-refresh/only-export-components
export { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// eslint-disable-next-line react-refresh/only-export-components
export const routePatterns = {
  createInvoice: '/jobs/:jobId/invoices/new',
  invoiceDetail: '/invoices/:id',
  publicInvoice: '/pay/:token',
  jobApproval: '/jobs/approve/:token',
};

// eslint-disable-next-line react-refresh/only-export-components
export const routePaths = {
  createInvoice: (jobId: string) => `/jobs/${jobId}/invoices/new`,
  invoiceDetail: (id: string) => `/invoices/${id}`,
  publicInvoice: (token: string) => `/pay/${token}`,
  jobApproval: (token: string) => `/jobs/approve/${token}`,
};
