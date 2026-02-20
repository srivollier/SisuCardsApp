export type DatasetName = "words" | "verbs" | "pikkusanat";

export type DatasetColumn = {
  key: string;
  label: string;
  required?: boolean;
};

export type DatasetConfig = {
  id: DatasetName;
  label: string;
  table: DatasetName;
  keySourceField: string;
  keyColumn: string;
  searchColumns: string[];
  columns: DatasetColumn[];
};

export const DATASET_CONFIGS: Record<DatasetName, DatasetConfig> = {
  words: {
    id: "words",
    label: "Words",
    table: "words",
    keySourceField: "fi",
    keyColumn: "fi_key",
    searchColumns: ["fi", "fr"],
    columns: [
      { key: "fi", label: "finnois", required: true },
      { key: "fr", label: "francais" }
    ]
  },
  verbs: {
    id: "verbs",
    label: "Verbs",
    table: "verbs",
    keySourceField: "infinitive_fi",
    keyColumn: "infinitive_key",
    searchColumns: ["infinitive_fi", "fr", "verb_type"],
    columns: [
      { key: "infinitive_fi", label: "verbe (infinitif)", required: true },
      { key: "fr", label: "francais" },
      { key: "verb_type", label: "type" },
      { key: "present_mina", label: "present (mina)" },
      { key: "present_sina", label: "present (sina)" },
      { key: "present_han", label: "present (han)" },
      { key: "present_me", label: "present (me)" },
      { key: "present_te", label: "present (te)" },
      { key: "present_he", label: "present (he)" },
      { key: "past_mina", label: "imparfait (mina)" },
      { key: "past_sina", label: "imparfait (sina)" },
      { key: "past_han", label: "imparfait (han)" },
      { key: "past_me", label: "imparfait (me)" },
      { key: "past_te", label: "imparfait (te)" },
      { key: "past_he", label: "imparfait (he)" }
    ]
  },
  pikkusanat: {
    id: "pikkusanat",
    label: "Pikkusanat",
    table: "pikkusanat",
    keySourceField: "pikkusana",
    keyColumn: "pikkusana_key",
    searchColumns: ["pikkusana", "definition_fr", "example_fi", "example_fr"],
    columns: [
      { key: "pikkusana", label: "pikkusana", required: true },
      { key: "definition_fr", label: "definition_fr" },
      { key: "example_fi", label: "exemple_fi" },
      { key: "example_fr", label: "traduction_exemple_fr" }
    ]
  }
};

export function emptyRowFromConfig(config: DatasetConfig): Record<string, string> {
  return config.columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = "";
    return acc;
  }, {});
}
