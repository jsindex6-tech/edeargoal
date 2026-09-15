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
        minHeight: '100%',
        borderRadius: '14px',
        color: '#FFF',
        padding: '10px 0 0',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "linear-gradient(180deg, rgba(4,10,22,0.15) 0%, rgba(5,18,33,0.32) 100%), url('/estadio-azul.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          transform: `translate(${offsetX}px, ${offsetY}px) scale(1.08)`,
          transition: 'transform 0.18s ease-out',
          willChange: 'transform'
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

        @keyframes pulseLight {
          0%, 100% { box-shadow: 0 0 10px rgba(122, 211, 255, 0.35), 0 0 18px rgba(122, 211, 255, 0.2); }
          50% { box-shadow: 0 0 20px rgba(122, 211, 255, 0.75), 0 0 30px rgba(122, 211, 255, 0.4); }
        }

        @keyframes driftBall {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -52%) scale(1.06); }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 15%, rgba(79, 176, 255, 0.18), transparent 30%)' }} />
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
          opacity: 0.8
        }} />
      ))}

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingTop: '8px', paddingLeft: '12px', paddingRight: '12px' }}>
        <div style={{ color: '#7ABFFF', fontSize: '0.7rem', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '10px', opacity: 0.96, textTransform: 'uppercase' }}>
          EDEARGOAL PRESENTA
        </div>
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(2.2rem, 4.2vw, 6.8rem)',
          lineHeight: 0.9,
          fontWeight: 800,
          letterSpacing: '-0.07em',
          color: '#F2F7FF',
          animation: 'glowText 2.8s ease-in-out infinite',
          textTransform: 'uppercase',
          textShadow: '0 0 18px rgba(145, 215, 255, 0.34), 0 0 38px rgba(92, 168, 255, 0.18)',
          transform: 'translateY(-6px)',
          opacity: 0.96
        }}>
          LA PASIÓN <br /> COMIENZA AQUÍ
        </h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1, marginTop: '18px' }}>
        <div style={{ position: 'relative', width: '100%', height: '26px' }} />
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', marginTop: '0px' }}>
          <div style={{
            position: 'relative',
            width: '70%',
            minWidth: '720px',
            height: '400px',
            opacity: 0.15,
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.18), transparent 62%)',
            borderRadius: '50%',
            filter: 'blur(14px)',
            transform: 'translateY(14px)'
          }} />
        </div>
      </div>
    </div>
  );
}
