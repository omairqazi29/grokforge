import { useEffect, useState, useRef } from 'react';

interface Step {
  label: string;
  detail: string;
}

export function useStepProgression(steps: Step[], stage: string) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  // Elapsed timer
  useEffect(() => {
    if (stage === 'idle') return;
    startTime.current = Date.now();
    setElapsed(0);
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  // Slow step progression -- each step takes 3-5 seconds
  useEffect(() => {
    if (stage === 'idle' || steps.length === 0) return;
    setCurrentStep(0);
    setCompletedSteps(new Set());

    let stepIdx = 0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const advanceStep = () => {
      setCompletedSteps((prev) => new Set([...prev, stepIdx]));
      stepIdx++;
      if (stepIdx < steps.length) {
        setCurrentStep(stepIdx);
        const nextDelay = 3000 + Math.random() * 2500;
        timeouts.push(setTimeout(advanceStep, nextDelay));
      }
    };

    timeouts.push(setTimeout(advanceStep, 3500 + Math.random() * 2000));
    return () => timeouts.forEach(clearTimeout);
  }, [stage, steps.length]);

  const progress = steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return { currentStep, completedSteps, elapsed, progress, formatTime };
}
