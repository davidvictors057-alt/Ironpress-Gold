import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function copyToClipboard(text: string): Promise<boolean> {
  // Try navigator.clipboard first (only works in secure contexts/localhost)
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => {
        return fallbackCopyTextToClipboard(text);
      });
  }
  return Promise.resolve(fallbackCopyTextToClipboard(text));
}

function fallbackCopyTextToClipboard(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Ensure it's not visible or affecting layout
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  textArea.style.opacity = "0";
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    document.body.removeChild(textArea);
    return false;
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function cleanTextForSharing(text: string): string {
  return text
    .replace(/STATUS_[A-Z_Á-Ú]+/gi, "")
    .replace(/\[\[G\]\]/g, "✅ ")
    .replace(/\[\[R\]\]/g, "🚨 ")
    .replace(/\[\[B\]\]/g, "🔹 ")
    .replace(/\[\[Y\]\]/g, "⚡ ")
    .replace(/\[\[\/[GRBY]\]\]/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/[_]/g, "") // Limpa sublinhados de markdown que o WhatsApp confunde
    .trim();
}

export function openWhatsApp(text: string) {
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encodedText}`, "_blank");
}
