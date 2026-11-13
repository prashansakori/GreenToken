# GreenToken (GRN) — Institutional Carbon Credit Tokenization on Stellar

> **Verified Carbon Credit Tokenization, Decentralized Trading & Cryptographic Permanent Retirement on the Stellar Blockchain.**

GreenToken is a Web3 sustainability prototype for environmental projects and carbon-credit workflows. A Soroban-tracked credit represents **1 Metric Tonne of Carbon Dioxide Equivalent ($tCO_2e$)**; it is an internal contract balance, not a native Stellar asset. Project listings and the current verification queue are local/off-chain prototype data and do not independently establish registry certification.

---

## 🌟 Highlights & Key Features

- **Net-Zero Blockchain Foundation**: Built on the **Stellar Consensus Protocol (SCP)**, eliminating energy-intensive Proof-of-Work mining. Transaction energy consumption is ~0.00022 kWh per transaction.
- **Freighter Wallet Integration**: Connect and sign real on-chain transactions via the official `@stellar/freighter-api`.
- **Soroban WebAssembly Smart Contracts**: Official Soroban RPC integration (`https://soroban-testnet.stellar.org`) via `@stellar/stellar-sdk` supporting contract simulation, resource fee estimation (`prepareTransaction`), and contract invocation.
- **Sub-Cent Micro-Settlement**: Fixed base fee of 100 stroops (0.00001 XLM / $0.000001), enabling micro-retirements for everyday e-commerce checkouts and API-driven automated corporate offsets.
- **Soroban Credit Ownership**: Project credit balances and transfers are tracked by the GreenToken Soroban contract. Marketplace transfers require a deployed contract and an explicit on-chain project ID mapping.
- **Soroban Retirement**: The contract permanently subtracts owned credits from project balances, updates retirement totals, and records a unique retirement ID. Confirmed transactions are linked to a certificate; the credits are not sent to a Stellar burn address.
- **Friendbot Testnet Faucet**: Request 10,000 test XLM directly from the Stellar Foundation Friendbot on demand.

---

## 🏗️ Architecture & Stellar Services

The platform provides a modular blockchain service abstraction under `src/services/` and `src/hooks/`:

```
src/
├── services/
│   ├── stellar.ts         # Horizon client, Testnet config, TransactionBuilder, Friendbot funding
│   ├── wallet.ts          # Freighter wallet detection, access requests, and pop-up transaction signing
│   ├── soroban.ts         # Soroban RPC server, ScVal converters, contract simulation & execution
│   ├── verification.ts    # Evidence hashing and replaceable registry adapter
│   └── evidenceStorage.ts # Browser-local evidence storage with digest verification
├── hooks/
│   └── useWallet.ts       # React hook for wallet state, on-chain balances, and Freighter signing
├── components/
│   └── WalletConnect.tsx  # Wallet UI with connection badge, public key, live XLM balance & explorer links
```

### 1. `src/services/stellar.ts`
- **Network Configuration**: Targets Stellar Testnet (`networkPassphrase: Networks.TESTNET`, `horizonUrl: https://horizon-testnet.stellar.org`).
- **Account Operations**: `loadAccount()`, `getAccountBalances()`, `fundWithFriendbot()`.
- **Transaction Assembly**: `buildPaymentTransaction()` and `buildRetirementBurnTransaction()`.
- **Submission**: `submitSignedTransaction()` directly to Stellar Horizon nodes without simulating fake success.

### 2. `src/services/wallet.ts`
- **Freighter Detection**: `checkFreighterInstalled()` verifies if the extension is present.
- **Authorization**: `connectFreighterWallet()` requests access from the user via `requestAccess()` and `getAddress()`.
- **Signing**: `signTransactionWithFreighter()` triggers the real Freighter extension pop-up for user approval.

### 3. `src/services/soroban.ts`
- **Soroban RPC**: Connects to `https://soroban-testnet.stellar.org` via `rpc.Server`.
- **Simulation**: `simulateContractCall()` tests contract execution and calculates minimum resource fees.
- **Transaction Preparation**: `buildSorobanInvokeTransaction()` invokes `prepareTransaction()` to calculate state footprint and auth entries.
- **Contract Submission**: `sendSorobanTransaction()` broadcasts WASM calls and polls for `SUCCESS` or `FAILED` status.

---

## 🖥️ 8 Complete Pages

