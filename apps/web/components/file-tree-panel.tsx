import { FileTree } from '@/components/file-tree';
import { Repository } from '@/lib/api-client';

export function FileTreePanel({ repo }: { repo: Repository }) {
  return (
    <div className="space-y-6">
      <div className="border border-border">
        <div className="border-b border-border p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Files
          </p>
        </div>
        <div className="h-[400px] p-1">
          <FileTree files={repo.file_tree} symbolIndex={repo.symbol_index} />
        </div>
      </div>
      <div className="border border-border p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Modules
        </p>
        <div className="space-y-1.5">
          {Object.entries(repo.symbol_index)
            .slice(0, 10)
            .map(([file, symbols]) => (
              <div key={file} className="flex items-start justify-between gap-2">
                <span className="truncate font-mono text-[10px] text-muted-foreground">{file}</span>
                <span className="shrink-0 font-mono text-[9px] text-foreground/20">
                  {symbols.length}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
