export type AppNotification = {
  id: string;
  title: string;
  body: string;
  status: string;
  data?: {
    type?: string;
    url?: string;
    shiftId?: string;
    applicationId?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  readAt?: string | null;
};
