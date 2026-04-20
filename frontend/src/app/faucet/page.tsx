"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  CONFIGURED_STREAM_ASSET,
  HAS_OFFICIAL_AXCNH_CONFIG,
  OFFICIAL_AXCNH_MAINNET_ADDRESS,
  STREAM_ASSET_LABEL,
  YIELD_PHASE_LABEL,
} from "@/lib/demoConfig";

export default function FundingPage() {
  const { isConnected } = useAccount();

  return (
    <div className="mx-auto max-w-3xl pt-8">
      <h1 className="mb-2 text-3xl font-bold">Funding and Proof Notes</h1>
      <p className="mb-8 text-gray-400">
        This page keeps the demo honest: which asset is wired today, which
        address Conflux officially documents for AxCNH, and what still belongs
        in {YIELD_PHASE_LABEL}.
      </p>

      <div className="space-y-6">
        <section className="card space-y-3">
          <h2 className="text-xl font-semibold">Current frontend asset</h2>
          <p className="text-sm text-gray-400">
            Configured asset:{" "}
            <span className="font-mono text-gray-200">{CONFIGURED_STREAM_ASSET}</span>
          </p>
          <p className="text-sm text-gray-400">
            Status:{" "}
            {HAS_OFFICIAL_AXCNH_CONFIG
              ? "Official AxCNH is configured in this deployment."
              : `This deployment is still using a ${STREAM_ASSET_LABEL}, not the official AxCNH contract.`}
          </p>
        </section>

        <section className="card space-y-3">
          <h2 className="text-xl font-semibold">Official AxCNH source</h2>
          <p className="text-sm text-gray-400">
            Conflux forum post “关于 AnchorX 与 AxCNH” published on October 21,
            2025 lists the live Conflux eSpace AxCNH contract as:
          </p>
          <p className="rounded-lg bg-gray-900 px-4 py-3 font-mono text-sm text-white">
            {OFFICIAL_AXCNH_MAINNET_ADDRESS}
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href="https://forum.conflux.fun/t/anchorx-axcnh/22878"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              Conflux forum source
            </a>
            <a
              href={`https://evm.confluxscan.org/token/${OFFICIAL_AXCNH_MAINNET_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              ConfluxScan token page
            </a>
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="text-xl font-semibold">Demo checklist</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>1. Open employer and worker dashboards side by side.</li>
            <li>2. Create a stream and leave both views visible.</li>
            <li>3. Narrate the worker claimable balance ticking every second.</li>
            <li>4. If asked about yield, present it as {YIELD_PHASE_LABEL} unless a live dForce path is deployed and verified.</li>
          </ul>
        </section>

        {!isConnected && (
          <section className="card flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-gray-400">
              Connect a wallet if you want to continue into the dashboard or
              create flow from here.
            </p>
            <ConnectButton />
          </section>
        )}
      </div>
    </div>
  );
}
