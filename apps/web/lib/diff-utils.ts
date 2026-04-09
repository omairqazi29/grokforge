export interface CodeLine {
  text: string;
  oldNum: string;
  newNum: string;
  type: 'add' | 'remove' | 'hunk' | 'meta' | 'context';
}

export function parseDiffLines(diff: string): CodeLine[] {
  let oldLine = 0;
  let newLine = 0;

  return diff.split('\n').map((line) => {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[2], 10);
      return { text: line, oldNum: '...', newNum: '...', type: 'hunk' as const };
    }
    if (line.startsWith('---') || line.startsWith('+++')) {
      return { text: line, oldNum: '', newNum: '', type: 'meta' as const };
    }
    if (line.startsWith('-')) {
      const result = { text: line, oldNum: String(oldLine), newNum: '', type: 'remove' as const };
      oldLine++;
      return result;
    }
    if (line.startsWith('+')) {
      const result = { text: line, oldNum: '', newNum: String(newLine), type: 'add' as const };
      newLine++;
      return result;
    }
    const result = {
      text: line,
      oldNum: String(oldLine),
      newNum: String(newLine),
      type: 'context' as const,
    };
    oldLine++;
    newLine++;
    return result;
  });
}
