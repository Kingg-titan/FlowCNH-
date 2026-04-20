"use client";

import { useState, useEffect, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ROUTER_ABI, ROUTER_ADDRESS, ERC20_ABI } from "@/lib/contracts";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  CONFIGURED_STREAM_ASSET,
  HAS_OFFICIAL_AXCNH_CONFIG,
  STREAM_ASSET_LABEL,
  YIELD_PHASE_LABEL,
} from "@/lib/demoConfig";

const STREAM_ASSET = CONFIGURED_STREAM_ASSET;
const YIELD_ENABLED_IN_UI = false;

// Conflux eSpace gas estimation is unreliable — use fixed high limits
const GAS_APPROVE = 100_000n;
const GAS_CREATE = 2_000_000n;

type Step = "form" | "approving" | "waitApproval" | "creating" | "waitCreate" | "done";

export default function CreateStream() {
  const { isConnected, address } = useAccount();

  const [recipient, setRecipient] = useState("");
  const [ratePerDay, setRatePerDay] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [enableYield] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");

  // Store computed values in ref so they survive renders
  const pendingRef = useRef<{
    recipient: `0x${string}`;
    ratePerSecond: bigint;
    duration: bigint;
    deposit: bigint;
    enableYield: boolean;
  } | null>(null);

  const {
    writeContract: approve,
    data: approveHash,
    reset: resetApprove,
  } = useWriteContract();
  const {
    writeContract: create,
    data: createHash,
    reset: resetCreate,
  } = useWriteContract();

  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  const { isSuccess: createConfirmed } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: STREAM_ASSET,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Computed display values
  const ratePerSecond =
    ratePerDay && Number(ratePerDay) > 0
      ? parseUnits(ratePerDay, 18) / 86400n
      : 0n;
  const duration = durationDays ? Number(durationDays) * 86400 : 0;
  const totalDeposit = ratePerSecond * BigInt(duration);

  // ─── Step transitions via useEffect (not during render) ─────────

  // When approval tx confirms → fire createStream
  useEffect(() => {
    if (approveConfirmed && step === "waitApproval" && pendingRef.current) {
      const p = pendingRef.current;
      setStep("creating");
      create(
        {
          address: ROUTER_ADDRESS as `0x${string}`,
          abi: ROUTER_ABI,
          functionName: "createStream",
          args: [p.recipient, STREAM_ASSET, p.ratePerSecond, p.duration, p.enableYield],
          gas: GAS_CREATE,
        },
        {
          onSuccess: () => setStep("waitCreate"),
          onError: (err) => {
            setError(err.message.split("\n")[0]);
            setStep("form");
          },
        }
      );
    }
  }, [approveConfirmed, step]);

  // When create tx confirms → done
  useEffect(() => {
    if (createConfirmed && (step === "waitCreate" || step === "creating")) {
      setStep("done");
      pendingRef.current = null;
      refetchBalance();
    }
  }, [createConfirmed, step]);

  // ─── Submit handler ─────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!recipient || ratePerSecond === 0n || duration === 0) return;

    const deposit = ratePerSecond * BigInt(duration);

    pendingRef.current = {
      recipient: recipient as `0x${string}`,
      ratePerSecond,
      duration: BigInt(duration),
      deposit,
      enableYield,
    };

    setStep("approving");
    approve(
      {
        address: STREAM_ASSET,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ROUTER_ADDRESS as `0x${string}`, deposit],
        gas: GAS_APPROVE,
      },
      {
        onSuccess: () => setStep("waitApproval"),
        onError: (err) => {
          setError(err.message.split("\n")[0]);
          setStep("form");
        },
      }
    );
  }

  function handleReset() {
    setStep("form");
    setRecipient("");
    setRatePerDay("");
    setDurationDays("");
    setError("");
    pendingRef.current = null;
    resetApprove();
    resetCreate();
  }

  // ─── Render ─────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center pt-24 text-center">
        <h1 className="mb-4 text-3xl font-bold">Create Stream</h1>
        <p className="mb-8 text-gray-400">
          Connect your wallet to create a payment stream
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-lg pt-16 text-center">
        <div className="card space-y-6">
          <div className="text-5xl">&#9989;</div>
          <h2 className="text-2xl font-bold">Stream Created!</h2>
          <p className="text-gray-400">
            Your payment stream is now active. The recipient will start accruing
            {STREAM_ASSET_LABEL} every second.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/dashboard" className="btn-primary">
              View Dashboard
            </a>
            <button className="btn-secondary" onClick={handleReset}>
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const busy = step !== "form";
  const buttonLabel: Record<Step, string> = {
    form: "Create Stream",
    approving: "Step 1/2 — Approve in Wallet...",
    waitApproval: "Step 1/2 — Confirming Approval...",
    creating: "Step 2/2 — Confirm in Wallet...",
    waitCreate: "Step 2/2 — Confirming Stream...",
    done: "Done",
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-3xl font-bold">Create Stream</h1>
      <p className="mb-8 text-gray-400">
        Set up a real-time payment stream to a recipient
      </p>

      {!HAS_OFFICIAL_AXCNH_CONFIG && (
        <div className="card mb-6 border-yellow-500/30 bg-yellow-500/10 text-sm text-yellow-100">
          This deployment is connected to a testnet {STREAM_ASSET_LABEL}. Until
          an official AxCNH testnet contract is published, the live AxCNH
          address documented by Conflux is mainnet-only.
        </div>
      )}

      {/* Balance banner */}
      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Your {STREAM_ASSET_LABEL} Balance</p>
          <p className="text-xl font-bold">
            {tokenBalance !== undefined
              ? Number(formatUnits(tokenBalance as bigint, 18)).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 2 }
                )
              : "..."}{" "}
            <span className="text-sm font-normal text-gray-400">{STREAM_ASSET_LABEL}</span>
          </p>
        </div>
        {tokenBalance !== undefined && (tokenBalance as bigint) === 0n && (
          <a href="/faucet" className="btn-secondary text-sm">
            Funding Notes
          </a>
        )}
      </div>

      {error && (
        <div className="card mb-6 border-accent-red/30 bg-accent-red/10 text-sm text-accent-red">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Recipient Address</label>
          <input
            type="text"
            className="input"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={busy}
            required
          />
        </div>

        <div>
          <label className="label">Payment Rate ({STREAM_ASSET_LABEL} per day)</label>
          <input
            type="number"
            className="input"
            placeholder="25.00"
            step="0.01"
            min="0.01"
            value={ratePerDay}
            onChange={(e) => setRatePerDay(e.target.value)}
            disabled={busy}
            required
          />
          {ratePerSecond > 0n && (
            <p className="mt-1 text-xs text-gray-500">
              = {(Number(ratePerDay) / 86400).toFixed(8)} {STREAM_ASSET_LABEL}/sec
            </p>
          )}
        </div>

        <div>
          <label className="label">Duration (days)</label>
          <input
            type="number"
            className="input"
            placeholder="30"
            min="1"
            max="365"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            disabled={busy}
            required
          />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-4 text-sm text-gray-300">
          <p className="font-medium text-white">dForce Yield: {YIELD_PHASE_LABEL}</p>
          <p className="mt-1 text-gray-400">
            Yield is intentionally disabled in the live demo until the AxCNH
            lending route is verified end-to-end on-chain.
          </p>
        </div>

        {/* Summary */}
        {totalDeposit > 0n && (
          <div className="rounded-lg bg-gray-800/50 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-400">
              Stream Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Deposit</span>
                <span className="font-medium">
                  {Number(formatUnits(totalDeposit, 18)).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 4 }
                  )}{" "}
                  {STREAM_ASSET_LABEL}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration</span>
                <span>{durationDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Yield</span>
                <span>{YIELD_ENABLED_IN_UI ? "Enabled" : `${YIELD_PHASE_LABEL}`}</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full text-lg py-3"
          disabled={busy || !recipient || !ratePerDay || !durationDays}
        >
          {buttonLabel[step]}
        </button>
      </form>
    </div>
  );
}
