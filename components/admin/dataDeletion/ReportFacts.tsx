import type { DeletionReport } from "@/app/types/dataDeletion";

/** The numbers of a report: what is in the storage, the storage check results and the ghosts. */
export function ReportFacts({ report }: { report: DeletionReport }) {
  const objectCounts = Object.entries(report.objectCounts ?? {});
  const proof = Object.entries(report.proof ?? {});

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
      <div>
        <dt className="text-neutral-500">Ghosts (recorded but already gone)</dt>
        <dd className="font-semibold text-neutral-900">{report.ghostCount}</dd>
      </div>
      <div>
        <dt className="text-neutral-500">Objects counted</dt>
        <dd className="font-semibold text-neutral-900 break-words">
          {objectCounts.length === 0
            ? "Not counted"
            : objectCounts.map(([key, n]) => `${key}: ${n}`).join(" · ")}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-neutral-500">Storage check results</dt>
        <dd className="font-semibold text-neutral-900 break-words">
          {proof.length === 0
            ? "Proof not needed or not available"
            : proof.map(([key, result]) => `${key}: ${result}`).join(" · ")}
        </dd>
      </div>
    </dl>
  );
}
