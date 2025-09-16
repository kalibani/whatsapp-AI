import { UserButton, useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <div className="font-medium">{user.firstName} {user.lastName}</div>
        <div className="text-gray-500">{user.primaryEmailAddress?.emailAddress}</div>
      </div>
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}