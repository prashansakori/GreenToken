import { useEffect, useState } from 'react';
import { CARBON_CREDIT_CONTRACT_ID } from '../services/soroban';
import {
  getSorobanDashboardSnapshot,
  type SorobanDashboardSnapshot
} from '../services/sorobanDashboard';

const READ_ACCOUNT = import.meta.env.VITE_GREEN_TOKEN_READ_ACCOUNT?.trim() || '';

interface SorobanDashboardState {
  snapshot: SorobanDashboardSnapshot | null;
  isLoading: boolean;
  error: string | null;
}

export function useSorobanDashboard(walletAddress?: string) {
  const [state, setState] = useState<SorobanDashboardState>({
    snapshot: null,
    isLoading: false,
    error: null
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!CARBON_CREDIT_CONTRACT_ID) {
      setState({
        snapshot: null,
        isLoading: false,
        error: 'Soroban contract is not configured. Set VITE_GREEN_TOKEN_CONTRACT_ID to the deployed Testnet contract.'
      });
      return;
    }

    let active = true;
    setState(previous => ({ ...previous, isLoading: true, error: null }));
    getSorobanDashboardSnapshot(walletAddress || READ_ACCOUNT || undefined)
      .then(snapshot => {
        if (active) setState({ snapshot, isLoading: false, error: null });
      })
      .catch(error => {
        if (active) {
          setState({
            snapshot: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Could not load Soroban dashboard data.'
          });
        }
      });

    return () => {
      active = false;
    };
  }, [walletAddress, refreshKey]);

  return {
    ...state,
    refresh: () => setRefreshKey(key => key + 1),
    contractConfigured: !!CARBON_CREDIT_CONTRACT_ID
  };
}
