import { useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';

type CategoryItem = { id: number | null; name: string; count: number };
type TagItem = { id: number; name: string; count: number };

type DepartmentRow = {
    dep_id: string;
    total_tickets: number;
    resolved_count: number;
    avg_resolution_minutes: number | null;
    categories: CategoryItem[];
    tags: TagItem[];
};

type AssigneeRow = DepartmentRow & {
    assignee_id: number;
    assignee_name: string;
};

type UnitKerusakanItem = { dep_id: string; total_tickets: number };
type InsightItem = { name: string; count: number };

type Props = {
    departments: DepartmentRow[];
    byAssignee: AssigneeRow[];
    insightsUnitKerusakan: UnitKerusakanItem[];
    insightsTopCategories: InsightItem[];
    insightsTopTags: InsightItem[];
    filters: { from: string; to: string; dep_id: string | null; per_petugas: boolean };
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

export default function DepartmentReportPrint({
    departments,
    byAssignee,
    insightsUnitKerusakan,
    insightsTopCategories,
    insightsTopTags,
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

    const totalTickets = departments.reduce((s, d) => s + d.total_tickets, 0);
    const totalResolved = departments.reduce((s, d) => s + d.resolved_count, 0);
    const resolutionWeightedSum = departments.reduce(
        (s, d) => s + (d.avg_resolution_minutes ?? 0) * d.total_tickets,
        0,
    );
    const avgResolutionMinutes =
        totalTickets > 0 ? resolutionWeightedSum / totalTickets : null;
    const topUnit = insightsUnitKerusakan[0];
    const topCategory = insightsTopCategories[0];
    const topTag = insightsTopTags[0];

    return (
        <div className="bg-white text-neutral-950">
            <Head title="Export PDF - Laporan per Departemen" />

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
                        Laporan per Departemen
                    </h1>
                    <p className="text-sm text-neutral-600">
                        KPI dan rekomendasi untuk bahan rapat manajemen.
                    </p>
                    <div className="text-sm text-neutral-700">
                        <div>
                            Periode (closed_at): <strong>{filters.from}</strong>{' '}
                            s/d <strong>{filters.to}</strong>
                            {filters.dep_id ? (
                                <>
                                    {' '}
                                    • Departemen: <strong>{filters.dep_id}</strong>
                                </>
                            ) : null}
                            {' '}
                            • Breakdown per petugas:{' '}
                            <strong>{filters.per_petugas ? 'Ya' : 'Tidak'}</strong>
                        </div>
                        <div className="text-neutral-500">
                            Dicetak: {new Date(generatedAt).toLocaleString()}
                        </div>
                    </div>
                </header>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-neutral-200 p-4">
                        <div className="text-xs uppercase tracking-wide text-neutral-500">
                            Total tiket ditangani
                        </div>
                        <div className="mt-1 text-2xl font-bold">{totalTickets}</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 p-4">
                        <div className="text-xs uppercase tracking-wide text-neutral-500">
                            Tiket selesai (resolved)
                        </div>
                        <div className="mt-1 text-2xl font-bold">{totalResolved}</div>
                        {totalTickets > 0 ? (
                            <div className="text-xs text-neutral-500">
                                {Math.round((100 * totalResolved) / totalTickets)}% dari total
                            </div>
                        ) : null}
                    </div>
                    <div className="rounded-lg border border-neutral-200 p-4">
                        <div className="text-xs uppercase tracking-wide text-neutral-500">
                            Rata-rata waktu selesai
                        </div>
                        <div className="mt-1 text-2xl font-bold">
                            {formatDuration(avgResolutionMinutes)}
                        </div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 p-4">
                        <div className="text-xs uppercase tracking-wide text-neutral-500">
                            Unit dengan tiket terbanyak
                        </div>
                        <div className="mt-1 text-xl font-bold">
                            {topUnit
                                ? `${topUnit.dep_id} (${topUnit.total_tickets} tiket)`
                                : '-'}
                        </div>
                    </div>
                </section>

                {departments.length > 0 && (topUnit || topCategory || topTag || avgResolutionMinutes != null) && (
                    <section className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
                            Rekomendasi (berdasarkan data periode ini)
                        </h2>
                        <ul className="list-inside list-disc space-y-1.5 text-sm text-neutral-700">
                            {topUnit && (
                                <li>
                                    <strong>Unit prioritas:</strong> {topUnit.dep_id} memiliki
                                    tiket terbanyak ({topUnit.total_tickets}). Pertimbangkan
                                    pengecekan aset, pelatihan pengguna, atau penambahan
                                    dukungan IT.
                                </li>
                            )}
                            {topCategory && (
                                <li>
                                    <strong>Kategori prioritas:</strong> &quot;{topCategory.name}&quot; paling
                                    sering ({topCategory.count} tiket). Evaluasi penyebab
                                    berulang dan tindakan preventif atau dokumentasi.
                                </li>
                            )}
                            {topTag && (
                                <li>
                                    <strong>Tag terbanyak:</strong> &quot;{topTag.name}&quot; ({topTag.count}).
                                    Bisa dijadikan fokus perbaikan atau pengadaan.
                                </li>
                            )}
                            {departments.length > 0 && avgResolutionMinutes != null && (
                                <li>
                                    Rata-rata penyelesaian {formatDuration(avgResolutionMinutes)}{' '}
                                    — pantau SLA dan beban tim untuk periode berikutnya.
                                </li>
                            )}
                        </ul>
                    </section>
                )}

                {departments.length > 0 && (
                    <section className="rounded-lg border border-neutral-200 p-4">
                        <h2 className="mb-3 text-sm font-semibold">Rekap per Departemen</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[480px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 bg-neutral-50">
                                        <th className="px-3 py-2 text-left font-medium text-neutral-700">
                                            Departemen
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
                                    {departments
                                        .sort((a, b) => b.total_tickets - a.total_tickets)
                                        .map((dep) => (
                                            <tr
                                                key={dep.dep_id}
                                                className="border-b border-neutral-100"
                                            >
                                                <td className="px-3 py-2 font-medium">
                                                    {dep.dep_id}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {dep.total_tickets}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {dep.resolved_count}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {formatDuration(dep.avg_resolution_minutes)}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {(insightsUnitKerusakan.length > 0 ||
                    insightsTopCategories.length > 0 ||
                    insightsTopTags.length > 0) && (
                    <section className="rounded-lg border border-neutral-200 p-4">
                        <h2 className="text-sm font-semibold">Insight & Data (Top 10)</h2>
                        <p className="mt-1 text-xs text-neutral-500">
                            Unit, kategori, dan tag yang paling sering muncul dalam periode ini.
                        </p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-3">
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Unit tiket terbanyak
                                </div>
                                <ol className="mt-2 space-y-1 text-sm">
                                    {insightsUnitKerusakan.slice(0, 10).map((x) => (
                                        <li key={x.dep_id} className="flex justify-between gap-3">
                                            <span className="truncate">{x.dep_id}</span>
                                            <span className="tabular-nums text-neutral-700">
                                                {x.total_tickets}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Kategori terbanyak
                                </div>
                                <ol className="mt-2 space-y-1 text-sm">
                                    {insightsTopCategories.slice(0, 10).map((x) => (
                                        <li key={x.name} className="flex justify-between gap-3">
                                            <span className="truncate">{x.name}</span>
                                            <span className="tabular-nums text-neutral-700">
                                                {x.count}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                    Tag terbanyak
                                </div>
                                <ol className="mt-2 space-y-1 text-sm">
                                    {insightsTopTags.slice(0, 10).map((x) => (
                                        <li key={x.name} className="flex justify-between gap-3">
                                            <span className="truncate">{x.name}</span>
                                            <span className="tabular-nums text-neutral-700">
                                                {x.count}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </section>
                )}

                <section className="space-y-6">
                    {departments.length > 0 && (
                        <h2 className="text-sm font-semibold text-neutral-800">
                            Detail per Departemen
                        </h2>
                    )}
                    {departments.length === 0 ? (
                        <div className="rounded-lg border border-neutral-200 p-6 text-sm text-neutral-600">
                            Tidak ada data tiket ditutup dalam periode ini.
                        </div>
                    ) : (
                        departments.map((dep, idx) => (
                            <div
                                key={dep.dep_id}
                                className={idx === 0 ? '' : 'print-break'}
                            >
                                <div className="rounded-lg border border-neutral-200 p-4">
                                    <div className="flex flex-wrap items-end justify-between gap-3">
                                        <h2 className="text-lg font-semibold">
                                            Departemen: {dep.dep_id}
                                        </h2>
                                        <div className="text-sm text-neutral-700">
                                            <span className="font-semibold">
                                                {dep.total_tickets}
                                            </span>{' '}
                                            tiket •{' '}
                                            <span className="font-semibold">
                                                {dep.resolved_count}
                                            </span>{' '}
                                            resolved • Rata-rata:{' '}
                                            <span className="font-semibold">
                                                {formatDuration(dep.avg_resolution_minutes)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                                Kategori
                                            </div>
                                            {dep.categories.length === 0 ? (
                                                <div className="mt-2 text-sm text-neutral-600">
                                                    -
                                                </div>
                                            ) : (
                                                <ul className="mt-2 space-y-1 text-sm">
                                                    {dep.categories
                                                        .sort((a, b) => b.count - a.count)
                                                        .map((c) => (
                                                            <li
                                                                key={String(c.id) + c.name}
                                                                className="flex justify-between gap-3"
                                                            >
                                                                <span className="truncate">
                                                                    {c.name}
                                                                </span>
                                                                <span className="tabular-nums text-neutral-700">
                                                                    {c.count}
                                                                </span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                                Tag
                                            </div>
                                            {dep.tags.length === 0 ? (
                                                <div className="mt-2 text-sm text-neutral-600">
                                                    -
                                                </div>
                                            ) : (
                                                <ul className="mt-2 space-y-1 text-sm">
                                                    {dep.tags
                                                        .sort((a, b) => b.count - a.count)
                                                        .map((t) => (
                                                            <li
                                                                key={String(t.id) + t.name}
                                                                className="flex justify-between gap-3"
                                                            >
                                                                <span className="truncate">
                                                                    {t.name}
                                                                </span>
                                                                <span className="tabular-nums text-neutral-700">
                                                                    {t.count}
                                                                </span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {filters.per_petugas ? (
                                        <div className="mt-6 border-t pt-4">
                                            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                                                Breakdown per petugas
                                            </div>
                                            <div className="mt-3 space-y-3">
                                                {byAssignee
                                                    .filter((a) => a.dep_id === dep.dep_id)
                                                    .sort((a, b) => b.total_tickets - a.total_tickets)
                                                    .map((a) => (
                                                        <div
                                                            key={a.assignee_id}
                                                            className="rounded-md border border-neutral-200 p-3"
                                                        >
                                                            <div className="flex flex-wrap items-end justify-between gap-2">
                                                                <div className="font-medium">
                                                                    {a.assignee_name}
                                                                </div>
                                                                <div className="text-sm text-neutral-700">
                                                                    {a.total_tickets} tiket •{' '}
                                                                    {a.resolved_count} resolved •{' '}
                                                                    {formatDuration(a.avg_resolution_minutes)}
                                                                </div>
                                                            </div>
                                                            {(a.categories.length > 0 || a.tags.length > 0) && (
                                                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                                                    <div>
                                                                        <div className="text-xs text-neutral-500">
                                                                            Kategori
                                                                        </div>
                                                                        <div className="mt-1 text-sm text-neutral-700">
                                                                            {a.categories
                                                                                .sort((x, y) => y.count - x.count)
                                                                                .map((x) => `${x.name} (${x.count})`)
                                                                                .join(', ') || '-'}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-neutral-500">
                                                                            Tag
                                                                        </div>
                                                                        <div className="mt-1 text-sm text-neutral-700">
                                                                            {a.tags
                                                                                .sort((x, y) => y.count - x.count)
                                                                                .map((x) => `${x.name} (${x.count})`)
                                                                                .join(', ') || '-'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <footer className="no-print pt-4 text-xs text-neutral-500">
                    PortalSifast • Export PDF (print) •{' '}
                    {typeof window !== 'undefined' ? window.location.href : ''}
                </footer>

                <div className="print-page-footer" aria-hidden>
                    PortalSifast — Laporan per Departemen • Periode {filters.from} s/d {filters.to} •
                    Dicetak {new Date(generatedAt).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}

