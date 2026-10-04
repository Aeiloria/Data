import assert from 'node:assert/strict';
import { test } from 'node:test';
import { syncAuthenticatedUserProfile } from '../src/utils/userProfileSync';

const user = {
  uid: 'user-123',
  displayName: 'A. Operator',
  email: 'operator@example.com'
};

test('does not overwrite an existing authenticated user profile', async () => {
  let createCalls = 0;

  const created = await syncAuthenticatedUserProfile(
    user,
    async (userId) => {
      assert.equal(userId, user.uid);
      return true;
    },
    async () => {
      createCalls += 1;
    },
    'fixed-time'
  );

  assert.equal(created, false);
  assert.equal(createCalls, 0);
});

test('creates a default-tier profile for a new authenticated user', async () => {
  let writtenProfile: unknown;
  const created = await syncAuthenticatedUserProfile(
    { ...user, displayName: null, email: null },
    async () => false,
    async (userId, profile) => {
      assert.equal(userId, user.uid);
      writtenProfile = profile;
    },
    'fixed-time'
  );

  assert.equal(created, true);
  assert.deepEqual(writtenProfile, {
    userId: user.uid,
    displayName: 'Grid Guardian Operator',
    email: '',
    accessTier: 'OPERATOR_LEVEL_12',
    createdAt: 'fixed-time'
  });
});

test('propagates profile write failures to the auth hook error handler', async () => {
  await assert.rejects(
    syncAuthenticatedUserProfile(
      user,
      async () => false,
      async () => {
        throw new Error('permission denied');
      },
      'fixed-time'
    ),
    /permission denied/
  );
});
