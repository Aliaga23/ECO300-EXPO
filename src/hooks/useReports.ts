import { useState, useCallback } from 'react';
import { reportsApi, ApiException } from '@/services/api';

interface UseReportsReturn {
  downloading: boolean;
  error: string | null;
  downloadPdf: (calculationId: string) => Promise<void>;
}

export function useReports(): UseReportsReturn {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadPdf = useCallback(async (calculationId: string) => {
    setDownloading(true);
    setError(null);

    try {
      const blob = await reportsApi.downloadPdf(calculationId);
      reportsApi.triggerDownload(blob, calculationId);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 400) {
          setError('El cálculo aún no está completo.');
        } else if (err.status === 404) {
          setError('Cálculo no encontrado.');
        } else if (err.status === 429) {
          setError('Límite de descargas alcanzado. Intente de nuevo más tarde.');
        } else {
          setError(typeof err.detail === 'string' ? err.detail : 'Error al descargar el reporte');
        }
      } else {
        setError('Error inesperado al generar el PDF');
      }
    } finally {
      setDownloading(false);
    }
  }, []);

  return { downloading, error, downloadPdf };
}
