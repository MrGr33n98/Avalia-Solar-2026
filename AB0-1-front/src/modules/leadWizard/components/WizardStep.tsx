import React from 'react';
import { StepSchema } from '../types/wizard.types';
import { FieldRenderer } from './FieldRenderer';
import { motion } from 'framer-motion';

interface WizardStepProps {
  step: StepSchema;
  answers: Record<string, any>;
  errors: Record<string, string>;
  onAnswerChange: (key: string, value: any) => void;
  onEnterPress: () => void;
}

export const WizardStep: React.FC<WizardStepProps> = ({ step, answers, errors, onAnswerChange, onEnterPress }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
      onKeyDown={handleKeyDown}
    >
      <div className="mb-6">
        {step.title && <h2 className="text-2xl font-bold text-slate-900">{step.title}</h2>}
        {step.description && <p className="text-slate-500 mt-2">{step.description}</p>}
      </div>

      <div className="space-y-4">
        {step.fields.map(field => {
          // Dynamic visibility check
          if (field.dependsOn) {
            const depValue = answers[field.dependsOn.field];
            if (depValue !== field.dependsOn.value) return null;
          }

          return (
            <FieldRenderer
              key={field.key}
              field={field}
              value={answers[field.key]}
              error={errors[field.key]}
              onChange={onAnswerChange}
            />
          );
        })}
      </div>
    </motion.div>
  );
};