1. **Landing Page (`#landing`)**: Live Stellar testnet ticker, hero section, carbon trust gap comparison, 4-step lifecycle, and blockchain energy comparison.
2. **Impact Dashboard (`#dashboard`)**: Recharts project impact chart, contract-backed issuance/retirement totals, verified project count, recent Soroban events, and credit activity history. It excludes local marketplace samples from live metrics.
3. **Carbon Marketplace (`#marketplace`)**: Approved project listings, search, filters, indicative pricing, Testnet XLM balance, Soroban transfer flow, and a purchase preview that remains disabled until atomic payment settlement is implemented.
4. **Project Details (`#project/:id`)**: Remote sensing telemetry, auditor details, UN SDGs, Soroban contract addresses, and instant buy/retire widget.
5. **Verification Portal (`#verification`)**: Project submission, browser-hashed evidence, wallet-authorized verifier review, and audit trail.
6. **My Portfolio (`#portfolio`)**: Connected Freighter wallet, Soroban retirement history, and saved retirement certificates.
7. **Retirement Certificate (`#certificate/:id`)**: Soroban retirement ID, project, amount, owner, date, and transaction hash; use **Print / Save PDF** and choose the browser's PDF destination.
8. **Admin Dashboard (`#admin`)**: Project issuance controls and authorized verifier registry management. Project decisions are made in the verifier portal, not by an admin shortcut.

## Verification Workflow

- Submissions start in `pending` and bind the developer identity to the connected Stellar wallet.
- Evidence files are hashed with SHA-256, stored in the submitting browser's IndexedDB, and re-hashed before a verifier can review them.
- Review decisions require an active verifier wallet different from the developer wallet. Approval and rejection require a verification reference; rejection also requires a reason.
- The Soroban contract independently checks verifier authorization, blocks self-verification, records immutable decision data (verifier, project, reference, ledger timestamp, evidence hash), and restricts issuance to approved projects and their approved quantity.
- The verification adapter is defined in `src/services/verification.ts` so it can be replaced with a carbon-registry integration.

**Prototype boundary:** The current React context uses browser-local state for the review queue and audit display; browser storage is not an authoritative multi-user audit service. The Soroban contract source contains the on-chain enforcement and audit record, but this UI does not yet submit verification decisions to a deployed contract or external registry. A production deployment must connect the adapter to that authoritative service and provision verifier addresses through secured contract administration.

---

## 🚀 Running the Project Locally

### Requirements

- Node.js 20.19+ or 22.12+ and npm (Vite 8 requirement).
- Rust stable and Cargo to run Soroban contract tests.
- Freighter is optional for wallet UI testing; use a Stellar Testnet account only.

### 1. Configure the Frontend

The app is Testnet-only. Copy the example environment file if you want an explicit local configuration:

```powershell
Copy-Item .env.example .env.local
```

`VITE_STELLAR_NETWORK` must remain `testnet`. **Never put secret keys, seed phrases, private keys, or signing secrets in `.env` or `VITE_*` variables**; Vite embeds those variables in public browser assets.

To enable Soroban credit transfers and retirement, set `VITE_GREEN_TOKEN_CONTRACT_ID` to the public address of the deployed Testnet contract, and set each linked project's `sorobanProjectId` to the numeric ID actually registered in that contract. The contract address is public configuration, not a secret. Unmapped projects and missing contract configuration fail closed. Retirement requires a connected Freighter wallet and an on-chain project balance; only a confirmed Soroban result is added to retirement history.

The impact dashboard reads issuance, retirement, and project records from Soroban. Connect a funded Testnet wallet for read-only simulations, or set `VITE_GREEN_TOKEN_READ_ACCOUNT` to a public funded Testnet account to allow dashboard reads without connecting a wallet. The account address is public and is used only as the source for simulated read calls; never put a secret key in environment variables. Transaction history comes from Soroban RPC contract events for the queried recent ledger window (up to 1,000 events / 10,000 ledgers), subject to RPC retention. It is not a complete archive. Local project listings and browser transaction history are excluded from chain metrics. Missing or unreadable contract data is shown as unavailable rather than replaced with sample totals.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Local Development Server

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build and Lint

```bash
npm run build
npm run lint
npm run preview
```

### 5. Run Soroban Contract Tests

From the repository root:

```bash
cargo test --manifest-path contracts/carbon_credit/Cargo.toml
```

The contract tests cover unauthorized and over-limit issuance, verifier permissions and self-approval, rejection, transfer balance/status restrictions, retirement accounting, and duplicate retirement attempts.

## Integration boundary

The Soroban contract enforces issuance, retirement accounting, and internal project-credit transfers. Marketplace listing inventory and prices remain off-chain metadata, and the purchase UI does not yet have atomic on-chain payment and carbon-credit delivery. Retirement certificates are generated from confirmed contract results and printable through the browser's Save as PDF destination; local certificate history is not a replacement for querying the deployed contract. The React app's verification queue and audit display are browser-local prototypes; they are not an authoritative multi-user record and verification decisions are not yet sent to a deployed contract or carbon registry. Do not use this prototype to send payments or claim production-grade carbon credits until those integrations are deployed and independently reviewed.
