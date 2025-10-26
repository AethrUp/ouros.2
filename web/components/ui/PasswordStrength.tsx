'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthCriteria {
  label: string;
  test: (password: string) => boolean;
}

const criteria: StrengthCriteria[] = [
  {
    label: 'At least 6 characters',
    test: (pwd) => pwd.length >= 6,
  },
  {
    label: 'Contains uppercase letter',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: 'Contains lowercase letter',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: 'Contains number',
    test: (pwd) => /\d/.test(pwd),
  },
];

const getStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: '', color: '' };

  const passedCount = criteria.filter((c) => c.test(password)).length;

  if (passedCount <= 1) {
    return { score: 1, label: 'Weak', color: 'bg-error' };
  } else if (passedCount === 2) {
    return { score: 2, label: 'Fair', color: 'bg-warning' };
  } else if (passedCount === 3) {
    return { score: 3, label: 'Good', color: 'bg-primary' };
  } else {
    return { score: 4, label: 'Strong', color: 'bg-success' };
  }
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  className,
}) => {
  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Password strength</span>
          {strength.label && (
            <span className={cn('text-xs', {
              'text-error': strength.score === 1,
              'text-warning': strength.score === 2,
              'text-primary': strength.score === 3,
              'text-success': strength.score === 4,
            })}>
              {strength.label}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <motion.div
              key={level}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: level <= strength.score ? 1 : 0 }}
              transition={{ duration: 0.2, delay: level * 0.05 }}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                level <= strength.score ? strength.color : 'bg-surface'
              )}
            />
          ))}
        </div>
      </div>

      {/* Criteria List */}
      <div className="space-y-1.5">
        {criteria.map((criterion, index) => {
          const passed = criterion.test(password);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-xs"
            >
              <div className={cn(
                'flex items-center justify-center w-4 h-4 rounded-full',
                passed ? 'bg-success/20 text-success' : 'bg-surface text-secondary'
              )}>
                {passed ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </div>
              <span className={cn(
                passed ? 'text-success' : 'text-secondary'
              )}>
                {criterion.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
