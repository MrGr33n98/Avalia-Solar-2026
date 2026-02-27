import React from 'react';
import { FieldSchema } from '../types/wizard.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface FieldRendererProps {
  field: FieldSchema;
  value: any;
  error?: string;
  onChange: (key: string, value: any) => void;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, error, onChange }) => {
  const handleChange = (val: any) => onChange(field.key, val);

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={handleChange} className="space-y-2">
            {field.options?.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value={opt.value.toString()} id={`${field.key}-${opt.value}`} />
                <Label htmlFor={`${field.key}-${opt.value}`} className="flex-1 cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'select':
        return (
          <Select value={value?.toString() || ''} onValueChange={handleChange}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Selecione uma opção'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-start space-x-3 mt-2">
            <Checkbox 
              id={field.key} 
              checked={!!value} 
              onCheckedChange={(checked) => handleChange(checked)} 
              className={error ? 'border-red-500' : ''}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor={field.key} className="text-sm font-normal text-slate-700 cursor-pointer">
                {field.label}
              </Label>
            </div>
          </div>
        );

      // Currency and Zipcode would have specific masking wrappers here
      case 'zipcode':
        return (
          <Input
            type="text"
            placeholder={field.placeholder || '00000-000'}
            value={value || ''}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, '');
              if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
              handleChange(v.slice(0, 9));
            }}
            className={error ? 'border-red-500' : ''}
          />
        );

      default:
        return <Input type="text" value={value || ''} onChange={(e) => handleChange(e.target.value)} />;
    }
  };

  return (
    <div className="space-y-2 mb-4">
      {field.type !== 'checkbox' && (
        <Label className="font-semibold text-slate-800">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </Label>
      )}
      {renderField()}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};
