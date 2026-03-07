"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits } from "viem";
import { useWallet, publicClient } from "@/hooks/useWallet";
import {
  WINKY_DUEL_ADDRESS,
  WINKY_DUEL_ABI,
  MOCK_USDM_ADDRESS,
  ERC20_ABI,
  BLOCK_EXPLORER_URL,
} from "@/lib/constants";
import { DuelStatus } from "@/lib/types";

// Only this address can access the admin page
const ADMIN_ADDRESS = "0x55772979783e58BE37109eEa2C4AC83F755aA243".toLowerCase();

const PAGE_SIZE = 25;

interface DuelRow {
  id: bigint;
  creator: string;
  challenger: string;
  stake: string;
  creatorScore: number;
  challengerScore: number;
  status: DuelStatus;
}

export default function AdminPage() {
  const { authenticated, login, address, ready, getWalletClient } = useWallet();
  const [duels, setDuels] = useState<DuelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "settled" | "cancelled">("all");
  const [stats, setStats] = useState({
    totalDuels: 0,
    openDuels: 0,
    settledDuels: 0,
    cancelledDuels: 0,
    rakeBalance: "0",
    contractUsdm: "0",
  });

  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS;

  const fetchAllDuels = useCallback(async () => {
    setLoading(true);
    try {
      // Get total number of duels
      const nextId = (await publicClient.readContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "nextDuelId",
      })) as bigint;

      const total = Number(nextId);
      if (total === 0) {
        setDuels([]);
        setLoading(false);
        return;
      }

      // Fetch all duels via multicall
      const calls = Array.from({ length: total }, (_, i) => ({
        address: WINKY_DUEL_ADDRESS as `0x${string}`,
        abi: WINKY_DUEL_ABI,
        functionName: "getDuel" as const,
        args: [BigInt(i)],
      }));

      const results = await publicClient.multicall({ contracts: calls });

      const rows: DuelRow[] = [];
      let open = 0;
      let settled = 0;
      let cancelled = 0;

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status !== "success" || !r.result) continue;

        const d = r.result as {
          creator: string;
          challenger: string;
          stake: bigint;
          creatorScore: number;
          challengerScore: number;
          status: number;
        };

        const status = d.status as DuelStatus;
        if (status === DuelStatus.Open) open++;
        else if (status === DuelStatus.Settled) settled++;
        else if (status === DuelStatus.Cancelled) cancelled++;

        rows.push({
          id: BigInt(i),
          creator: d.creator,
          challenger: d.challenger,
          stake: parseFloat(formatUnits(d.stake, 18)).toFixed(2),
          creatorScore: d.creatorScore,
          challengerScore: d.challengerScore,
          status,
        });
      }

      setDuels(rows.reverse()); // Most recent first
      setStats((prev) => ({
        ...prev,
        totalDuels: total,
        openDuels: open,
        settledDuels: settled,
        cancelledDuels: cancelled,
      }));

      // Fetch rake balance + contract USDM balance
      const [rake, contractBal] = await Promise.all([
        publicClient.readContract({
          address: WINKY_DUEL_ADDRESS,
          abi: WINKY_DUEL_ABI,
          functionName: "rakeBalance",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: MOCK_USDM_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [WINKY_DUEL_ADDRESS],
        }) as Promise<bigint>,
      ]);

      setStats((prev) => ({
        ...prev,
        rakeBalance: parseFloat(formatUnits(rake, 18)).toFixed(2),
        contractUsdm: parseFloat(formatUnits(contractBal, 18)).toFixed(2),
      }));
    } catch (err) {
      console.error("Failed to fetch duels:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAllDuels();
  }, [isAdmin, fetchAllDuels]);

  const shortAddr = (addr: string) =>
    addr === "0x0000000000000000000000000000000000000000"
      ? "—"
      : `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const statusLabel = (s: DuelStatus) => {
    if (s === DuelStatus.Open) return "Open";
    if (s === DuelStatus.Settled) return "Settled";
    return "Cancelled";
  };

  const statusColor = (s: DuelStatus) => {
    if (s === DuelStatus.Open) return "text-yellow-400";
    if (s === DuelStatus.Settled) return "text-green-400";
    return "text-red-400";
  };

  // Filtered + paginated duels
  const filteredDuels = statusFilter === "all"
    ? duels
    : duels.filter((d) =>
        statusFilter === "open" ? d.status === DuelStatus.Open
          : statusFilter === "settled" ? d.status === DuelStatus.Settled
            : d.status === DuelStatus.Cancelled
      );
  const totalPages = Math.ceil(filteredDuels.length / PAGE_SIZE);
  const paginatedDuels = filteredDuels.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Not connected
  if (!authenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <span
            className="mx-auto mb-4 inline-block h-16 w-16"
            style={{
              WebkitMaskImage: "url(/logo-blinkit.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/logo-blinkit.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              backgroundColor: "var(--wink-text)",
            }}
          />
          <h1 className="mb-2 text-xl font-bold">Admin Panel</h1>
          <p className="mb-4 text-sm text-muted-foreground">Connect your wallet to access</p>
          <button
            onClick={login}
            disabled={!ready}
            className="rounded-lg bg-wink-pink px-6 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Connected but not admin
  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <span
            className="mx-auto mb-4 inline-block h-16 w-16"
            style={{
              WebkitMaskImage: "url(/logo-blinkit.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/logo-blinkit.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              backgroundColor: "var(--wink-text)",
            }}
          />
          <h1 className="mb-2 text-xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            This page is restricted to the contract owner.
          </p>
          <a href="/" className="mt-4 inline-block text-sm text-wink-pink hover:underline">
            ← Back to game
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="transition-opacity hover:opacity-80">
            <span
              className="inline-block h-10 w-10"
              style={{
                WebkitMaskImage: "url(/logo-blinkit.svg)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskImage: "url(/logo-blinkit.svg)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                backgroundColor: "var(--wink-text)",
              }}
            />
          </a>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        <button
          onClick={fetchAllDuels}
          disabled={loading}
          className="rounded-lg bg-wink-pink/10 px-4 py-2 text-xs font-semibold text-wink-pink transition-colors hover:bg-wink-pink/20"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Duels", value: stats.totalDuels, color: "text-wink-pink" },
          { label: "Open", value: stats.openDuels, color: "text-yellow-400" },
          { label: "Settled", value: stats.settledDuels, color: "text-green-400" },
          { label: "Cancelled", value: stats.cancelledDuels, color: "text-red-400" },
          { label: "Rake", value: `$${stats.rakeBalance}`, color: "text-wink-pink" },
          { label: "Contract USDM", value: `$${stats.contractUsdm}`, color: "text-wink-text" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-wink-border bg-card p-4"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Withdraw rake */}
      {parseFloat(stats.rakeBalance) > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-wink-border bg-card p-4">
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">
              Withdraw Rake — <span className="text-wink-pink">${stats.rakeBalance}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Sends accumulated rake to your wallet
            </div>
          </div>
          <button
            onClick={async () => {
              setWithdrawing(true);
              try {
                const wc = await getWalletClient();
                const hash = await wc.writeContract({
                  address: WINKY_DUEL_ADDRESS,
                  abi: WINKY_DUEL_ABI,
                  functionName: "withdrawRake",
                  args: [],
                  gas: 250_000n,
                });
                await publicClient.waitForTransactionReceipt({ hash });
                fetchAllDuels(); // refresh stats
              } catch (err) {
                console.error("Withdraw failed:", err);
              } finally {
                setWithdrawing(false);
              }
            }}
            disabled={withdrawing}
            className="rounded-lg bg-wink-pink px-5 py-2 text-xs font-bold text-white transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {withdrawing ? "Withdrawing..." : "Withdraw"}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-3 flex gap-1">
        {(["all", "open", "settled", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setStatusFilter(f); setPage(0); }}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              statusFilter === f
                ? "bg-wink-pink/10 text-wink-pink"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${duels.length})` : f === "open" ? `Open (${stats.openDuels})` : f === "settled" ? `Settled (${stats.settledDuels})` : `Cancelled (${stats.cancelledDuels})`}
          </button>
        ))}
      </div>

      {/* Duels table */}
      <div className="overflow-x-auto rounded-xl border border-wink-border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-wink-border bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Challenger</th>
              <th className="px-4 py-3 text-right">Stake</th>
              <th className="px-4 py-3 text-right">Creator Score</th>
              <th className="px-4 py-3 text-right">Challenger Score</th>
              <th className="px-4 py-3 text-right">Winner</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDuels.map((d) => {
              const winner =
                d.status === DuelStatus.Settled
                  ? d.creatorScore > d.challengerScore
                    ? "Creator"
                    : d.challengerScore > d.creatorScore
                      ? "Challenger"
                      : "Draw"
                  : "—";

              return (
                <tr
                  key={String(d.id)}
                  className="border-b border-wink-border/50 transition-colors hover:bg-card/50"
                >
                  <td className="px-4 py-2.5 font-mono font-bold">#{String(d.id)}</td>
                  <td className={`px-4 py-2.5 font-semibold ${statusColor(d.status)}`}>
                    {statusLabel(d.status)}
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    <a
                      href={`${BLOCK_EXPLORER_URL}/address/${d.creator}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-wink-pink hover:underline"
                    >
                      {shortAddr(d.creator)}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    <a
                      href={`${BLOCK_EXPLORER_URL}/address/${d.challenger}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-wink-pink hover:underline"
                    >
                      {shortAddr(d.challenger)}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">${d.stake}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{d.creatorScore}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {d.challengerScore || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold">
                    <span
                      className={
                        winner === "Creator"
                          ? "text-wink-pink"
                          : winner === "Challenger"
                            ? "text-wink-pink/70"
                            : ""
                      }
                    >
                      {winner}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredDuels.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No duels yet
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading all duels...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded px-3 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-[10px] text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded px-3 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
