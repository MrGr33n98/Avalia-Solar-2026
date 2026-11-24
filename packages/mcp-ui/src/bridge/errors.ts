export class BridgeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BridgeValidationError';
  }
}

export function toUserReadableError(err: unknown): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Sem conexão com a internet no momento. Verifique sua rede e tente novamente.';
  }
  if (err instanceof BridgeValidationError) {
    return 'Os dados recebidos não correspondem ao contrato público esperado.';
  }
  if (err instanceof Error) {
    if (err.message.toLowerCase().includes('timeout')) {
      return 'A consulta demorou mais que o esperado. Tente novamente em instantes.';
    }
    if (err.message.toLowerCase().includes('not found')) {
      return 'Registro público não encontrado ou inativo no catálogo.';
    }
  }
  return 'Não foi possível concluir a consulta agora. Tente novamente.';
}

