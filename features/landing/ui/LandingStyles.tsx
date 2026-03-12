/**
 * Inline CSS for landing page animations and interactions.
 * @returns {JSX.Element} The rendered style element.
 */
export function LandingStyles() {
  return (
    <style>{`
      /* ── Cosmic animations ──────────────────────────────────────── */
      @keyframes tribes-twinkle {
        0%, 100% { opacity: 0.2; }
        50%       { opacity: 0.95; }
      }
      @keyframes tribes-float {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-12px); }
      }
      @keyframes tribes-glow {
        0%, 100% {
          box-shadow: 0 0 24px rgba(124,58,237,0.35),
                      0 0 48px rgba(124,58,237,0.15);
        }
        50% {
          box-shadow: 0 0 40px rgba(124,58,237,0.65),
                      0 0 80px rgba(124,58,237,0.28);
        }
      }

      /* ── Star particles ─────────────────────────────────────────── */
      .tribes-star {
        position: absolute;
        border-radius: 50%;
        background: white;
        animation: tribes-twinkle linear infinite;
      }

      /* ── Hero card float ────────────────────────────────────────── */
      .tribes-float { animation: tribes-float 7s ease-in-out infinite; }

      /* ── CTA glow pulse ─────────────────────────────────────────── */
      .tribes-glow-btn { animation: tribes-glow 3s ease-in-out infinite; }

      /* ── Nav link hover ─────────────────────────────────────────── */
      .tribes-nav-link { transition: color 0.15s; }
      .tribes-nav-link:hover { color: rgba(255,255,255,0.95) !important; }

      /* ── Card hover lift ────────────────────────────────────────── */
      .tribes-card {
        transition: border-color 0.2s, transform 0.22s;
      }
      .tribes-card:hover {
        border-color: rgba(255,255,255,0.15) !important;
        transform: translateY(-3px);
      }

      /* ── Scroll reveal ──────────────────────────────────────────── */
      [data-reveal] {
        opacity: 0;
        transform: translateY(28px);
        transition:
          opacity  0.65s cubic-bezier(0.4, 0, 0.2, 1),
          transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
      }
      [data-reveal].is-revealed {
        opacity: 1;
        transform: none;
      }
    `}</style>
  );
}
