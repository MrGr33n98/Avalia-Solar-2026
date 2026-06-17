import React from 'react';
import TestRenderer from 'react-test-renderer';
import { LoginGate } from '../LoginGate';
import { Text } from 'react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSegments: () => [],
}));

jest.mock('../themed-text', () => ({
  ThemedText: ({ children }: any) => children
}));

jest.mock('../themed-view', () => ({
  ThemedView: ({ children }: any) => children
}));

let mockAuthState = {
  user: null as any,
  isLoading: false,
};

jest.mock('../../store/auth', () => ({
  useAuthStore: () => mockAuthState,
}));

describe('LoginGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator when isLoading is true', () => {
    mockAuthState = { user: null, isLoading: true };
    let renderer: any;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <LoginGate>
          <Text>Protected Content</Text>
        </LoginGate>
      );
    });
    const str = JSON.stringify(renderer.toJSON());
    expect(str).not.toMatch(/Protected Content/);
  });

  it('renders children when user is logged in', () => {
    mockAuthState = { user: { id: '1', role: 'consumer' }, isLoading: false };
    let renderer: any;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <LoginGate>
          <Text>Protected Content</Text>
        </LoginGate>
      );
    });
    const str = JSON.stringify(renderer.toJSON());
    expect(str).toMatch(/Protected Content/);
  });

  it('renders fallback when user is not logged in and fallback is provided', () => {
    mockAuthState = { user: null, isLoading: false };
    let renderer: any;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <LoginGate fallback={<Text>Custom Fallback</Text>}>
          <Text>Protected Content</Text>
        </LoginGate>
      );
    });
    const str = JSON.stringify(renderer.toJSON());
    expect(str).toMatch(/Custom Fallback/);
    expect(str).not.toMatch(/Protected Content/);
  });

  it('redirects to profile when user is not logged in and no fallback provided', () => {
    mockAuthState = { user: null, isLoading: false };
    TestRenderer.act(() => {
      TestRenderer.create(
        <LoginGate>
          <Text>Protected Content</Text>
        </LoginGate>
      );
    });
    expect(mockReplace).toHaveBeenCalledWith('/profile');
  });

  it('renders restricted access message when company is required but user is consumer', () => {
    mockAuthState = { user: { id: '1', role: 'consumer' }, isLoading: false };
    let renderer: any;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <LoginGate requireCompany>
          <Text>Protected Content</Text>
        </LoginGate>
      );
    });
    const str = JSON.stringify(renderer.toJSON());
    expect(str).toMatch(/Acesso Restrito/);
  });

  it('renders children when company is required and user is company', () => {
    mockAuthState = { user: { id: '1', role: 'company' }, isLoading: false };
    let renderer: any;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <LoginGate requireCompany>
          <Text>Protected Content</Text>
        </LoginGate>
      );
    });
    const str = JSON.stringify(renderer.toJSON());
    expect(str).toMatch(/Protected Content/);
  });
});


