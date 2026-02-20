import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { DatasetConfig, emptyRowFromConfig } from "../types/datasets";

type DatasetTableProps = {
  config: DatasetConfig;
};

const PAGE_SIZE = 20;

function escapeIlikeTerm(term: string): string {
  return term.replaceAll("%", "\\%").replaceAll(",", "\\,");
}

export function DatasetTable({ config }: DatasetTableProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>(() => emptyRowFromConfig(config));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setFormData(emptyRowFromConfig(config));
    setEditingId(null);
    setPage(1);
    setSearchInput("");
    setSearchTerm("");
  }, [config]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchRows() {
      setLoading(true);
      setError(null);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from(config.table)
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(from, to);

      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) {
        const escapedTerm = escapeIlikeTerm(trimmedSearch);
        const clauses = config.searchColumns.map((column) => `${column}.ilike.%${escapedTerm}%`);
        query = query.or(clauses.join(","));
      }

      const { data, count: totalCount, error: fetchError } = await query;

      if (isCancelled) {
        return;
      }

      if (fetchError) {
        setRows([]);
        setCount(0);
        setError(fetchError.message);
      } else {
        setRows(data ?? []);
        setCount(totalCount ?? 0);
      }
      setLoading(false);
    }

    fetchRows();
    return () => {
      isCancelled = true;
    };
  }, [config, page, refreshToken, searchTerm]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this row?");
    if (!confirmed) {
      return;
    }

    setError(null);
    const { error: deleteError } = await supabase.from(config.table).delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setRefreshToken((value) => value + 1);
  }

  function beginEdit(row: Record<string, unknown>) {
    const nextForm = emptyRowFromConfig(config);
    config.columns.forEach((column) => {
      nextForm[column.key] = String(row[column.key] ?? "");
    });
    setFormData(nextForm);
    setEditingId(String(row.id));
  }

  function resetForm() {
    setEditingId(null);
    setFormData(emptyRowFromConfig(config));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const payload = config.columns.reduce<Record<string, string>>((acc, column) => {
      acc[column.key] = (formData[column.key] ?? "").trim();
      return acc;
    }, {});

    try {
      for (const column of config.columns) {
        if (column.required && !payload[column.key]) {
          throw new Error(`Field '${column.label}' is required.`);
        }
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from(config.table)
          .update(payload)
          .eq("id", editingId);
        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from(config.table).insert(payload);
        if (insertError) {
          throw insertError;
        }
      }

      resetForm();
      setRefreshToken((value) => value + 1);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Failed to save row.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  }

  return (
    <section className="card">
      <h2>{config.label}</h2>

      <form className="inline-form" onSubmit={handleSearchSubmit}>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search..."
        />
        <button type="submit">Search</button>
        <button
          type="button"
          onClick={() => {
            setSearchInput("");
            setSearchTerm("");
            setPage(1);
          }}
        >
          Clear
        </button>
      </form>

      <form className="grid-form" onSubmit={handleSubmit}>
        {config.columns.map((column) => (
          <label key={column.key}>
            {column.label}
            <input
              value={formData[column.key] ?? ""}
              onChange={(event) =>
                setFormData((current) => ({ ...current, [column.key]: event.target.value }))
              }
              required={Boolean(column.required)}
            />
          </label>
        ))}

        <div className="inline-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update row" : "Add row"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading...</p> : null}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {config.columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 1}>No rows found.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)}>
                  {config.columns.map((column) => (
                    <td key={column.key}>{String(row[column.key] ?? "")}</td>
                  ))}
                  <td>
                    <div className="inline-actions">
                      <button type="button" onClick={() => beginEdit(row)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(String(row.id))}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="inline-actions">
        <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          Previous
        </button>
        <span className="muted">
          Page {page} / {totalPages} ({count} rows)
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
