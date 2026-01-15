import { useEffect } from "react";
import { type Notification } from "../core/types";

export const useMarkNotificationsRead = (
  show: boolean,
  filtered: Notification[],
  markRead: (ids: number[]) => void
) => {
  useEffect(() => {
    if (show) {
      const unread = filtered.filter((n) => !n.read).map((n) => n.id);
      if (unread.length) markRead(unread);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);
};
