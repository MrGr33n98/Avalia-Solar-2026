import React from 'react';
import { StepSchema } from '../types/wizard.types';
import { FieldRenderer } from './FieldRenderer';
import { motion } from 'framer-motion';

interface WizardStepProps {
  step: StepSchema;
  answers: Record<string, unknown>;
  errors: Record<string, string>;
  onAnswerChange: (key: string, value: unknown) => void;
  onEnterPress: () => void;
}

const FULL_WIDTH_FIELDS = new Set(['full_name', 'name', 'consent', 'consent_at']);
const CONTACT_FIELDS = new Set(['full_name', 'name', 'email', 'phone', 'consent', 'consent_at']);

export const WizardStep: React.FC<WizardStepProps> = ({
  step,
  answers,
  errors,
  onAnswerChange,
  onEnterPress,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onEnterPress();
    }
  };
  const usesContactGrid = step.fields.some((field) => CONTACT_FIELDS.has(field.key));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
      onKeyDown={handleKeyDown}
    >
      <div className="space-y-1.5">
        {step.title && <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>}
        {step.description && <p className="text-sm text-slate-500">{step.description}</p>}
      </div>

      <div className={usesContactGrid ? 'grid grid-cols-1 gap-x-3 md:grid-cols-2' : 'space-y-3'}>
        {step.fields.map((field) => {
          if (field.dependsOn && answers[field.dependsOn.field] !== field.dependsOn.value) return null;

          return (
            <div
              key={field.key}
              className={usesContactGrid && FULL_WIDTH_FIELDS.has(field.key) ? 'md:col-span-2' : undefined}
            >
              <FieldRenderer
                field={field}
                value={answers[field.key]}
                error={errors[field.key]}
                onChange={onAnswerChange}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
