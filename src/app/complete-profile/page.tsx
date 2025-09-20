'use client';

import dynamic from 'next/dynamic';

const CompleteProfileComponent = dynamic(
  () => import('./CompleteProfileForm'),
  { ssr: false }
);

export default function CompleteProfilePage() {
  return <CompleteProfileComponent />;
}
