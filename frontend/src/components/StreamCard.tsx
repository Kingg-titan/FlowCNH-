"use client";

import { useEffect, useMemo, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VAULT_ABI, VAULT_ADDRESS, ROUTER_ABI, ROUTER_ADDRESS } from "@/lib/contracts";
import { useClaimableBalance } from "@/hooks/useStreams";
import { STREAM_ASSET_LABEL, YIELD_PHASE_LABEL } from "@/lib/demoConfig";
import {
  formatAxCNH,
  formatRate,
  formatDuration,
  streamProgress,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/utils";

interface StreamCardProps {
  streamId: bigint;
  stream: {
    sender: `0x${string}`;
    recipient: `0x${string}`;
    asset: `0x${string}`;
    ratePerSecond: bigint;
    startTime: bigint;
    stopTime: bigint;
    totalDeposited: bigint;
    totalClaimed: bigint;
    status: number;
    yieldEnabled: boolean;
  };
  isEmployer: boolean;
}

export function StreamCard({ streamId, stream, isEmployer }: StreamCardProps) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [claimableAnchor, setClaimableAnchor] = useState<{
    amount: bigint;
    timestamp: number;
  } | null>(null);
  const { data: claimable, refetch } = useClaimableBalance(streamId);

  const { writeContract: claim, data: claimHash } = useWriteContract();
  const { writeContract: pause, data: pauseHash } = useWriteContract();
  const { writeContract: resume, data: resumeHash } = useWriteContract();
  const { writeContract: cancel, data: cancelHash } = useWriteContract();

  const { isLoading: claiming } = useWaitForTransactionReceipt({ hash: claimHash });
  const { isLoading: pausing } = useWaitForTransactionReceipt({ hash: pauseHash });
  const { isLoading: resuming } = useWaitForTransactionReceipt({ hash: resumeHash });
  const { isLoading: cancelling } = useWaitForTransactionReceipt({ hash: cancelHash });

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const refresh = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(refresh);
  }, [refetch]);

  useEffect(() => {
    if (claimable === undefined) return;
    setClaimableAnchor({
      amount: claimable,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }, [claimable]);

  const progress = streamProgress(
    Number(stream.startTime),
    Number(stream.stopTime),
    now
  );

  const remaining = Number(stream.stopTime) - now;
  const isActive = stream.status === 0;
  const isPaused = stream.status === 1;
  const cappedNow = Math.min(now, Number(stream.stopTime));

  const displayedClaimable = useMemo(() => {
    if (!claimableAnchor) return claimable;
    if (!isActive) return claimableAnchor.amount;

    const secondsSinceAnchor = Math.max(0, cappedNow - claimableAnchor.timestamp);
    const remainingDeposit = stream.totalDeposited - stream.totalClaimed;
    const liveAccrual = claimableAnchor.amount + (stream.ratePerSecond * BigInt(secondsSinceAnchor));
    return liveAccrual > remainingDeposit ? remainingDeposit : liveAccrual;
  }, [
    cappedNow,
    claimable,
    claimableAnchor,
    isActive,
    stream.ratePerSecond,
    stream.totalClaimed,
    stream.totalDeposited,
  ]);

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-400">
            Stream #{streamId.toString()}
          </span>
          {isActive && (
            <span className="stream-pulse inline-block h-2.5 w-2.5" />
          )}
        </div>
        <span className={`text-sm font-medium ${STATUS_COLORS[stream.status]}`}>
          {STATUS_LABELS[stream.status]}
        </span>
      </div>

      {/* Rate and Balance */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Rate</p>
          <p className="text-lg font-semibold">{formatRate(stream.ratePerSecond)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Claimable</p>
          <p className="text-lg font-semibold text-accent-green">
            {displayedClaimable !== undefined ? formatAxCNH(displayedClaimable) : "..."}{" "}
            {STREAM_ASSET_LABEL}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isActive ? "Live ticker updates every second" : "Updates from on-chain state"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>{formatAxCNH(stream.totalClaimed)} claimed</span>
          <span>{formatAxCNH(stream.totalDeposited)} total</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>{progress}%</span>
          <span>
            {remaining > 0 ? `${formatDuration(remaining)} remaining` : "Completed"}
          </span>
        </div>
      </div>

      {/* Yield badge */}
      {stream.yieldEnabled && (
        <div className="flex items-center gap-2 rounded-lg bg-accent-green/10 px-3 py-2 text-xs text-accent-green">
          <span>Yield enabled via dForce Unitus</span>
        </div>
      )}
      {!stream.yieldEnabled && (
        <div className="flex items-center gap-2 rounded-lg bg-gray-900/80 px-3 py-2 text-xs text-gray-400">
          <span>dForce yield is currently scoped for {YIELD_PHASE_LABEL}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {!isEmployer && (isActive || isPaused) && (
          <button
            className="btn-primary flex-1"
            disabled={claiming || !displayedClaimable || displayedClaimable === 0n}
            onClick={() =>
              claim({
                address: VAULT_ADDRESS as `0x${string}`,
                abi: VAULT_ABI,
                functionName: "claim",
                args: [streamId],
                gas: 500_000n,
              })
            }
          >
            {claiming ? "Claiming..." : "Withdraw"}
          </button>
        )}

        {isEmployer && isActive && (
          <>
            <button
              className="btn-secondary flex-1"
              disabled={pausing}
              onClick={() =>
                pause({
                  address: ROUTER_ADDRESS as `0x${string}`,
                  abi: ROUTER_ABI,
                  functionName: "pauseStream",
                  args: [streamId],
                  gas: 500_000n,
                })
              }
            >
              {pausing ? "Pausing..." : "Pause"}
            </button>
            <button
              className="btn-danger flex-1"
              disabled={cancelling}
              onClick={() =>
                cancel({
                  address: ROUTER_ADDRESS as `0x${string}`,
                  abi: ROUTER_ABI,
                  functionName: "cancelStream",
                  args: [streamId],
                  gas: 500_000n,
                })
              }
            >
              {cancelling ? "Cancelling..." : "Cancel"}
            </button>
          </>
        )}

        {isEmployer && isPaused && (
          <button
            className="btn-secondary flex-1"
            disabled={resuming}
            onClick={() =>
              resume({
                address: ROUTER_ADDRESS as `0x${string}`,
                abi: ROUTER_ABI,
                functionName: "resumeStream",
                args: [streamId],
                gas: 500_000n,
              })
            }
          >
            {resuming ? "Resuming..." : "Resume"}
          </button>
        )}
      </div>
    </div>
  );
}
