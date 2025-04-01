import { toast as sonnerToast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

// Define a consistent interface similar to our previous toast implementation
interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

// Create a wrapper function to maintain the same API
const useToast = () => {
  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    // Map our variant to sonner's types
    switch (variant) {
      case 'success':
        sonnerToast.success(title, {
          description,
        });
        break;
      case 'destructive':
        sonnerToast.error(title, {
          description,
        });
        break;
      default:
        sonnerToast(title, {
          description,
        });
        break;
    }
  };

  return { toast };
};

export { useToast };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors />
    </>
  );
}