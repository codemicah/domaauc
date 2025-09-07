import { AuthGuard } from '@/components/wallet/auth-guard';
import { CreateListingForm } from '@/components/listing/create-listing-form';
import { Metadata } from 'next';
import Header from '@/components/ui/header';

export const metadata: Metadata = {
  title: 'DomaAuc - Create Auction',
  description: 'Create a new domain auction',
};

export default function DashboardPage(): React.ReactElement {
  return (
    <AuthGuard>
      <div className="pt-20">
        <Header />
        <div className="min-h-screen p-6">
          <CreateListingForm />
        </div>
      </div>
    </AuthGuard>
  );
}
