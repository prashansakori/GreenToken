import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  ArrowLeftRight,
  ArrowUpRight,
  CircleAlert,
  Coins,
  ExternalLink,
  Flame,
  Leaf,
  LoaderCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useGreenToken } from '../../context/GreenTokenContext';
import { useSorobanDashboard } from '../../hooks/useSorobanDashboard';
import { STELLAR_CONFIG } from '../../services/stellar';
import { RetireCreditsModal } from '../common/RetireCreditsModal';

type ActivityFilter = 'ALL' | 'ISSUE' | 'TRANSFER' | 'RETIRE';

const formatWhole = (value: bigint | null | undefined): string =>
  value === null || value === undefined ? '—' : value.toLocaleString();

const chartValue = (value: bigint): number | null => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    return null;
  }
  return Number(value);
};

const eventLabel: Record<Exclude<ActivityFilter, 'ALL'>, string> = {
  ISSUE: 'ISSUE',
  TRANSFER: 'TRANSFER',
  RETIRE: 'RETIRE'
};

export const DashboardPage: React.FC = () => {
  const { navigateTo, wallet } = useGreenToken();
  const dashboard = useSorobanDashboard(wallet.address);
  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<ActivityFilter>('ALL');

  const snapshot = dashboard.snapshot;
  const totalIssued = snapshot?.totalIssued ?? null;
  const totalRetired = snapshot?.totalRetired ?? null;
  const outstanding = totalIssued !== null && totalRetired !== null
    ? totalIssued - totalRetired
    : null;

  const projectNames = useMemo(
    () => new Map((snapshot?.projects || []).map(project => [project.projectId, project.name])),
    [snapshot?.projects]
  );
  const impactData = (snapshot?.projects || [])
    .map(project => ({
      projectId: project.projectId,
      projectName: project.name,
      projectLabel: project.name.length > 18 ? `${project.name.slice(0, 16)}…` : project.name,
      issued: chartValue(project.issued),
      retired: chartValue(project.retired)
    }))
    .filter(project => project.issued !== null && project.retired !== null)
    .sort((a, b) => (b.issued || 0) - (a.issued || 0))
    .slice(0, 12);
  const unsafeChartProjects = (snapshot?.projects.length || 0) - impactData.length;
  const allEvents = snapshot?.events || [];
  const filteredEvents = allEvents.filter(event => filterType === 'ALL' || event.type === filterType);
  const recentEvents = allEvents.slice(0, 6);

  const metricCards = [
    {
      label: 'Total credits issued',
      value: formatWhole(totalIssued),
      unit: 'tCO₂e',
      icon: <Leaf className="w-4 h-4" />,
      color: 'text-emerald-300'
    },
    {
      label: 'Outstanding credits',
      value: formatWhole(outstanding),
      unit: 'tCO₂e',
      icon: <Coins className="w-4 h-4" />,
      color: 'text-cyan-300'
    },
    {
      label: 'Retired credits',
      value: formatWhole(totalRetired),
      unit: 'credits',
      icon: <Flame className="w-4 h-4" />,
      color: 'text-amber-300'
    },
    {
      label: 'Verified projects',
      value: snapshot?.verifiedProjects?.toLocaleString() ?? '—',
      unit: 'approved on-chain',
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'text-teal-300'
    },
    {
      label: 'Total CO₂e retired',
      value: formatWhole(totalRetired),
      unit: 'tCO₂e',
      icon: <Activity className="w-4 h-4" />,
      color: 'text-violet-300'
    }
  ];

  return (
    <div className="min-h-screen bg-[#040d07] text-emerald-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-emerald-900/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 mb-2">
              <span className={`w-2 h-2 rounded-full ${snapshot ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {snapshot
                ? `Soroban Testnet • ledger #${snapshot.ledgerSequence}`
                : 'No live Soroban snapshot'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Carbon Impact Dashboard
            </h1>
            <p className="text-sm text-emerald-200/65 mt-2">
              Contract state and events from Stellar Testnet. Local demo inventory is excluded.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={dashboard.refresh}
              disabled={dashboard.isLoading || !dashboard.contractConfigured}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 disabled:opacity-50 border border-emerald-700/50 text-emerald-200 text-xs font-mono transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${dashboard.isLoading ? 'animate-spin' : ''}`} />
              Refresh chain data
            </button>
            <button
              onClick={() => setRetireModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-semibold text-xs font-mono transition-all"
            >
              <Flame className="w-4 h-4" />
              Retire credits
            </button>
            <button
              onClick={() => navigateTo('marketplace')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-700/50 text-emerald-200 text-xs font-mono transition-colors"
            >
              Marketplace <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-cyan-900/60 bg-cyan-950/20 px-4 py-3 text-xs text-cyan-100/80">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-cyan-300" />
          <p>
            <span className="font-semibold text-cyan-200">Live data only.</span>{' '}
            Metrics and charts below come from the configured Soroban contract. Browser-local project listings,
            prices, and transaction samples are not included; unavailable chain data is shown as “—”.
          </p>
        </div>

        {(dashboard.error || snapshot?.aggregateError || snapshot?.projectsError || snapshot?.eventsError) && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
            <div className="space-y-1">
              {dashboard.error && <p>{dashboard.error}</p>}
              {snapshot?.aggregateError && <p>Contract totals: {snapshot.aggregateError}</p>}
              {snapshot?.projectsError && <p>Project records: {snapshot.projectsError}</p>}
              {snapshot?.eventsError && <p>Contract events: {snapshot.eventsError}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {metricCards.map(card => (
            <div key={card.label} className="p-5 rounded-2xl bg-[#071c10] border border-emerald-800/40">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs uppercase font-mono text-emerald-300/70">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center ${card.color}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-3">{card.value}</p>
              <p className="text-[11px] font-mono text-emerald-400/70 mt-2">{card.unit}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
            <div className="pb-3 border-b border-emerald-900/40">
              <h2 className="text-base font-bold text-white">Project impact</h2>
              <p className="text-xs text-emerald-300/70 font-mono mt-1">
                Issued and retired tCO₂e from each on-chain project record
              </p>
            </div>
            <div className="h-80 w-full">
              {dashboard.isLoading && !snapshot ? (
                <div className="h-full flex items-center justify-center gap-2 text-sm text-emerald-300/70">
                  <LoaderCircle className="w-4 h-4 animate-spin" /> Reading Soroban state…
                </div>
              ) : impactData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={impactData} margin={{ top: 10, right: 12, left: 0, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f341d" opacity={0.6} />
                    <XAxis
                      dataKey="projectLabel"
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      height={55}
                      stroke="#6ee7b7"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6ee7b7"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={value => Number(value).toLocaleString()}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#06180e', borderColor: '#10b981', borderRadius: '12px', fontSize: '12px' }}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.projectName || ''}
                      formatter={(value, name) => [`${Number(value).toLocaleString()} tCO₂e`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="issued" name="Issued" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="retired" name="Retired" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-emerald-300/60 text-center px-6">
                  {snapshot?.projectsError
                    ? 'Project impact is unavailable because on-chain project records could not all be read.'
                    : 'No on-chain project records are available for this chart.'}
                </div>
              )}
            </div>
            {unsafeChartProjects > 0 && (
              <p className="text-[11px] text-amber-200/70">
                {unsafeChartProjects} project(s) omitted because their values exceed JavaScript chart precision.
              </p>
            )}
          </section>

          <section className="lg:col-span-4 p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl">
            <div className="pb-3 border-b border-emerald-900/40">
              <h2 className="text-base font-bold text-white">Recent blockchain transactions</h2>
              <p className="text-xs text-emerald-300/70 font-mono mt-1">
                Soroban contract events, newest first
              </p>
            </div>
            <div className="space-y-3 pt-4">
              {recentEvents.length ? recentEvents.map(event => (
                <div key={`${event.txHash}-${event.type}`} className="flex items-start justify-between gap-3 border-b border-emerald-950/80 pb-3 last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {event.type === 'TRANSFER'
                        ? <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-300" />
                        : event.type === 'RETIRE'
                          ? <Flame className="w-3.5 h-3.5 text-amber-300" />
                          : <Leaf className="w-3.5 h-3.5 text-emerald-300" />}
                      <span className="text-xs font-mono text-white">{eventLabel[event.type]}</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/70 truncate mt-1">
                      {projectNames.get(event.projectId) || `Project #${event.projectId}`}
                    </p>
                    <p className="text-[10px] text-emerald-500/80 mt-1">
                      Ledger #{event.ledger} · {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-200 whitespace-nowrap">
                    {formatWhole(event.amount)} t
                  </span>
                </div>
              )) : (
                <p className="py-8 text-center text-xs text-emerald-300/60">
                  {snapshot?.eventsError ? 'Live contract events are unavailable.' : 'No contract activity found in the queried ledger window.'}
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-emerald-900/40">
            <div>
              <h2 className="text-base font-bold text-white">On-chain project records</h2>
              <p className="text-xs text-emerald-300/70 font-mono mt-1">
                Project status and impact are read from Soroban, not local marketplace listings
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400/70">
              {snapshot?.verifiedProjects === null || snapshot?.verifiedProjects === undefined
                ? 'Verified count unavailable'
                : `${snapshot.verifiedProjects.toLocaleString()} approved on-chain`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-emerald-900/50 text-emerald-300/70 uppercase">
                  <th className="py-2.5 px-3">Soroban project</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Issued (tCO₂e)</th>
                  <th className="py-2.5 px-3 text-right">Retired (tCO₂e)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/80">
                {(snapshot?.projects || []).map(project => (
                  <tr key={project.projectId} className="hover:bg-emerald-950/30">
                    <td className="py-3 px-3 text-white">
                      {project.name}
                      <span className="block text-[10px] text-emerald-400/60 mt-1">ID #{project.projectId}</span>
                    </td>
                    <td className="py-3 px-3 text-emerald-200/80">{project.country}</td>
                    <td className="py-3 px-3">
                      <span className={project.status === 'APPROVED' ? 'text-emerald-300' : 'text-amber-200'}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-200">{formatWhole(project.issued)}</td>
                    <td className="py-3 px-3 text-right text-cyan-200">{formatWhole(project.retired)}</td>
                  </tr>
                ))}
                {!snapshot?.projects.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-emerald-300/60">
                      {snapshot?.projectsError ? 'On-chain project records could not be loaded.' : 'No on-chain project records available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="p-6 rounded-2xl bg-[#06180e] border border-emerald-800/40 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-3 border-b border-emerald-900/40">
            <div>
              <h2 className="text-base font-bold text-white">Credit activity history</h2>
              <p className="text-xs text-emerald-300/70 font-mono mt-1">
                Up to 1,000 contract events queried from ledger #{snapshot?.eventStartLedger ?? '—'} to #{snapshot?.ledgerSequence ?? '—'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs font-mono">
              {(['ALL', 'ISSUE', 'TRANSFER', 'RETIRE'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-2.5 py-1 rounded-lg border transition-colors ${
                    filterType === filter
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400/60 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-emerald-900/50 text-emerald-300/70 uppercase">
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Transaction</th>
                  <th className="py-2.5 px-3">Ledger</th>
                  <th className="py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/80">
                {filteredEvents.map(event => (
                  <tr key={`${event.txHash}-${event.type}`} className="hover:bg-emerald-950/30">
                    <td className="py-3 px-3 text-white">{eventLabel[event.type]}</td>
                    <td className="py-3 px-3 text-emerald-200">
                      {projectNames.get(event.projectId) || `Project #${event.projectId}`}
                    </td>
                    <td className="py-3 px-3 text-emerald-200">{formatWhole(event.amount)} tCO₂e</td>
                    <td className="py-3 px-3">
                      <a
                        href={STELLAR_CONFIG.explorerTxUrl(event.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-300 hover:text-white inline-flex items-center gap-1"
                      >
                        {event.txHash.slice(0, 8)}…{event.txHash.slice(-6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-3 text-emerald-300/80">#{event.ledger}</td>
                    <td className="py-3 px-3 text-emerald-400/70">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!filteredEvents.length && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-emerald-300/60">
                      {snapshot?.eventsError ? 'Live activity history is unavailable.' : 'No matching contract events in this ledger window.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-emerald-500/70 font-mono">
            Event history is limited to the configured recent ledger window and Soroban RPC retention; it is not presented as a complete archival index.
          </p>
        </section>
      </div>

      {retireModalOpen && (
        <RetireCreditsModal isOpen={true} onClose={() => setRetireModalOpen(false)} />
      )}
    </div>
  );
};
