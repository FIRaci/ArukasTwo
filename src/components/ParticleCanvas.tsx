import React, { useEffect, useRef } from 'react';
import { ParticleType } from '../types';

interface ParticleCanvasProps {
  type: ParticleType;
  density?: number; // 10 - 50 particles
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  shape: 'petal' | 'leaf' | 'ginkgo' | 'snowflake' | 'circle' | 'sunbeam';
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ type, density = 25 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (type === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Color and shape setups by particle type
    const getParticleConfig = () => {
      switch (type) {
        case 'sakura':
          return {
            colors: ['#fbcfe8', '#f472b6', '#fda4af', '#fff1f2'],
            shape: 'petal' as const,
            speedY: [0.8, 1.8],
            speedX: [-0.6, 0.8],
          };
        case 'bamboo':
          return {
            colors: ['#86efac', '#4ade80', '#bbf7d0', '#22c55e'],
            shape: 'leaf' as const,
            speedY: [0.7, 1.5],
            speedX: [-0.4, 0.6],
          };
        case 'ginkgo':
          return {
            colors: ['#fde047', '#facc15', '#fb923c', '#f87171'],
            shape: 'ginkgo' as const,
            speedY: [0.6, 1.6],
            speedX: [-0.5, 0.7],
          };
        case 'ink':
          return {
            colors: ['#e2e8f0', '#cbd5e1', '#fef08a', '#fde68a'],
            shape: 'circle' as const,
            speedY: [0.3, 0.9],
            speedX: [-0.3, 0.3],
          };
        case 'snow':
          return {
            colors: ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd'],
            shape: 'snowflake' as const,
            speedY: [0.5, 1.4],
            speedX: [-0.3, 0.3],
          };
        case 'sunlight':
          return {
            colors: ['#fef08a', '#fed7aa', '#fde047', '#fbbf24'],
            shape: 'sunbeam' as const,
            speedY: [0.4, 1.1],
            speedX: [-0.4, 0.5],
          };
        case 'lavender':
          return {
            colors: ['#d8b4fe', '#c084fc', '#e9d5ff', '#a855f7'],
            shape: 'petal' as const,
            speedY: [0.7, 1.5],
            speedX: [-0.5, 0.6],
          };
        default:
          return null;
      }
    };

    const config = getParticleConfig();
    if (!config) return;

    const particles: Particle[] = Array.from({ length: density }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 6,
      speedY: Math.random() * (config.speedY[1] - config.speedY[0]) + config.speedY[0],
      speedX: Math.random() * (config.speedX[1] - config.speedX[0]) + config.speedX[0],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      opacity: Math.random() * 0.4 + 0.3,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      shape: config.shape,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.01) * 0.4;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'snowflake') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.5, 0);
          ctx.lineTo(p.size * 0.5, 0);
          ctx.moveTo(0, -p.size * 0.5);
          ctx.lineTo(0, p.size * 0.5);
          ctx.stroke();
        } else if (p.shape === 'leaf') {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.3, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Petal / Ginkgo / General graceful curve
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [type, density]);

  if (type === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ opacity: 0.85 }}
    />
  );
};

export default ParticleCanvas;
