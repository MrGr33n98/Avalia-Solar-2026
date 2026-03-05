'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type RadioGroupContextValue = {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

type RadioGroupProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
};

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, name, disabled, ...props }, ref) => {
    const generatedName = React.useId();

    return (
      <RadioGroupContext.Provider
        value={{
          name: name || generatedName,
          value,
          onValueChange,
          disabled,
        }}
      >
        <div
          ref={ref}
          role="radiogroup"
          className={cn('grid gap-2', className)}
          {...props}
        />
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

type RadioGroupItemProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  value: string;
};

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, disabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);

    if (!context) {
      throw new Error('RadioGroupItem must be used within RadioGroup');
    }

    const isDisabled = context.disabled || disabled;

    return (
      <input
        ref={ref}
        type="radio"
        name={context.name}
        value={value}
        checked={context.value === value}
        disabled={isDisabled}
        onChange={() => context.onValueChange?.(value)}
        className={cn(
          'h-4 w-4 border border-primary text-primary accent-current focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
