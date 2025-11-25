'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';

export default function CategoryImporter() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success?: string;
    errors?: string[];
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setResult({ errors: ['Please upload a CSV file'] });
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use the adminApi for importing categories
      const data: any = await adminApi.importCategories(formData);

      setResult({
        success: data.message,
        errors: data.errors
      });
    } catch (error) {
      setResult({
        errors: [error instanceof Error ? error.message : 'Failed to upload file']
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Import Categories</h3>
      
      <div className="space-y-4">
        <label className="block">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select CSV File
              </>
            )}
          </Button>
        </label>

        {result?.success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{result.success}</span>
          </div>
        )}

        {result?.errors && result.errors.length > 0 && (
          <div className="bg-red-50 p-3 rounded">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>There were errors during import:</span>
            </div>
            <ul className="list-disc pl-5 text-sm text-red-600">
              {result.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2">CSV Format:</h4>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
          name,seo_url,seo_title,short_description,description,parent_id,kind,status,featured{'\n'}
          Solar Panels,solar-panels,Solar Panels | Compare Solar,High efficiency panels,Detailed description,,product,active,true
        </pre>
      </div>
    </div>
  );
}
