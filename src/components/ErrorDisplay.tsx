import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: {
    type: 'calculation_error' | 'network_error' | 'validation_error';
    message: string;
    recoverable: boolean;
  };
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'calculation_error':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'network_error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'validation_error':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
    }
  };
  
  const getErrorTitle = () => {
    switch (error.type) {
      case 'calculation_error':
        return 'No se pudo calcular la elasticidad';
      case 'network_error':
        return 'Error de conexión';
      case 'validation_error':
        return 'Datos inválidos';
    }
  };
  
  const getSuggestions = () => {
    if (error.message.includes('Price variation too small') || error.message.includes('variación de precio es muy pequeña')) {
      return [
        'Aumenta la diferencia entre precio inicial y final',
        'La variación debe ser al menos 1%',
        'Ejemplo: de 9.50 a 9.70 BOB',
      ];
    }
    
    if (error.message.includes('Volume variation too small') || error.message.includes('variación de volumen es muy pequeña')) {
      return [
        'Aumenta la diferencia entre volumen inicial y final',
        'La variación debe ser al menos 1%',
        'Ejemplo: de 100,000 a 105,000 USDT',
      ];
    }
    
    if (error.message.includes('unrealistically high') || error.message.includes('irrealmente alto')) {
      return [
        'Los datos sugieren factores externos afectan el mercado',
        'Intenta con variaciones más balanceadas de precio y volumen',
        'O selecciona un período diferente en el análisis histórico',
      ];
    }
    
    return ['Verifica los datos ingresados', 'Intenta con valores diferentes'];
  };
  
  return (
    <Alert variant={error.type === 'network_error' ? 'destructive' : 'warning'}>
      <div className="flex items-start gap-3">
        {getErrorIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-2">{getErrorTitle()}</AlertTitle>
          <AlertDescription className="mb-3">
            {error.message}
          </AlertDescription>
          
          <div className="mt-3">
            <p className="text-sm font-medium mb-2">Sugerencias:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {getSuggestions().map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          </div>
          
          {error.recoverable && onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar nuevamente
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}
