import { ApplicationsPage } from "@/components/applications/applications-page";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <ApplicationsPage />
    </Suspense>
  );
}
