import { ConnectionsSection } from '@/features/user-profile';
import { getIdentities } from '@/features/user-profile/api/connections';

export const metadata = { title: 'Connections' };

export default async function ProfileConnectionsPage() {
  const identities = await getIdentities();

  return <ConnectionsSection identities={identities} />;
}
