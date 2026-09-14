import {
  APPLICATIONS_GROUPING_EVENT,
  persistApplicationsGrouping,
  readApplicationsGrouping,
  type ApplicationsGrouping,
} from "@/lib/preferences";
import { useCallback, useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(APPLICATIONS_GROUPING_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(APPLICATIONS_GROUPING_EVENT, onStoreChange);
  };
}

function getServerSnapshot(): ApplicationsGrouping {
  return "none";
}

export function useApplicationsGrouping() {
  const grouping = useSyncExternalStore(
    subscribe,
    readApplicationsGrouping,
    getServerSnapshot
  );

  const setGroupByCompany = useCallback((enabled: boolean) => {
    persistApplicationsGrouping(enabled ? "company" : "none");
  }, []);

  return {
    groupByCompany: grouping === "company",
    setGroupByCompany,
  };
}
