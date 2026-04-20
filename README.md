# FlowCNH

Real-time contractor payroll for the CNH corridor on Conflux eSpace.

## What This Repo Demonstrates

FlowCNH is a payment streaming prototype for Asia-facing payroll flows:

- An employer funds a stream once.
- A worker accrues claimable balance every second.
- The worker can withdraw unlocked funds at any time.
- The dashboard is designed to show the "wow moment" live: the worker balance ticking up in real time.

## Current Verified Status

As of April 18, 2026, this repository is in a stricter and more honest state than the original hackathon draft:

- The public frontend is currently connected to a **testnet demo asset**, not the official AxCNH contract.
- The deployed testnet vault/router/NFT addresses in this repo are:
  - Vault: `0x09a1Bfac7fED8754f1EB37C802eEc9ED831A82F9`
  - Router: `0x2Cd74565C93BC180e29bE542047b06605e974ca0`
  - Stream NFT: `0x349CcB9d138bE918B1AcE5849EFdd5c4652c9CbB`
- Existing testnet streams in that deployment are using a demo ERC-20 asset, not official AxCNH.
- The frontend now labels dForce yield as **Phase 2** instead of presenting it as live.
- The dashboard now shows a second-by-second live ticker so the employer/worker side-by-side demo is obvious.

On April 20, 2026 I re-checked the configured testnet asset on-chain:

- Contract: `0xea1846c7acd8a1178f86a3d4ab3bf654daa2c275`
- `name()` returns `"Mock AxCNH"`
- `symbol()` returns `"mAxCNH"`

That confirms the current public testnet deployment is still using a mock token.

## Official AxCNH Source

I verified the official Conflux-published AxCNH reference from Conflux Forum:

- On **October 21, 2025**, the Conflux forum post **"关于 AnchorX 与 AxCNH"** stated that AxCNH had been issued on Conflux eSpace and linked the contract:
  - `0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e`
  - Source: https://forum.conflux.fun/t/anchorx-axcnh/22878
  - Explorer: https://evm.confluxscan.org/token/0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e

Important:

- I did **not** find an official Conflux or AnchorX source publishing a separate **AxCNH testnet** contract address.
- Because of that, this repo should not claim that the current public testnet demo is already streaming official AxCNH.
- I also searched Conflux public docs, Conflux forum posts, and public Discord invite pages on April 20, 2026 without finding a public AxCNH testnet contract address.

## dForce Status

The original README overstated the yield integration.

What is supported by official Conflux sources:

- Conflux announcements and forum posts in **October 2025** describe AxCNH becoming available in the dForce/Unitus ecosystem on Conflux eSpace.

What is supported by this repo right now:

- The contracts include a `DForceAdapter`.
- The active repo environment still has zero placeholders for live AxCNH and dForce market addresses.
- The current public demo should therefore describe dForce yield as **Phase 2**, not as a verified live feature.

## Demo Script

For judging, the cleanest demo is:

1. Open the FlowCNH dashboard in two browser windows.
2. Connect the employer wallet in one window and the worker wallet in the other.
3. Create a stream.
4. Keep both windows visible and narrate the worker's claimable balance increasing every second.
5. Frame the product as **real-time CNH corridor payroll on Conflux**, not generic payroll infrastructure.

Suggested intro:

> FlowCNH is a payroll rail for the offshore RMB corridor. Instead of waiting for batch payroll or wires, the worker sees CNH-denominated value unlock second by second on Conflux.

## Product Positioning

The strongest angle is not "payroll, but on-chain."

The strongest angle is:

- **CNH-native payroll and settlement**
- **Built for the Asia / Belt-and-Road corridor**
- **Real-time worker liquidity**
- **Conflux as the execution layer for programmable cross-border RMB flows**

## What Changed In The App

- The landing page now leans into the CNH corridor narrative.
- The app stops advertising an in-app AxCNH faucet.
- The "Funding" page documents the official AxCNH source and the current demo limitations.
- The stream cards now show a clearer live ticker for second-by-second accrual.
- dForce yield is presented as **Phase 2** until it is actually deployed and verified.

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Contracts

```bash
cd contracts
forge build
forge test -vvv
```

## Next Required On-Chain Step

To fully satisfy the "Best AxCNH Integration" judging bar, the next milestone is not another copy change. It is:

- deploy a FlowCNH instance wired to the real AxCNH contract that Conflux officially documents,
- fund that wallet with real AxCNH on the appropriate live network,
- create one live stream transaction,
- and capture that transaction plus the side-by-side accrual demo on video/screenshots.

Until that happens, the honest submission framing is:

- **real-time payroll streaming is live in the demo**
- **official AxCNH source is verified**
- **official AxCNH live-stream deployment is the next on-chain step**
