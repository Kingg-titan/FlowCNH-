import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { confluxESpaceTestnet } from "@/lib/chain";
import { VAULT_ABI, VAULT_ADDRESS, STREAM_NFT_ABI, STREAM_NFT_ADDRESS } from "@/lib/contracts";
import { STREAM_ASSET_LABEL, YIELD_PHASE_LABEL } from "@/lib/demoConfig";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowcnhxyz.vercel.app";

const client = createPublicClient({
  chain: confluxESpaceTestnet,
  transport: http(),
});

export async function GET(
  _request: Request,
  { params }: { params: { tokenId: string } }
) {
  const tokenId = BigInt(params.tokenId);

  try {
    const streamId = await client.readContract({
      address: STREAM_NFT_ADDRESS as `0x${string}`,
      abi: STREAM_NFT_ABI,
      functionName: "tokenIdToStreamId",
      args: [tokenId],
    });

    const stream = (await client.readContract({
      address: VAULT_ADDRESS as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "getStream",
      args: [streamId],
    })) as any;

    const ratePerDay =
      Number((stream.ratePerSecond ?? stream[3]) * 86400n) / 1e18;
    const status = ["Active", "Paused", "Cancelled", "Completed"][
      Number(stream.status ?? stream[9])
    ];

    return NextResponse.json({
      name: `FlowCNH Stream #${streamId.toString()}`,
      description: `Real-time ${STREAM_ASSET_LABEL} payment stream. Rate: ${ratePerDay.toFixed(2)} ${STREAM_ASSET_LABEL}/day. Status: ${status}. dForce yield remains ${YIELD_PHASE_LABEL}.`,
      image: `${APP_URL}/api/og/${tokenId}`,
      external_url: `${APP_URL}/dashboard`,
      attributes: [
        { trait_type: "Stream ID", value: streamId.toString() },
        { trait_type: "Status", value: status },
        { trait_type: `Rate (${STREAM_ASSET_LABEL}/day)`, value: ratePerDay.toFixed(4) },
        {
          trait_type: "Yield Enabled",
          value: (stream.yieldEnabled ?? stream[10]) ? "Yes" : YIELD_PHASE_LABEL,
        },
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "Stream not found" },
      { status: 404 }
    );
  }
}
