import { act, render, screen, waitFor } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authCallback: undefined as
    | ((event: AuthChangeEvent, session: Session | null) => void)
    | undefined,
  from: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
    },
    from: mocks.from,
  },
}));

import { AuthProvider, useAuth } from './useAuth';

function LoadingState() {
  const { isLoading } = useAuth();
  return <span>{String(isLoading)}</span>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    const session = { user: { id: 'user-1' } } as Session;
    const roleQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
    };
    roleQuery.select.mockReturnValue(roleQuery);
    roleQuery.eq.mockReturnValue(roleQuery);

    mocks.from.mockReturnValue(roleQuery);
    mocks.getSession.mockResolvedValue({ data: { session } });
    mocks.onAuthStateChange.mockImplementation(
      (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
        mocks.authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    );
  });

  it('does not re-enter loading when the current session token is refreshed', async () => {
    const { unmount } = render(
      <AuthProvider>
        <LoadingState />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('false')).toBeInTheDocument());

    const refreshedSession = { user: { id: 'user-1' } } as Session;
    act(() => {
      mocks.authCallback?.('TOKEN_REFRESHED', refreshedSession);
    });

    expect(screen.getByText('false')).toBeInTheDocument();
    unmount();
  });
});
