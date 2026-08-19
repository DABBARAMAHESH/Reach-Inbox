import { parse } from 'csv-parse/sync';
import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CsvRecipient {
  email: string;
  name?: string;
}

export interface CsvParseResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRecipients: CsvRecipient[];
  invalidRows: { row: number; data: any; reason: string }[];
}

export class CsvParserService {
  static parseTextContent(fileContent: string): CsvParseResult {
    // Regex to find emails anywhere in the text (comma/newline/space separated)
    const matches = fileContent.match(/([a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
    
    const validRecipients: CsvRecipient[] = [];
    const seenEmails = new Set<string>();
    let duplicateCount = 0;
    
    matches.forEach(m => {
      const email = m.trim().toLowerCase();
      if (seenEmails.has(email)) {
        duplicateCount++;
        return;
      }
      seenEmails.add(email);
      validRecipients.push({ email });
    });

    return {
      totalRows: matches.length,
      validCount: validRecipients.length,
      invalidCount: 0,
      duplicateCount,
      validRecipients,
      invalidRows: []
    };
  }

  static parseCsvContent(fileContent: string): CsvParseResult {
    try {
      const records: any[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      let totalRows = records.length;
      const validRecipients: CsvRecipient[] = [];
      const invalidRows: { row: number; data: any; reason: string }[] = [];
      const seenEmails = new Set<string>();
      let duplicateCount = 0;

      records.forEach((record, index) => {
        const rowNum = index + 1;
        
        // Intelligent column mapping
        let email: string | undefined = undefined;
        let name: string | undefined = undefined;

        for (const key of Object.keys(record)) {
          const lowerKey = key.toLowerCase().trim();
          if (lowerKey === 'email' || lowerKey === 'e-mail' || lowerKey === 'emailaddress') {
            email = record[key];
          } else if (lowerKey === 'name' || lowerKey === 'fullname' || lowerKey === 'recipient') {
            name = record[key];
          }
        }

        // Fallback for single column CSV without header or simple text format
        if (!email && Object.keys(record).length === 1) {
          const val = Object.values(record)[0] as string;
          if (val && emailRegex.test(val.trim().toLowerCase())) {
            email = val;
          }
        }

        if (!email) {
          invalidRows.push({
            row: rowNum,
            data: record,
            reason: 'Missing email field'
          });
          return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!emailRegex.test(normalizedEmail)) {
          invalidRows.push({
            row: rowNum,
            data: record,
            reason: `Invalid email format: ${email}`
          });
          return;
        }

        if (seenEmails.has(normalizedEmail)) {
          duplicateCount++;
          return;
        }

        seenEmails.add(normalizedEmail);
        validRecipients.push({
          email: normalizedEmail,
          name: name ? name.trim() : undefined
        });
      });

      return {
        totalRows,
        validCount: validRecipients.length,
        invalidCount: invalidRows.length,
        duplicateCount,
        validRecipients,
        invalidRows
      };
    } catch (e) {
      // Fallback to unstructured text parser if CSV parser fails
      return this.parseTextContent(fileContent);
    }
  }
}
