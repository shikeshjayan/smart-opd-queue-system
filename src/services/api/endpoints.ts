export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verify: "/auth/verify",
    forgot: "/auth/forgot-password",
    me: "/auth/me",
  },
  patients: {
    list: "/patients",
    detail: (id: string) => `/patients/${id}`,
    update: (id: string) => `/patients/${id}`,
  },
  hospitals: {
    list: "/hospitals",
    detail: (id: string) => `/hospitals/${id}`,
    departments: (id: string) => `/hospitals/${id}/departments`,
  },
  departments: {
    list: "/departments",
    detail: (id: string) => `/departments/${id}`,
  },
  opd: {
    list: "/opd",
    detail: (id: string) => `/opd/${id}`,
    book: "/opd/book",
  },
  queues: {
    list: "/queues",
    detail: (id: string) => `/queues/${id}`,
    status: (id: string) => `/queues/${id}/status`,
    advance: (id: string) => `/queues/${id}/advance`,
  },
  doctors: {
    list: "/doctors",
    detail: (id: string) => `/doctors/${id}`,
  },
  encounters: {
    list: "/encounters",
    detail: (id: string) => `/encounters/${id}`,
  },
  prescriptions: {
    list: "/prescriptions",
    detail: (id: string) => `/prescriptions/${id}`,
  },
  laboratories: {
    list: "/laboratories",
    detail: (id: string) => `/laboratories/${id}`,
  },
  notifications: {
    list: "/notifications",
    markRead: (id: string) => `/notifications/${id}/read`,
  },
  admin: {
    summary: "/admin/summary",
    users: "/admin/users",
  },
} as const;
