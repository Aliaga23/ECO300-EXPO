import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  Brain,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import type { InterpretationResponse } from '@/types/api'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface InterpretationPanelProps {
  interpretation: InterpretationResponse | null
  loading: boolean
  error: string | null
  rateLimitExceeded: boolean
  retryAfter: number | null
  onGenerate: () => void
  calculationId?: string
}

export function InterpretationPanel({
  interpretation,
  loading,
  error,
  rateLimitExceeded,
  retryAfter,
  onGenerate,
  calculationId,
}: InterpretationPanelProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const handleCopy = async () => {
    if (!interpretation) return
    await navigator.clipboard.writeText(interpretation.interpretation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // No interpretation yet
  if (!interpretation && !loading && !error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Interpretación Económica con IA</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Obtenga un análisis contextualizado de los resultados utilizando 
                inteligencia artificial (AWS Bedrock - Llama 4)
              </p>
            </div>
            
            {rateLimitExceeded && retryAfter ? (
              <Alert variant="warning" className="text-left">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Límite de interpretaciones alcanzado. 
                  Disponible en {formatCountdown(retryAfter)}
                </AlertDescription>
              </Alert>
            ) : (
              <Button onClick={onGenerate} disabled={!calculationId || loading}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Interpretación
              </Button>
            )}
            
            <p className="text-xs text-muted-foreground">
              Máximo 5 interpretaciones por hora
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <div>
              <h3 className="font-medium">Contactando AWS Bedrock</h3>
              <p className="text-sm text-muted-foreground">
                Generando análisis económico contextualizado...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          {!rateLimitExceeded && (
            <div className="text-center mt-4">
              <Button variant="outline" onClick={onGenerate}>
                Reintentar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Has interpretation
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Interpretación Económica</CardTitle>
            {interpretation?.cached && (
              <Badge variant="secondary" className="text-xs">
                Resultado en caché
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Colapsar' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          {/* Interpretation Text */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className={cn(
              "whitespace-pre-wrap text-sm leading-relaxed",
              "bg-muted/30 rounded-lg p-4 border"
            )}>
              <MessageSquare className="h-4 w-4 text-primary mb-2" />
              {interpretation?.interpretation.split('\n').map((paragraph, index) => (
                <p key={index} className={cn(
                  "mb-3 last:mb-0",
                  paragraph.startsWith('**') && "font-semibold"
                )}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Modelo: {interpretation?.model || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Generado: {interpretation?.generated_at 
                    ? new Date(interpretation.generated_at).toLocaleString('es-BO')
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
            
            {/* Disclaimer */}
            <Alert variant="default" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Esta interpretación fue generada por inteligencia artificial con fines 
                académicos. No constituye asesoría financiera ni recomendaciones de inversión.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
