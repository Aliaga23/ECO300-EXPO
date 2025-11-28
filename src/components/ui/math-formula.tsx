import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface MathFormulaProps {
  /** LaTeX notation for the formula */
  latex: string
  /** Display mode: block (centered) or inline */
  displayMode?: boolean
  /** CSS class name for the container */
  className?: string
  /** Fallback to show if rendering fails */
  errorFallback?: React.ReactNode
}

/**
 * Renders mathematical formulas using native HTML/CSS
 * Provides clean mathematical styling using Unicode
 * and CSS for better presentation than plain text.
 * 
 * For full LaTeX support, install katex: npm install katex
 */
export function MathFormula({ 
  latex, 
  displayMode = true, 
  className,
  errorFallback 
}: MathFormulaProps) {
  // Convert common LaTeX notation to styled HTML
  const renderedFormula = useMemo(() => {
    try {
      return convertLatexToHtml(latex)
    } catch {
      return errorFallback || latex
    }
  }, [latex, errorFallback])

  return (
    <div
      className={cn(
        'math-formula font-serif',
        displayMode ? 'text-center py-4 text-lg' : 'inline',
        className
      )}
      role="math"
      aria-label={latex}
      dangerouslySetInnerHTML={{ __html: renderedFormula as string }}
    />
  )
}

/**
 * Convert LaTeX notation to styled HTML
 * Supports common mathematical notation
 */
function convertLatexToHtml(latex: string): string {
  let html = latex

  // Fractions: \frac{numerator}{denominator}
  html = html.replace(
    /\\frac\{([^}]+)\}\{([^}]+)\}/g,
    '<span class="math-frac"><span class="math-num">$1</span><span class="math-denom">$2</span></span>'
  )

  // Nested fractions (second pass for inner fractions)
  html = html.replace(
    /\\frac\{([^}]+)\}\{([^}]+)\}/g,
    '<span class="math-frac"><span class="math-num">$1</span><span class="math-denom">$2</span></span>'
  )

  // Greek letters
  html = html.replace(/\\alpha/g, '<span class="math-greek">α</span>')
  html = html.replace(/\\beta/g, '<span class="math-greek">β</span>')
  html = html.replace(/\\gamma/g, '<span class="math-greek">γ</span>')
  html = html.replace(/\\delta/g, '<span class="math-greek">δ</span>')
  html = html.replace(/\\epsilon/g, '<span class="math-greek">ε</span>')
  html = html.replace(/\\varepsilon/g, '<span class="math-greek">ε</span>')
  html = html.replace(/\\Delta/g, '<span class="math-greek">Δ</span>')
  html = html.replace(/\\sigma/g, '<span class="math-greek">σ</span>')
  html = html.replace(/\\mu/g, '<span class="math-greek">μ</span>')

  // Subscripts and superscripts
  html = html.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
  html = html.replace(/_(\w)/g, '<sub>$1</sub>')
  html = html.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
  html = html.replace(/\^(\w)/g, '<sup>$1</sup>')

  // Natural log
  html = html.replace(/\\ln/g, '<span class="math-fn">ln</span>')
  html = html.replace(/\\log/g, '<span class="math-fn">log</span>')

  // Bar over letter (average)
  html = html.replace(/\\bar\{([^}]+)\}/g, '<span class="math-bar">$1</span>')
  html = html.replace(/\\overline\{([^}]+)\}/g, '<span class="math-bar">$1</span>')

  // Cdot for multiplication
  html = html.replace(/\\cdot/g, '<span class="math-op">·</span>')
  html = html.replace(/\\times/g, '<span class="math-op">×</span>')

  // Plus/minus
  html = html.replace(/\\pm/g, '±')

  // Infinity
  html = html.replace(/\\infty/g, '∞')

  // Absolute value
  html = html.replace(/\\left\|/g, '|')
  html = html.replace(/\\right\|/g, '|')

  // Parentheses
  html = html.replace(/\\left\(/g, '(')
  html = html.replace(/\\right\)/g, ')')
  html = html.replace(/\\left\[/g, '[')
  html = html.replace(/\\right\]/g, ']')

  // Text inside math
  html = html.replace(/\\text\{([^}]+)\}/g, '<span class="math-text">$1</span>')

  // Sum and product
  html = html.replace(/\\sum/g, '<span class="math-large">∑</span>')
  html = html.replace(/\\prod/g, '<span class="math-large">∏</span>')

  // Square root
  html = html.replace(/\\sqrt\{([^}]+)\}/g, '<span class="math-sqrt">√<span class="math-sqrt-content">$1</span></span>')

  // Approximately equal
  html = html.replace(/\\approx/g, '≈')
  html = html.replace(/\\neq/g, '≠')
  html = html.replace(/\\leq/g, '≤')
  html = html.replace(/\\geq/g, '≥')

  return html
}

/**
 * Pre-styled formula display for common elasticity formulas
 */
export function ElasticityFormulas() {
  return (
    <div className="space-y-6">
      {/* Midpoint Elasticity Formula */}
      <div className="bg-muted/50 p-6 rounded-lg border">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          Fórmula de Elasticidad Punto Medio
        </h4>
        <div className="flex flex-col items-center gap-4">
          <div className="math-display text-xl">
            <MathFormula 
              latex="E_d = \frac{\frac{Q_2 - Q_1}{(Q_2 + Q_1)/2}}{\frac{P_2 - P_1}{(P_2 + P_1)/2}}"
            />
          </div>
          <div className="text-muted-foreground text-sm">Forma simplificada:</div>
          <div className="math-display text-xl">
            <MathFormula 
              latex="E_d = \frac{\Delta Q / \bar{Q}}{\Delta P / \bar{P}}"
            />
          </div>
        </div>
      </div>

      {/* Log-Log Regression Formula */}
      <div className="bg-muted/50 p-6 rounded-lg border">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          Regresión Log-Log
        </h4>
        <div className="flex flex-col items-center gap-4">
          <div className="math-display text-xl">
            <MathFormula 
              latex="\ln(Q) = \alpha + \beta \cdot \ln(P) + \varepsilon"
            />
          </div>
          <div className="text-left text-sm text-muted-foreground mt-2 w-full max-w-md">
            <p className="font-medium mb-2">Donde:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="font-serif italic">β</span> = Elasticidad precio de la demanda
              </li>
              <li className="flex items-center gap-2">
                <span className="font-serif italic">α</span> = Intercepto (constante)
              </li>
              <li className="flex items-center gap-2">
                <span className="font-serif italic">ε</span> = Término de error aleatorio
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export a pre-configured display for common use
export function MidpointFormulaDisplay() {
  return (
    <div className="bg-linear-to-r from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
      <div className="text-center">
        <span className="text-2xl font-serif">
          E<sub>d</sub> = 
        </span>
        <span className="inline-block mx-2">
          <span className="math-frac inline-flex flex-col items-center mx-1">
            <span className="border-b border-current px-2 pb-0.5">
              ΔQ / Q̄
            </span>
            <span className="pt-0.5">
              ΔP / P̄
            </span>
          </span>
        </span>
      </div>
    </div>
  )
}

export function LogLogFormulaDisplay() {
  return (
    <div className="bg-linear-to-r from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
      <div className="text-center text-2xl font-serif">
        ln(Q) = <span className="italic">α</span> + <span className="italic">β</span> · ln(P) + <span className="italic">ε</span>
      </div>
    </div>
  )
}
