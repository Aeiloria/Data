import type { User } from 'firebase/auth';

export interface AuthenticatedUserProfile {
  userId: string;
  displayName: string;
  email: string;
  accessTier: 'OPERATOR_LEVEL_12';
  createdAt: string;
}

export async function syncAuthenticatedUserProfile(
  user: Pick<User, 'uid' | 'displayName' | 'email'>,
  profileExists: (userId: string) => Promise<boolean>,
  createProfile: (userId: string, profile: AuthenticatedUserProfile) => Promise<void>,
  createdAt = new Date().toISOString()
): Promise<boolean> {
  if (await profileExists(user.uid)) return false;

  await createProfile(user.uid, {
    userId: user.uid,
    displayName: user.displayName || 'Grid Guardian Operator',
    email: user.email || '',
    accessTier: 'OPERATOR_LEVEL_12',
    createdAt
  });
  return true;
}
