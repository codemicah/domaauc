import { AuthGuard } from '@/components/wallet/auth-guard';
import { CreateListingForm } from '@/components/listing/create-listing-form';

export default function DashboardPage(): React.ReactElement {
  return (
    <AuthGuard>
      <div className="min-h-screen p-6">
        <CreateListingForm />
      </div>
    </AuthGuard>
  );
}
