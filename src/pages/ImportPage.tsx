import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { DATASET_CONFIGS } from "../types/datasets";
import { parsePastedText, ParseResult } from "../utils/importParser";

const BATCH_SIZE = 200;

type ImportSummary = {
  totalRows: number;
  validRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

function splitInBatches<T>(input: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < input.length; index += size) {
    output.push(input.slice(index, index + size));
  }
  return output;
}

export function ImportPage() {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const previewRows = useMemo(() => parsed?.validRows.slice(0, 10) ?? [], [parsed]);

  function handleAnalyze() {
    const result = parsePastedText(rawText);
    setParsed(result);
    setSummary(null);
  }

  async function handleImport() {
    if (!parsed?.dataset) {
      return;
    }

    const config = DATASET_CONFIGS[parsed.dataset];
    const baseSummary: ImportSummary = {
      totalRows: parsed.totalRows,
      validRows: parsed.validRows.length,
      inserted: 0,
      updated: 0,
      skipped: parsed.skippedRows,
      errors: parsed.errors.map((error) => `Row ${error.rowNumber}: ${error.message}`)
    };

    if (parsed.validRows.length === 0) {
      setSummary(baseSummary);
      return;
    }

    setIsImporting(true);
    try {
      const batches = splitInBatches(parsed.validRows, BATCH_SIZE);

      for (const batch of batches) {
        const batchKeys = [...new Set(batch.map((row) => row.key))];
        const { data: existingRows, error: existingError } = await supabase
          .from(config.table)
          .select(config.keyColumn)
          .in(config.keyColumn, batchKeys);

        if (existingError) {
          baseSummary.skipped += batch.length;
          baseSummary.errors.push(
            `Rows ${batch[0].rowNumber}-${batch[batch.length - 1].rowNumber}: failed to check existing rows (${existingError.message}).`
          );
          continue;
        }

        const existingSet = new Set(
          (existingRows ?? [])
            .map((row) => {
              if (!row || typeof row !== "object") {
                return null;
              }
              return (row as Record<string, unknown>)[config.keyColumn];
            })
            .filter((value): value is string => typeof value === "string" && value.length > 0)
        );

        let batchInserted = 0;
        let batchUpdated = 0;
        for (const row of batch) {
          if (existingSet.has(row.key)) {
            batchUpdated += 1;
          } else {
            batchInserted += 1;
            existingSet.add(row.key);
          }
        }

        const upsertPayload = batch.map((row) => row.data);
        const { error: upsertError } = await supabase.from(config.table).upsert(upsertPayload, {
          onConflict: `user_id,${config.keyColumn}`
        });

        if (upsertError) {
          baseSummary.skipped += batch.length;
          baseSummary.errors.push(
            `Rows ${batch[0].rowNumber}-${batch[batch.length - 1].rowNumber}: upsert failed (${upsertError.message}).`
          );
          continue;
        }

        baseSummary.inserted += batchInserted;
        baseSummary.updated += batchUpdated;
      }

      setSummary(baseSummary);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="card">
      <h2>Bulk import</h2>
      <p className="muted">
        Paste CSV/TSV text (comma, semicolon, or tab). The app auto-detects dataset by headers.
      </p>

      <label>
        Pasted data
        <textarea
          rows={12}
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Paste CSV/TSV here..."
        />
      </label>

      <div className="inline-actions">
        <button type="button" onClick={handleAnalyze}>
          Analyze
        </button>
        <button type="button" onClick={handleImport} disabled={!parsed?.dataset || isImporting}>
          {isImporting ? "Importing..." : "Import valid rows"}
        </button>
      </div>

      {parsed ? (
        <div className="card subtle-card">
          <p>
            <strong>Detected dataset:</strong> {parsed.dataset ?? "unknown"}
          </p>
          <p>
            <strong>Delimiter:</strong> {parsed.delimiter === "\t" ? "tab" : parsed.delimiter ?? "n/a"}
          </p>
          <p>
            <strong>Total rows:</strong> {parsed.totalRows} | <strong>Valid:</strong>{" "}
            {parsed.validRows.length} | <strong>Skipped:</strong> {parsed.skippedRows}
          </p>
          <p>
            <strong>Headers:</strong> {parsed.headers.join(" | ")}
          </p>
        </div>
      ) : null}

      {previewRows.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>row</th>
                {Object.keys(previewRows[0].data).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => (
                <tr key={row.rowNumber}>
                  <td>{row.rowNumber}</td>
                  {Object.keys(previewRows[0].data).map((key) => (
                    <td key={`${row.rowNumber}-${key}`}>{row.data[key] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {summary ? (
        <div className="card subtle-card">
          <h3>Import summary</h3>
          <p>
            <strong>Total rows:</strong> {summary.totalRows}
          </p>
          <p>
            <strong>Valid rows:</strong> {summary.validRows}
          </p>
          <p>
            <strong>Inserted:</strong> {summary.inserted}
          </p>
          <p>
            <strong>Updated:</strong> {summary.updated}
          </p>
          <p>
            <strong>Skipped:</strong> {summary.skipped}
          </p>
          {summary.errors.length > 0 ? (
            <>
              <h4>Errors</h4>
              <ul>
                {summary.errors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="success">No errors reported.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
