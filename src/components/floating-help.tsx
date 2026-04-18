import { MessageCircle } from "lucide-react";

export function FloatingHelp() {
  return (
    <a
      href="https://wa.me/8801700000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-24 right-4 z-30 hidden h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground shadow-elevated transition-transform hover:scale-105 md:bottom-6 md:right-6 md:inline-flex"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
