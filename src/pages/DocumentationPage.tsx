import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MidpointFormulaDisplay, LogLogFormulaDisplay } from '@/components/ui/math-formula'
import {
  BookOpen,
  Calculator,
  Database,
  Brain,
  FileText,
  Code,
  CheckCircle2,
} from 'lucide-react'

export default function DocumentationPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Documentación</h1>
          </div>
          <p className="text-muted-foreground">
            Guía metodológica y referencias para el sistema ElasticBot
          </p>
        </div>

        {/* Table of Contents */}
        <Card>
          <CardHeader>
            <CardTitle>Contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-2">
              <a href="#methodology" className="block text-sm text-primary hover:underline">
                1. Metodología de Cálculo
              </a>
              <a href="#data-sources" className="block text-sm text-primary hover:underline">
                2. Fuentes de Datos
              </a>
              <a href="#interpretation" className="block text-sm text-primary hover:underline">
                3. Interpretación de Resultados
              </a>
              <a href="#api" className="block text-sm text-primary hover:underline">
                4. API y Especificaciones Técnicas
              </a>
              <a href="#references" className="block text-sm text-primary hover:underline">
                5. Referencias Académicas
              </a>
            </nav>
          </CardContent>
        </Card>

        {/* Methodology Section */}
        <section id="methodology">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle>1. Metodología de Cálculo</CardTitle>
              </div>
              <CardDescription>
                Métodos econométricos utilizados para estimar la elasticidad de demanda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Elasticidad Punto Medio (Midpoint)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  El método del punto medio calcula la elasticidad arco utilizando el promedio 
                  de los valores iniciales y finales como base, evitando el problema de asimetría 
                  que surge al usar solo el punto inicial o final.
                </p>
                <MidpointFormulaDisplay />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Donde: ΔQ = cambio en cantidad, ΔP = cambio en precio, Q̄ = cantidad promedio, P̄ = precio promedio
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Regresión Log-Log</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  La regresión logarítmica estima una elasticidad constante a lo largo del rango 
                  de datos. El coeficiente β representa directamente la elasticidad precio de la demanda.
                </p>
                <LogLogFormulaDisplay />
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Donde:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="font-serif italic text-foreground">β</span> 
                      <span>= Elasticidad precio de la demanda</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-serif italic text-foreground">α</span> 
                      <span>= Intercepto (constante)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-serif italic text-foreground">ε</span> 
                      <span>= Término de error aleatorio</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-lg border">
                  <Badge variant="elastic" className="mb-2">|Ed| &gt; 1</Badge>
                  <h5 className="font-medium">Demanda Elástica</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    Alta sensibilidad al precio. Bienes de lujo o con muchos sustitutos.
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <Badge variant="inelastic" className="mb-2">|Ed| &lt; 1</Badge>
                  <h5 className="font-medium">Demanda Inelástica</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    Baja sensibilidad al precio. Bienes necesarios o sin sustitutos.
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <Badge variant="unitary" className="mb-2">|Ed| = 1</Badge>
                  <h5 className="font-medium">Elasticidad Unitaria</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cambio proporcional. Poco común en la práctica.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Data Sources Section */}
        <section id="data-sources">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>2. Fuentes de Datos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Binance P2P</h4>
                  <p className="text-sm text-muted-foreground">
                    Datos de precios y volúmenes del mercado P2P para el par USDT/BOB. 
                    Actualización cada 30 segundos. Incluye ofertas de compra y venta, 
                    volumen disponible, y métricas de traders.
                  </p>
                  <Badge variant="outline" className="mt-2">Tiempo real</Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Banco Central de Bolivia (BCB)</h4>
                  <p className="text-sm text-muted-foreground">
                    Tipo de cambio oficial USD/BOB publicado diariamente. Se utiliza como 
                    referencia para calcular la prima del mercado paralelo.
                  </p>
                  <Badge variant="outline" className="mt-2">Actualización diaria</Badge>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <h5 className="font-medium mb-2">Calidad de Datos</h5>
                <p className="text-sm text-muted-foreground">
                  Cada snapshot incluye un índice de calidad (0-100%) que considera:
                  número de ofertas activas, spread bid-ask, volumen disponible, y 
                  consistencia temporal de los datos.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Interpretation Section */}
        <section id="interpretation">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle>3. Interpretación con IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                El sistema utiliza AWS Bedrock con el modelo Llama 4 Maverick para generar 
                interpretaciones contextualizadas de los resultados de elasticidad.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium">Aspectos Analizados:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Clasificación y magnitud de la elasticidad</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Contexto del mercado cambiario boliviano</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Implicaciones para la hipótesis de bien necesario</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Significancia estadística y confiabilidad</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Recomendaciones de política económica</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Nota:</strong> Las interpretaciones son generadas por IA con fines 
                  académicos y no constituyen asesoría financiera.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* API Section */}
        <section id="api">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <CardTitle>4. Especificaciones Técnicas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Frontend</p>
                  <p className="font-medium">React + TypeScript</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Backend</p>
                  <p className="font-medium">Django REST API</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">AI Model</p>
                  <p className="font-medium">AWS Bedrock (Llama 4)</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Data Source</p>
                  <p className="font-medium">Binance P2P API</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Límites de Tasa</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Datos de mercado</span>
                    <span>100 req/hora</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cálculos de elasticidad</span>
                    <span>10 req/hora</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interpretaciones IA</span>
                    <span>5 req/hora</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reportes PDF</span>
                    <span>10 req/hora</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* References Section */}
        <section id="references">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>5. Referencias Académicas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Teoría de Elasticidad</p>
                  <p className="text-muted-foreground">
                    Mankiw, N. G. (2021). Principles of Economics (9th ed.). Cengage Learning.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Econometría Aplicada</p>
                  <p className="text-muted-foreground">
                    Wooldridge, J. M. (2019). Introductory Econometrics: A Modern Approach (7th ed.). 
                    Cengage Learning.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Mercados de Criptomonedas</p>
                  <p className="text-muted-foreground">
                    Baur, D. G., & Dimpfl, T. (2021). The volatility of Bitcoin and its role 
                    as a medium of exchange and a store of value. Empirical Economics.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Contexto Boliviano</p>
                  <p className="text-muted-foreground">
                    Banco Central de Bolivia. (2020). Resolución de Directorio N° 144/2020. 
                    Regulaciones cambiarias.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Badge variant="secondary">ECO-300</Badge>
                <Badge variant="secondary">UAGRM</Badge>
                <Badge variant="secondary">2025</Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  )
}
