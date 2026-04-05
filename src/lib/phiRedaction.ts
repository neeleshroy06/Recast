export type PhiPattern = {
  category: string;
  pattern: string;
  replacement: string;
};

export type PhiAuditEntry = {
  category: string;
  originalSnippet: string;
  replacement: string;
  position: number;
};

export type PhiRedactionSummary = {
  category: string;
  count: number;
};

export type PhiRedactionResult = {
  text: string;
  auditEntries: PhiAuditEntry[];
  summary: PhiRedactionSummary[];
  totalRemoved: number;
};

export const PHI_PATTERNS: PhiPattern[] = [
  { category: "PATIENT_NAME", pattern: String.raw`Marcus\s+Lionel\s+Donovan`, replacement: "[PATIENT NAME REDACTED]" },
  { category: "PATIENT_NAME", pattern: String.raw`Marcus\s+L\.\s+Donovan`, replacement: "[PATIENT NAME REDACTED]" },
  { category: "PATIENT_NAME", pattern: String.raw`Marcus\s+Donovan`, replacement: "[PATIENT NAME REDACTED]" },
  { category: "PATIENT_NAME", pattern: String.raw`\bM\.\s+Donovan\b`, replacement: "[PATIENT NAME REDACTED]" },
  { category: "PATIENT_NAME", pattern: String.raw`\bDonovan\b`, replacement: "[PATIENT NAME REDACTED]" },
  { category: "CONTACT_NAME", pattern: String.raw`Eleanor\s+Donovan`, replacement: "[CONTACT NAME REDACTED]" },
  { category: "CONTACT_NAME", pattern: String.raw`\bEleanor\b`, replacement: "[CONTACT NAME REDACTED]" },
  {
    category: "PHYSICIAN_NAME",
    pattern: String.raw`Dr\.\s+Kavitha\s+Nair(?:,\s*MD)?`,
    replacement: "[PHYSICIAN NAME REDACTED]",
  },
  {
    category: "PHYSICIAN_NAME",
    pattern: String.raw`Kavitha\s+Nair(?:,\s*MD)?`,
    replacement: "[PHYSICIAN NAME REDACTED]",
  },
  {
    category: "PHYSICIAN_NAME",
    pattern: String.raw`K\.\s+Nair(?:,\s*MD)?`,
    replacement: "[PHYSICIAN NAME REDACTED]",
  },
  {
    category: "PHYSICIAN_NAME",
    pattern: String.raw`Dr\.\s+Alan\s+Perreira`,
    replacement: "[PHYSICIAN NAME REDACTED]",
  },
  {
    category: "PHYSICIAN_NAME",
    pattern: String.raw`Dr\.\s+James\s+Obi(?:,\s*MD[^)]*)?`,
    replacement: "[PHYSICIAN NAME REDACTED]",
  },
  { category: "MRN", pattern: String.raw`LH-20260014882`, replacement: "[MRN REDACTED]" },
  { category: "MRN", pattern: String.raw`MRN[\s:]+LH-\d+`, replacement: "MRN: [MRN REDACTED]" },
  { category: "ENCOUNTER", pattern: String.raw`ENC-2026-00421`, replacement: "[ENCOUNTER# REDACTED]" },
  {
    category: "ENCOUNTER",
    pattern: String.raw`Encounter[\s:]+ENC-[\w\-]+`,
    replacement: "Encounter: [ENCOUNTER# REDACTED]",
  },
  { category: "SSN", pattern: String.raw`XXX-XX-7741`, replacement: "[SSN REDACTED]" },
  { category: "SSN", pattern: String.raw`SSN\s*\(Last\s*4\)[^\n]*`, replacement: "SSN (Last 4): [SSN REDACTED]" },
  { category: "DOB", pattern: String.raw`03\/14\/1976`, replacement: "[DOB REDACTED]" },
  { category: "DOB", pattern: String.raw`March\s+14,\s+1976`, replacement: "[DOB REDACTED]" },
  { category: "DOB", pattern: String.raw`DOB[\s:]+\d{2}\/\d{2}\/\d{4}`, replacement: "DOB: [DOB REDACTED]" },
  { category: "DOB", pattern: String.raw`\(Age:\s*\d+\)`, replacement: "(Age: [AGE REDACTED])" },
  {
    category: "ADDRESS",
    pattern: String.raw`28\s+Birchwood\s+Drive,?\s+Woburn,?\s+MA\s+01801`,
    replacement: "[ADDRESS REDACTED]",
  },
  {
    category: "ADDRESS",
    pattern: String.raw`\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Drive|Street|Ave|Road|Blvd|Lane|St|Dr|Rd)\b[^|]*`,
    replacement: "[ADDRESS REDACTED]",
  },
  { category: "PHONE", pattern: String.raw`\(\s*617\s*\)\s*555-0183`, replacement: "[PHONE REDACTED]" },
  { category: "PHONE", pattern: String.raw`\(\s*617\s*\)\s*555-0291`, replacement: "[PHONE REDACTED]" },
  { category: "PHONE", pattern: String.raw`\(\s*781\s*\)\s*744-5100`, replacement: "[FACILITY PHONE REDACTED]" },
  {
    category: "PHONE",
    pattern: String.raw`\(?\d{3}\)?\s*[\-\.]\s*\d{3}\s*[\-\.]\s*\d{4}`,
    replacement: "[PHONE REDACTED]",
  },
  { category: "INSURANCE_ID", pattern: String.raw`BX9203811`, replacement: "[INSURANCE ID REDACTED]" },
  { category: "INSURANCE_ID", pattern: String.raw`Group:\s*44821`, replacement: "Group: [GROUP# REDACTED]" },
  { category: "INSURANCE_ID", pattern: String.raw`Member:\s*BX\d+`, replacement: "Member: [MEMBER# REDACTED]" },
  { category: "NPI", pattern: String.raw`NPI[\s:]+1234567890`, replacement: "NPI: [NPI REDACTED]" },
  { category: "DEA", pattern: String.raw`DEA\s+Number[\s:]+BN7650291`, replacement: "DEA Number: [DEA REDACTED]" },
  {
    category: "FACILITY_ADDR",
    pattern: String.raw`41\s+Mall\s+Road,\s+Burlington,\s+MA\s+01805`,
    replacement: "41 Mall Road, Burlington, MA [ZIP REDACTED]",
  },
  { category: "ENCOUNTER_DATE", pattern: String.raw`April\s+4,\s+2026`, replacement: "[ENCOUNTER DATE REDACTED]" },
  { category: "ENCOUNTER_DATE", pattern: String.raw`04\/04\/2026`, replacement: "[ENCOUNTER DATE REDACTED]" },
  {
    category: "ENCOUNTER_DATE",
    pattern: String.raw`April 4, 2026 at \d+:\d+ [AP]M(?: EST)?`,
    replacement: "[SIGNATURE DATE REDACTED]",
  },
  { category: "TIMESTAMP", pattern: String.raw`Signed:\s*April[^\n]+`, replacement: "Signed: [TIMESTAMP REDACTED]" },
  {
    category: "TIMESTAMP",
    pattern: String.raw`Dictated\s+April[^\n]+`,
    replacement: "Dictated: [TIMESTAMP REDACTED]",
  },
  {
    category: "TIMESTAMP",
    pattern: String.raw`Transcribed\s+April[^\n]+`,
    replacement: "Transcribed: [TIMESTAMP REDACTED]",
  },
  { category: "PORTAL", pattern: String.raw`MyChart[^\n]*`, replacement: "[PATIENT PORTAL REFERENCE REDACTED]" },
];

export function redactPHI(text: string): PhiRedactionResult {
  let redactedText = text;
  const auditEntries: PhiAuditEntry[] = [];

  for (const { category, pattern, replacement } of PHI_PATTERNS) {
    const regex = new RegExp(pattern, "gi");
    const matches = Array.from(redactedText.matchAll(regex));

    if (!matches.length) {
      continue;
    }

    for (const match of matches) {
      auditEntries.push({
        category,
        originalSnippet: match[0].slice(0, 60),
        replacement,
        position: match.index ?? 0,
      });
    }

    redactedText = redactedText.replace(regex, replacement);
  }

  const counts = new Map<string, number>();
  for (const entry of auditEntries) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
  }

  const summary = [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, count]) => ({ category, count }));

  return {
    text: redactedText,
    auditEntries,
    summary,
    totalRemoved: auditEntries.length,
  };
}
