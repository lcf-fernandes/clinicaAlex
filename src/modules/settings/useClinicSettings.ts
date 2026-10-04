import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { setDocById } from "../../shared/firestore/crud";
import { DEFAULT_ROOMS_PER_WEEKDAY, type ClinicSettings, type RoomsPerWeekday } from "../../types/clinicSettings";

const COLLECTION = "clinicSettings";
const DOC_ID = "default";

export function useClinicSettings() {
  const [settings, setSettings] = useState<ClinicSettings>({ roomsPerWeekday: DEFAULT_ROOMS_PER_WEEKDAY });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, COLLECTION, DOC_ID),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            roomsPerWeekday: {
              ...DEFAULT_ROOMS_PER_WEEKDAY,
              ...(data.roomsPerWeekday as Partial<RoomsPerWeekday>),
            },
          });
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  async function save(roomsPerWeekday: RoomsPerWeekday) {
    return setDocById(COLLECTION, DOC_ID, { roomsPerWeekday });
  }

  return { settings, loading, error, save };
}
