import { 
  isConnected, 
  requestAccess, 
  getAddress, 
  getNetworkDetails, 
  signTransaction
} from '@stellar/freighter-api';
import { StrKey } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from './stellar';

export interface FreighterWalletState {
  isAvailable: boolean;
  isConnected: boolean;
  publicKey: string | null;
  network: string | null;
  networkPassphrase: string | null;
  error: string | null;
}

export interface FreighterSignResult {
  signedTxXdr: string | null;
  error: string | null;
}

/**
 * Check if Freighter extension is installed in the current browser.
 */
export async function checkFreighterInstalled(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    const res = await isConnected();
    if (res.error) {
      console.warn('Freighter availability check failed:', res.error.message);
      return false;
    }
    return res.isConnected;
  } catch (err) {
    console.warn('Freighter isConnected check failed:', err);
    return false;
  }
}

/**
 * Request access from Freighter and retrieve public address.
 * Never fakes connection; requests real user authorization from Freighter extension.
 */
export async function connectFreighterWallet(): Promise<FreighterWalletState> {
  const isInstalled = await checkFreighterInstalled();
  if (!isInstalled) {
    return {
      isAvailable: false,
      isConnected: false,
      publicKey: null,
      network: null,
      networkPassphrase: null,
      error: 'Freighter extension is not detected. Please install Freighter from https://freighter.app'
    };
  }

  try {
    // Request permission from user
    const accessRes = await requestAccess();
    if (accessRes?.error) {
      return {
        isAvailable: true,
        isConnected: false,
        publicKey: null,
        network: null,
        networkPassphrase: null,
        error: `Freighter permission denied: ${accessRes.error.message}`
      };
    }

    const addressResult = accessRes?.address ? null : await getAddress();
    const publicKey = accessRes.address || addressResult?.address || null;
    if (accessRes?.error || addressResult?.error || !publicKey) {
      return {
        isAvailable: true,
        isConnected: false,
        publicKey: null,
        network: null,
        networkPassphrase: null,
        error: accessRes?.error
          ? `Freighter permission denied: ${accessRes.error.message}`
          : addressResult?.error
            ? `Could not get address: ${addressResult.error.message}`
            : 'No address returned by Freighter'
      };
    }
    if (!StrKey.isValidEd25519PublicKey(publicKey)) {
      return {
        isAvailable: true,
        isConnected: false,
        publicKey: null,
        network: null,
        networkPassphrase: null,
        error: 'Freighter returned an invalid Stellar public address.'
      };
    }

    // Get active network details from Freighter
    let netDetails: Awaited<ReturnType<typeof getNetworkDetails>>;
    try {
      netDetails = await getNetworkDetails();
      if (netDetails.error) {
        return {
          isAvailable: true,
          isConnected: false,
          publicKey: null,
          network: null,
          networkPassphrase: null,
          error: `Could not read Freighter network: ${netDetails.error.message}`
        };
      }
    } catch (e) {
      return {
        isAvailable: true,
        isConnected: false,
        publicKey: null,
        network: null,
        networkPassphrase: null,
        error: e instanceof Error ? `Could not read Freighter network: ${e.message}` : 'Could not read Freighter network'
      };
    }

    if (netDetails.networkPassphrase !== STELLAR_CONFIG.networkPassphrase) {
      return {
        isAvailable: true,
        isConnected: false,
        publicKey: null,
        network: netDetails.network,
        networkPassphrase: netDetails.networkPassphrase,
        error: 'Switch Freighter to Stellar Testnet before connecting to GreenToken.'
      };
    }

    return {
      isAvailable: true,
      isConnected: true,
      publicKey,
      network: netDetails.network,
      networkPassphrase: netDetails.networkPassphrase,
      error: null
    };
  } catch (err: unknown) {
    return {
      isAvailable: true,
      isConnected: false,
      publicKey: null,
      network: null,
      networkPassphrase: null,
      error: err instanceof Error ? err.message : 'Failed to connect Freighter wallet'
    };
  }
}

/**
 * Get current connected address without prompting.
 */
export async function getFreighterAddress(): Promise<string | null> {
  try {
    const res = await getAddress();
    if (res?.address) return res.address;
    return null;
  } catch {
    return null;
  }
}

/**
 * Request real transaction signing via Freighter pop-up dialog.
 * Never simulates successful signing; fails if user closes pop-up or rejects.
 */
export async function signTransactionWithFreighter(
  transactionXdr: string,
  networkPassphrase: string = STELLAR_CONFIG.networkPassphrase
): Promise<FreighterSignResult> {
  if (networkPassphrase !== STELLAR_CONFIG.networkPassphrase) {
    return {
      signedTxXdr: null,
      error: 'GreenToken only permits transaction signing on Stellar Testnet.'
    };
  }

  const isInstalled = await checkFreighterInstalled();
  if (!isInstalled) {
    return {
      signedTxXdr: null,
      error: 'Freighter extension not detected. Please install Freighter to sign transactions.'
    };
  }

  try {
    const result = await signTransaction(transactionXdr, {
      networkPassphrase
    });

    if (result?.error) {
      return {
        signedTxXdr: null,
        error: `Freighter signing error: ${result.error}`
      };
    }

    if (!result?.signedTxXdr) {
      return {
        signedTxXdr: null,
        error: 'Signing cancelled or rejected by user in Freighter.'
      };
    }

    return {
      signedTxXdr: result.signedTxXdr,
      error: null
    };
  } catch (err: unknown) {
    return {
      signedTxXdr: null,
      error: err instanceof Error
        ? err.message
        : 'User rejected or closed Freighter signing pop-up'
    };
  }
}

