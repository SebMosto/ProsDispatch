export const routePatterns = {
  createInvoice: '/jobs/:jobId/invoices/new',
  invoiceDetail: '/invoices/:id',
  publicInvoice: '/pay/:token',
  jobApproval: '/jobs/approve',
};

export const routePaths = {
  createInvoice: (jobId: string) => `/jobs/${jobId}/invoices/new`,
  invoiceDetail: (id: string) => `/invoices/${id}`,
  publicInvoice: (token: string) => `/pay/${token}`,
  jobApproval: (token: string) => `/jobs/approve?token=${token}`,
};
