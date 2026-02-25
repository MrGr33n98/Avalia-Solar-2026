'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ClaimPageProps {
  params: {
    id: string;
  };
}

export default function ClaimPage({ params }: ClaimPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Por favor, envie pelo menos um documento de verificação.');
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('company_access_request[company_id]', params.id);
        formData.append('company_access_request[message]', message);
        
        files.forEach((file) => {
          formData.append('company_access_request[documents][]', file);
        });

        const response = await fetch(`/api/v1/company_access_requests`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro ao enviar solicitação');
        }

        setSubmitted(true);
        toast.success('Solicitação enviada com sucesso!');
      } catch (error: any) {
        toast.error(error.message || 'Ocorreu um erro ao processar sua solicitação.');
      }
    });
  };

  if (submitted) {
    return (
      <div className="container max-w-2xl py-20 px-4">
        <Card className="text-center p-8 space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Solicitação Recebida!</CardTitle>
            <CardDescription className="text-lg">
              Nossa equipe analisará seus documentos e entrará em contato em até 48 horas úteis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/companies/${params.id}`)} variant="outline">
              Voltar para o Perfil da Empresa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12 px-4">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reivindicar Perfil de Empresa</h1>
        <p className="text-muted-foreground text-lg">
          Prove que você é o proprietário ou representante legal para gerenciar este perfil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Documentação de Verificação</CardTitle>
                <CardDescription>
                  Para sua segurança, exigimos documentos que comprovem seu vínculo com a empresa.
                  Ex: Cartão CNPJ, Contrato Social ou RG do Sócio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem para os Administradores</Label>
                  <Textarea
                    id="message"
                    placeholder="Explique seu cargo na empresa ou forneça informações adicionais..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Anexar Documentos (PDF ou Imagens)</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4 hover:border-primary/50 transition-colors bg-muted/30">
                    <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Clique para fazer upload ou arraste e solte</p>
                      <p className="text-xs text-muted-foreground">PDF, PNG, JPG (máx. 10MB cada)</p>
                    </div>
                    <Input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileChange}
                      accept=".pdf,image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Selecionar Arquivos
                    </Button>
                  </div>

                  {files.length > 0 && (
                    <ul className="space-y-2">
                      {files.map((file, i) => (
                        <li key={i} className="text-sm flex items-center gap-2 bg-muted p-2 rounded-md">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isPending} className="px-8 py-6 text-lg font-semibold">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando solicitação...
                  </>
                ) : (
                  'Enviar Solicitação de Verificação'
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                Por que verificar?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div className="flex gap-3">
                <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">1</div>
                <p><span className="font-bold">Selo de Confiança:</span> Exiba o badge de verificado para atrair mais clientes.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">2</div>
                <p><span className="font-bold">Gerencie Reviews:</span> Responda publicamente às avaliações dos seus clientes.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-primary font-bold">3</div>
                <p><span className="font-bold">Analytics:</span> Veja quem está visualizando seu perfil e clicando em seus contatos.</p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>
              A tentativa de reivindicar perfis de terceiros sem autorização resultará em banimento permanente da plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
