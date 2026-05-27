import { RequestsDashboard } from "@/features/access-requests/components/RequestsDashboard";
import { fetchAccessRequests } from "@/features/access-requests/mock-data";

export default async function HomePage() {
  const requests = await fetchAccessRequests();

  return <RequestsDashboard requests={requests} />;
}
