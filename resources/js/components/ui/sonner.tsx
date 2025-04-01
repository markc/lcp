import { Toaster as Sonner, ToasterProps } from "sonner";
import { useEffect, useState } from "react";

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  
  useEffect(() => {
    // Get the current theme from localStorage
    const savedTheme = localStorage.getItem('appearance') as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Listen for theme changes
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem('appearance') as "light" | "dark" | "system" | null;
      if (currentTheme) {
        setTheme(currentTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };