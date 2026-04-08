'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TaskComposerProps {
  onSubmit: (task: string, constraints: string[]) => void;
  loading?: boolean;
}

export function TaskComposer({ onSubmit, loading }: TaskComposerProps) {
  const [task, setTask] = useState('');
  const [constraintInput, setConstraintInput] = useState('');
  const [constraints, setConstraints] = useState<string[]>([]);

  const addConstraint = () => {
    const trimmed = constraintInput.trim();
    if (trimmed && !constraints.includes(trimmed)) {
      setConstraints([...constraints, trimmed]);
      setConstraintInput('');
    }
  };

  const removeConstraint = (c: string) => {
    setConstraints(constraints.filter((x) => x !== c));
  };

  const handleSubmit = () => {
    if (!task.trim()) return;
    onSubmit(task.trim(), constraints);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Task Description</label>
        <Textarea
          placeholder="Describe what you want to change. E.g., 'Add exponential backoff retry logic to the API client and update tests'"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Constraints (optional)</label>
        <div className="flex gap-2">
          <Input
            placeholder="E.g., do not modify tests"
            value={constraintInput}
            onChange={(e) => setConstraintInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConstraint())}
          />
          <Button variant="outline" onClick={addConstraint} type="button">
            Add
          </Button>
        </div>
        {constraints.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {constraints.map((c) => (
              <Badge
                key={c}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeConstraint(c)}
              >
                {c} &times;
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Button onClick={handleSubmit} disabled={!task.trim() || loading} className="w-full">
        {loading ? 'Generating Plan...' : 'Generate Plan'}
      </Button>
    </div>
  );
}
