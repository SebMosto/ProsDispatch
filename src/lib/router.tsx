export { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

export const routePatterns = {
  createInvoice: '/jobs/:jobId/invoices/new',
  invoiceDetail: '/invoices/:id',
  publicInvoice: '/pay/:token',
};

export const routePaths = {
  createInvoice: (jobId: string) => `/jobs/${jobId}/invoices/new`,
  invoiceDetail: (id: string) => `/invoices/${id}`,
  publicInvoice: (token: string) => `/pay/${token}`,
};
