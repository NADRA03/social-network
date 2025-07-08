type Notification = {
  id: number;
  user_id: number;
  inviter_id: number;
  group_id?: number;
  event_id?: number;
  type: string;
  message: string;
  status: string;
  created_at: string;
    read: number;
};

let updateNotifications: ((notifications: Notification[]) => void) | null = null;

export function setNotificationUpdater(fn: (notifications: Notification[]) => void) {
  updateNotifications = fn;
}

export function pushNotifications(data: any) {
  if (updateNotifications && Array.isArray(data.notifications)) {
    console.log("Pushing notifications:", data.notifications);
    updateNotifications(data.notifications);
  } else {
    console.warn("No notification updater set or invalid data");
  }
}