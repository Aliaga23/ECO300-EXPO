import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface AIUnlockDialogProps {
  open: boolean;
  onUnlock: (password: string) => boolean;
  onCancel: () => void;
}

export function AIUnlockDialog({ open, onUnlock, onCancel }: AIUnlockDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Clear password and error when dialog closes
  useEffect(() => {
    if (!open) {
      setPassword('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  // Clear error when user starts typing
  useEffect(() => {
    if (password && error) {
      setError(null);
    }
  }, [password, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Por favor ingrese la contraseña');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = onUnlock(password);
      
      if (success) {
        // Dialog will close via parent component
        setPassword('');
        setError(null);
      } else {
        setError('Contraseña incorrecta. Intente nuevamente.');
        setPassword('');
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Error al validar la contraseña. Intente nuevamente.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit(e as any);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Acceso a Interpretación IA</DialogTitle>
          </div>
          <DialogDescription>
            Esta funcionalidad requiere autorización. Ingrese la contraseña para desbloquear 
            el análisis con inteligencia artificial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Contraseña
            </label>
            <div className="relative">
              <Input
                id="password"
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ingrese la contraseña"
                className={cn(
                  'pr-10',
                  error && 'border-destructive focus-visible:ring-destructive/20'
                )}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">
                  {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                </span>
              </Button>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!password.trim() || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? 'Validando...' : 'Desbloquear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
