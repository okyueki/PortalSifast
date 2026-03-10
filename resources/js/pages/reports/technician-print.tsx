import { useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';

type CategoryItem = { id: number | null; name: string; count: number };
type TagItem = { id: number; name: string; count: number };
type TechnicianRow = {
    id: number;
    name: string;
    dep_id: string | null;
    total_tickets: number;
    resolved_count: number;
    avg_resolution_minutes: number | null;
    categories: CategoryItem[];
    tags: TagItem[];
};
type Kpi = {
    resolution_rate_percent: number | null;
    avg_resolution_minutes: number | null;
    total_tickets: number;
    resolved_count: number;
};

type Props = {
    technician: { id: number; name: string; dep_id: string | null } | null;
    technicians: TechnicianRow[];
    totalTickets: number;
    resolvedCount: number;
    avgResolutionMinutes: number | null;
    categories: CategoryItem[];
    tags: TagItem[];
    kpi: Kpi | null;
    insights: string[];
    recommendations: string[];
    filters: { from: string; to: string; assignee_id: number | string | null };
    generatedAt: string;
};

function formatDuration(minutes: number | null): string {
    if (minutes == null || minutes === 0) return '-';
    if (minutes < 60) return `${Math.round(minutes)} menit`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(1)} jam`;
    const days = hours / 24;
    return `${days.toFixed(1)} hari`;
}

export default function TechnicianReportPrint({
    technician,
    technicians,
    totalTickets,
    resolvedCount,
    avgResolutionMinutes,
    categories,
    tags,
    kpi,
    insights,
    recommendations,
    filters,
    generatedAt,
}: Props) {
    const isAutoPrint = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return new URLSearchParams(window.location.search).get('autoprint') === '1';
    }, []);

    useEffect(() => {
        if (!isAutoPrint) return;
        const t = window.setTimeout(() => window.print(), 250);
        return () => window.clearTimeout(t);
    }, [isAutoPrint]);

    const isAllMode = technicians.length > 0 && !technician;

    return (
        <div className="bg-white text-neutral-950">
            <Head title="Export PDF - Laporan per Teknisi" />

            <style>{`
@media print {
  .no-print { display: none !important; }
  .print-break { break-before: page; page-break-before: always; }
  .print-page-footer { display: block !important; }
  body { padding-bottom: 32px; }
}
.print-page-footer {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: 10px;
  color: #737373;
  padding: 8px 24px;
  border-top: 1px solid #e5e5e5;
  background: #fafafa;
}
`}</style>

            <div className="no-print sticky top-0 z-10 border-b bg-white/90 px-6 py-3 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                    <div className="text-sm text-neutral-600">
                        Tip: tekan <strong>Ctrl/Cmd + P</strong> lalu pilih{' '}
                        <strong>Save as PDF</strong>.
                    </div>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                    >
                        Print / Save as PDF
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
                <header className="space-y-2 border-b border-neutral-200 pb-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        PortalSifast
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Laporan per Teknisi
                    </h1>
                    <p className="text-sm text-neutral-600">
                        Tiket yang ditangani per teknisi (closed_at).{' '}
                        {isAllMode ? 'Semua teknisi.' : 'Satu teknisi.'}
                    </p>
                    <div className="text-sm text-neutral-700">
                        <div>
                            Periode: <strong>{filters.from}</strong> s/d{' '}
                            <strong>{filters.to}</strong>
                            {!isAllMode && technician && (
                                <> • Teknisi: <strong>{technician.name}</strong></>
                            )}
                        </div>
                        <div className="text-neutral-500">
                            Dicetak: {new Date(generatedAt).toLocaleString()}
                        </div>
                    </div>
                </header>

                {isAllMode ? (
                    <>
                        <section className="rounded-lg border border-neutral-200 p-4">
                            <h2 className="mb-3 text-sm font-semibold">Rekap Semua Teknisi</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-200 bg-neutral-50">
                                            <th className="px-3 py-2 text-left font-medium text-neutral-700">
                                                Teknisi
                                            </th>
                                            <th className="px-3 py-2 text-left font-medium text-neutral-700">
                                                Dep
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-neutral-700">
                                                Tiket
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-neutral-700">
                                                Resolved
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-neutral-700">
                                                Rata-rata
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {technicians.map((t) => (
                                            <tr key={t.id} className="border-b border-neutral-100">
                                                <td className="px-3 py-2 font-medium">{t.name}</td>
                                                <td className="px-3 py-2 text-neutral-600">{t.dep_id ?? '-'}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{t.total_tickets}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{t.resolved_count}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {formatDuration(t.avg_resolution_minutes)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 text-sm text-neutral-600">
                                Total: {technicians.reduce((s, t) => s + t.total_tickets, 0)} tiket • Resolved:{' '}
                                {technicians.reduce((s, t) => s + t.resolved_count, 0)}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-sm font-semibold">Detail per Teknisi</h2>
                            {technicians.map((tech, idx) => (
                                <div
                                    key={tech.id}
                                    className={idx === 0 ? '' : 'print-break'}
                                >
                                    <div className="rounded-lg border border-neutral-200 p-4">
                                        <div className="flex flex-wrap items-end justify-between gap-2">
                                            <h3 className="font-semibold">
                                                {tech.name}
                                                {tech.dep_id && (
                                                    <span className="ml-2 text-sm font-normal text-neutral-600">
                                                        ({tech.dep_id})
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="text-sm text-neutral-700">
                                                {tech.total_tickets} tiket • {tech.resolved_count} resolved •{' '}
                                                {formatDuration(tech.avg_resolution_minutes)}
                                            </div>
                                        </div>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <div className="text-xs text-neutral-500">Kategori</div>
                                                <div className="mt-1 text-sm text-neutral-700">
                                                    {tech.categories.length === 0
                                                        ? '-'
                                                        : tech.categories
                                                              .sort((a, b) => b.count - a.count)
                                                              .map((c) => `${c.name} (${c.count})`)
                                                              .join(', ')}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-neutral-500">Tag</div>
                                                <div className="mt-1 text-sm text-neutral-700">
                                                    {tech.tags.length === 0
                                                        ? '-'
                                                        : tech.tags
                                                              .sort((a, b) => b.count - a.count)
                                                              .map((t) => `${t.name} (${t.count})`)
                                                              .join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </>
                ) : technician ? (
                    <>
                        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border border-neutral-200 p-4">
                                <div className="text-xs uppercase tracking-wide text-neutral-500">
                                    Tiket ditangani
                                </div>
                                <div className="mt-1 text-2xl font-bold">{totalTickets}</div>
                            </div>
                            <div className="rounded-lg border border-neutral-200 p-4">
                                <div className="text-xs uppercase tracking-wide text-neutral-500">
                                    Tiket selesai (resolved)
                                </div>
                                <div className="mt-1 text-2xl font-bold">{resolvedCount}</div>
                                {totalTickets > 0 && (
                                    <div className="text-xs text-neutral-500">
                                        {Math.round((100 * resolvedCount) / totalTickets)}%
                                    </div>
                                )}
                            </div>
                            <div className="rounded-lg border border-neutral-200 p-4">
                                <div className="text-xs uppercase tracking-wide text-neutral-500">
                                    Rata-rata waktu selesai
                                </div>
                                <div className="mt-1 text-2xl font-bold">
                                    {formatDuration(avgResolutionMinutes)}
                                </div>
                            </div>
                            {kpi && (
                                <div className="rounded-lg border border-neutral-200 p-4">
                                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                                        Tingkat penyelesaian
                                    </div>
                                    <div className="mt-1 text-2xl font-bold">
                                        {kpi.resolution_rate_percent != null
                                            ? `${kpi.resolution_rate_percent}%`
                                            : '-'}
                                    </div>
                                </div>
                            )}
                        </section>

                        {kpi && totalTickets > 0 && (
                            <>
                                {insights.length > 0 && (
                                    <section className="rounded-lg border border-neutral-200 bg-emerald-50/50 p-4">
                                        <h2 className="mb-2 text-sm font-semibold">Insight</h2>
                                        <ul className="list-inside list-disc space-y-1 text-sm text-neutral-700">
                                            {insights.map((line, i) => (
                                                <li key={i}>{line}</li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                                {recommendations.length > 0 && (
                                    <section className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                                        <h2 className="mb-2 text-sm font-semibold">Rekomendasi</h2>
                                        <ul className="list-inside list-disc space-y-1 text-sm text-neutral-700">
                                            {recommendations.map((line, i) => (
                                                <li key={i}>{line}</li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </>
                        )}

                        <section className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-neutral-200 p-4">
                                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Kategori
                                </h3>
                                {categories.length === 0 ? (
                                    <p className="mt-2 text-sm text-neutral-600">-</p>
                                ) : (
                                    <ul className="mt-2 space-y-1 text-sm">
                                        {categories
                                            .sort((a, b) => b.count - a.count)
                                            .map((c) => (
                                                <li key={c.name} className="flex justify-between gap-3">
                                                    <span>{c.name}</span>
                                                    <span className="tabular-nums text-neutral-700">{c.count}</span>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                            <div className="rounded-lg border border-neutral-200 p-4">
                                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Tag
                                </h3>
                                {tags.length === 0 ? (
                                    <p className="mt-2 text-sm text-neutral-600">-</p>
                                ) : (
                                    <ul className="mt-2 space-y-1 text-sm">
                                        {tags
                                            .sort((a, b) => b.count - a.count)
                                            .map((t) => (
                                                <li key={t.id} className="flex justify-between gap-3">
                                                    <span>{t.name}</span>
                                                    <span className="tabular-nums text-neutral-700">{t.count}</span>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    </>
                ) : (
                    <section className="rounded-lg border border-neutral-200 p-6 text-sm text-neutral-600">
                        Pilih teknisi dan periode untuk melihat laporan.
                    </section>
                )}

                <div className="print-page-footer" aria-hidden>
                    PortalSifast — Laporan per Teknisi • Periode {filters.from} s/d {filters.to} •
                    Dicetak {new Date(generatedAt).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
