'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AddRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (mode: 'path' | 'url', value: string) => Promise<void>;
}

export function AddRepoDialog({ open, onOpenChange, onAdd }: AddRepoDialogProps) {
  const [mode, setMode] = useState<'path' | 'url'>('path');
  const [repoPath, setRepoPath] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const value = mode === 'url' ? repoUrl : repoPath;
  const setValue = mode === 'url' ? setRepoUrl : setRepoPath;

  const handleAdd = async () => {
    if (!value.trim()) return;
    setAdding(true);
    try {
      await onAdd(mode, value);
      setRepoPath('');
      setRepoUrl('');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider">
            Connect Repository
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex gap-px border border-border bg-border">
            {(['path', 'url'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 bg-background py-2 font-mono text-[10px] uppercase tracking-wider ${
                  mode === m ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {m === 'path' ? 'Local Path' : 'Clone URL'}
              </button>
            ))}
          </div>
          <Input
            placeholder={
              mode === 'path' ? '/path/to/repository' : 'owner/repo or https://github.com/...'
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="font-mono text-sm"
          />
          <Button onClick={handleAdd} disabled={adding} className="w-full">
            <span className="font-mono text-xs uppercase tracking-wider">
              {adding
                ? mode === 'url'
                  ? 'Cloning...'
                  : 'Scanning...'
                : mode === 'url'
                  ? 'Clone & Connect'
                  : 'Scan & Connect'}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
