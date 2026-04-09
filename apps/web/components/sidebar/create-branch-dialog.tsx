'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBranch: string | null;
  onCreate: (name: string) => Promise<void>;
}

export function CreateBranchDialog({
  open,
  onOpenChange,
  currentBranch,
  onCreate,
}: CreateBranchDialogProps) {
  const [name, setName] = useState('');
  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await onCreate(name.trim());
      setName('');
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider">
            Create Branch
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            From: {currentBranch}
          </p>
          <Input
            placeholder="feature/my-branch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="font-mono text-sm"
          />
          <Button onClick={handleCreate} className="w-full">
            <span className="font-mono text-xs uppercase tracking-wider">Create & Checkout</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
