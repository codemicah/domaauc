'use client';

import { AuthGuard } from '@/components/wallet/auth-guard';
import { CreateListingForm } from '@/components/listing/create-listing-form';
import Header from '@/components/ui/header';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export default function CreateListingPage(): React.ReactElement {
  return (
    <AuthGuard>
      <DashboardLayout>
        <CreateListingForm />
      </DashboardLayout>
    </AuthGuard>
  );
}
