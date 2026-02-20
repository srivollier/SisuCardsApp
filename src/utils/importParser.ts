import Papa from "papaparse";
import { DATASET_CONFIGS, DatasetName } from "../types/datasets";

const SMART_QUOTES_REGEX = /[\u2018\u2019\u201C\u201D]/g;

const WORDS_HEADER_MAP: Record<string, string> = {
  finnois: "fi",
  francais: "fr",
  "français": "fr",
  fi: "fi",
  fr: "fr"
};

const VERBS_HEADER_MAP: Record<string, string> = {
  "verbe (infinitif)": "infinitive_fi",
  "francais": "fr",
  "français": "fr",
  type: "verb_type",
  "present (mina)": "present_mina",
  "present (sina)": "present_sina",
  "present (han)": "present_han",
  "present (me)": "present_me",
  "present (te)": "present_te",
  "present (he)": "present_he",
  "imparfait (mina)": "past_mina",
  "imparfait (sina)": "past_sina",
  "imparfait (han)": "past_han",
  "imparfait (me)": "past_me",
  "imparfait (te)": "past_te",
  "imparfait (he)": "past_he"
};

const PIKKUSANAT_HEADER_MAP: Record<string, string> = {
  pikkusana: "pikkusana",
  definition_fr: "definition_fr",
  "définition_fr": "definition_fr",
  example_fi: "example_fi",
  exemple_fi: "example_fi",
  traduction_exemple_fr: "example_fr"
};

const REQUIRED_BY_DATASET: Record<DatasetName, string> = {
  words: "fi",
  verbs: "infinitive_fi",
  pikkusanat: "pikkusana"
};

export type ImportRowError = {
  rowNumber: number;
  message: string;
};

export type ParsedImportRow = {
  rowNumber: number;
  key: string;
  data: Record<string, string>;
};

export type ParseResult = {
  dataset: DatasetName | null;
  delimiter: string | null;
  headers: string[];
  totalRows: number;
  validRows: ParsedImportRow[];
  skippedRows: number;
  errors: ImportRowError[];
};

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .replace(SMART_QUOTES_REGEX, "\"")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizeDedupKey(value: string): string {
  return value.trim().toLowerCase();
}

function sanitizeCellValue(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(SMART_QUOTES_REGEX, "\"").trim();
}

function resolveDatasetFromHeaders(normalizedHeaders: string[]): DatasetName | null {
  const headerSet = new Set(normalizedHeaders);

  const hasVerbInfinitive = headerSet.has("verbe (infinitif)");
  const hasPresent = normalizedHeaders.some((header) => header.startsWith("present ("));
  const hasImparfait = normalizedHeaders.some((header) => header.startsWith("imparfait ("));
  if (hasVerbInfinitive && (hasPresent || hasImparfait)) {
    return "verbs";
  }

  const hasPikkusanatHeaders =
    headerSet.has("pikkusana") &&
    (headerSet.has("definition_fr") || headerSet.has("définition_fr")) &&
    (headerSet.has("example_fi") || headerSet.has("exemple_fi")) &&
    headerSet.has("traduction_exemple_fr");
  if (hasPikkusanatHeaders) {
    return "pikkusanat";
  }

  const hasWordsHeaders =
    headerSet.has("finnois") && (headerSet.has("francais") || headerSet.has("français"));
  if (hasWordsHeaders) {
    return "words";
  }

  return null;
}

function getHeaderMap(dataset: DatasetName): Record<string, string> {
  if (dataset === "words") {
    return WORDS_HEADER_MAP;
  }
  if (dataset === "verbs") {
    return VERBS_HEADER_MAP;
  }
  return PIKKUSANAT_HEADER_MAP;
}

export function parsePastedText(rawInput: string): ParseResult {
  const cleanedInput = rawInput.replace(/^\uFEFF/, "");
  const errors: ImportRowError[] = [];

  const parseResult = Papa.parse<Record<string, unknown>>(cleanedInput, {
    header: true,
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", ";", "\t"]
  });

  parseResult.errors.forEach((error) => {
    const rowNumber = error.row ? error.row + 1 : 1;
    errors.push({ rowNumber, message: error.message });
  });

  const headers = parseResult.meta.fields ?? [];
  const normalizedHeaders = headers.map(normalizeHeader);
  const dataset = resolveDatasetFromHeaders(normalizedHeaders);

  if (!dataset) {
    return {
      dataset: null,
      delimiter: parseResult.meta.delimiter ?? null,
      headers,
      totalRows: parseResult.data.length,
      validRows: [],
      skippedRows: parseResult.data.length,
      errors: [
        ...errors,
        {
          rowNumber: 1,
          message: "Could not identify dataset from headers."
        }
      ]
    };
  }

  const keySourceField = REQUIRED_BY_DATASET[dataset];
  const keyColumn = DATASET_CONFIGS[dataset].keyColumn;
  const headerMap = getHeaderMap(dataset);

  const validRows: ParsedImportRow[] = [];
  let skippedRows = 0;

  parseResult.data.forEach((sourceRow, index) => {
    const rowNumber = index + 2;
    const mapped: Record<string, string> = {};
    let hasAnyData = false;

    Object.entries(sourceRow).forEach(([rawHeader, rawValue]) => {
      const value = sanitizeCellValue(rawValue);
      if (value !== "") {
        hasAnyData = true;
      }
      const normalized = normalizeHeader(rawHeader);
      const mappedColumn = headerMap[normalized];
      if (mappedColumn) {
        mapped[mappedColumn] = value;
      }
    });

    if (!hasAnyData) {
      skippedRows += 1;
      return;
    }

    const keyValue = normalizeDedupKey(mapped[keySourceField] ?? "");
    if (!keyValue) {
      skippedRows += 1;
      errors.push({
        rowNumber,
        message: `Missing required field '${keySourceField}'.`
      });
      return;
    }

    mapped[keySourceField] = (mapped[keySourceField] ?? "").trim();
    mapped[keyColumn] = keyValue;

    validRows.push({
      rowNumber,
      key: keyValue,
      data: mapped
    });
  });

  return {
    dataset,
    delimiter: parseResult.meta.delimiter ?? null,
    headers,
    totalRows: parseResult.data.length,
    validRows,
    skippedRows,
    errors
  };
}
