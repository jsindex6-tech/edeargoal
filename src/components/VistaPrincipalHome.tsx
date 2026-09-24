import { useState } from 'react';

interface Props {
  partidos: unknown[];
  esNeon: boolean;
  colCardInner: string;
  colBorder: string;
  colText: string;
  colTextMuted: string;
}

export default function VistaPrincipalHome(_props: Props) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const particulas = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    left: `${(i * 13 + 7) % 100}%`,
    top: `${(i * 17 + 6) % 100}%`,
    delay: `${(i * 0.55).toFixed(2)}s`,
    duration: `${4.5 + (i % 7) * 0.7}s`,
    size: `${4 + (i % 5)}px`
  }));

  const moverParallax = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setParallax({ x, y });
  };

  const resetParallax = () => setParallax({ x: 0, y: 0 });
  const offsetX = -parallax.x * 34;
  const offsetY = -parallax.y * 28;

  return (
    <div
      onMouseMove={moverParallax}
      onMouseLeave={resetParallax}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '520px',
        borderRadius: '14px',
        color: '#FFF',
        padding: '10px 0 0',
      }}
    >
      {/* IMAGEN DEL ESTADIO (Ahora con visibilidad alta) */}
      <div
        style={{
          position: 'absolute',
          inset: '-20px',
          backgroundImage: "linear-gradient(180deg, rgba(4,10,22,0.2) 0%, rgba(5,18,33,0.5) 100%), url('/estadio-azul.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          transform: `translate(${offsetX}px, ${offsetY}px) scale(1.1)`,
          transition: 'transform 0.18s ease-out',
          willChange: 'transform',
          zIndex: 0
        }}
      />

      <style>{`
        @keyframes glowText {
          0%, 100% { text-shadow: 0 0 18px rgba(164, 221, 255, 0.7), 0 0 42px rgba(94, 167, 255, 0.52); }
          50% { text-shadow: 0 0 26px rgba(194, 236, 255, 0.9), 0 0 52px rgba(99, 184, 255, 0.7), 0 0 72px rgba(89, 163, 255, 0.45); }
        }

        @keyframes floatSnow {
          0% { transform: translate3d(0, -10px, 0) scale(0.9); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate3d(10px, 130px, 0) scale(1.15); opacity: 0; }
        }
      `}</style>

      {/* Brillo circular central */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(79, 176, 255, 0.25), transparent 60%)', zIndex: 1 }} />

      {/* Partículas de nieve */}
      {particulas.map((p) => (
        <span key={p.id} style={{
          position: 'absolute',
          left: p.left,
          top: p.top,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.8)',
          boxShadow: '0 0 12px rgba(255,255,255,0.9)',
          animation: `floatSnow ${p.duration} ease-in-out infinite`,
          animationDelay: p.delay,
          opacity: 0.8,
          zIndex: 1
        }} />
      ))}

      {/* Título e información */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', paddingTop: '40px', paddingLeft: '12px', paddingRight: '12px' }}>
        <div style={{ color: '#7ABFFF', fontSize: '0.75rem', letterSpacing: '0.25em', fontWeight: '700', marginBottom: '14px', opacity: 0.96, textTransform: 'uppercase' }}>
          EDEARGOAL PRESENTA
        </div>
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(2.5rem, 5vw, 4.8rem)',
          lineHeight: 0.95,
          fontWeight: 800,
          letterSpacing: '-0.05em',
          color: '#F2F7FF',
          animation: 'glowText 2.8s ease-in-out infinite',
          textTransform: 'uppercase',
          textShadow: '0 0 18px rgba(145, 215, 255, 0.6), 0 0 38px rgba(92, 168, 255, 0.4)'
        }}>
          LA PASIÓN <br /> COMIENZA AQUÍ
        </h1>
      </div>
    </div>
  );
}