import { useEffect, useRef } from 'react';
import { getSkin } from '@/lib/skins';
import player from '@/lib/radioPlayer';

const SKIN_STYLES = {
  'default':        { bars: 'hsl(217, 91%, 60%)',  bg: 'rgba(0,0,0,0)',   style: 'bars'        },
  'ham-radio':      { bars: 'hsl(38, 100%, 52%)',  bg: 'rgba(0,0,0,0)',   style: 'bars'        },
  'pip-boy':        { bars: 'hsl(115, 65%, 42%)',  bg: 'rgba(0,0,0,0)',   style: 'oscilloscope'},
  'graphing-calc':  { bars: 'hsl(0, 0%, 15%)',     bg: 'rgba(0,0,0,0)',   style: 'pixel'       },
  'audio-rack':     { bars: 'hsl(120, 55%, 55%)',  bg: 'rgba(0,0,0,0)',   style: 'vu'          },
  'retro-scifi':    { bars: 'hsl(180, 100%, 45%)', bg: 'rgba(0,0,0,0)',   style: 'wave'        },
};

export default function RadioVisualizer({ isPlaying, height = 80 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const skinId = getSkin();
  const theme = SKIN_STYLES[skinId] || SKIN_STYLES['default'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const data = player.getFrequencyData();
      const len = data.length;

      if (theme.style === 'bars' || theme.style === 'vu') {
        const barCount = theme.style === 'vu' ? 24 : 32;
        const barW = Math.floor(W / barCount) - 1;
        const step = Math.floor(len / barCount);
        for (let i = 0; i < barCount; i++) {
          const val = data[i * step] / 255;
          const barH = Math.max(2, val * H);
          const x = i * (barW + 1);
          const y = H - barH;
          if (theme.style === 'vu') {
            // VU: color gradient green → yellow → red
            const pct = val;
            const r = Math.round(pct > 0.7 ? 220 : pct > 0.5 ? 180 : 50);
            const g = Math.round(pct > 0.7 ? 50 : 200);
            ctx.fillStyle = `rgb(${r},${g},50)`;
          } else {
            ctx.fillStyle = theme.bars;
          }
          ctx.fillRect(x, y, barW, barH);
          // Peak dot
          ctx.fillStyle = theme.bars;
          ctx.fillRect(x, y - 2, barW, 2);
        }
      } else if (theme.style === 'oscilloscope') {
        // Pip-Boy: oscilloscope line
        ctx.strokeStyle = theme.bars;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = theme.bars;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const sliceW = W / len;
        for (let i = 0; i < len; i++) {
          const v = data[i] / 128.0;
          const y = (v * H) / 2;
          i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * sliceW, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (theme.style === 'pixel') {
        // Graphing Calc: pixelated bars with discrete jumps
        const barCount = 20;
        const barW = Math.floor(W / barCount) - 2;
        const step = Math.floor(len / barCount);
        const levels = 8;
        const levelH = Math.floor(H / levels);
        for (let i = 0; i < barCount; i++) {
          const val = data[i * step] / 255;
          const filledLevels = Math.round(val * levels);
          for (let l = 0; l < filledLevels; l++) {
            ctx.fillStyle = l === filledLevels - 1 ? '#000' : theme.bars;
            ctx.fillRect(i * (barW + 2), H - (l + 1) * levelH + 1, barW, levelH - 2);
          }
        }
      } else if (theme.style === 'wave') {
        // Retro Sci-Fi: smooth wave
        ctx.strokeStyle = theme.bars;
        ctx.lineWidth = 2;
        ctx.shadowColor = theme.bars;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let i = 0; i < W; i++) {
          const idx = Math.floor((i / W) * len);
          const val = (data[idx] / 255) * 0.8 + 0.1;
          const y = H / 2 + Math.sin((i / W) * Math.PI * 4) * val * (H / 2 - 4);
          i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Idle shimmer when not playing
      if (!isPlaying) {
        ctx.clearRect(0, 0, W, H);
        const t = Date.now() / 1000;
        ctx.strokeStyle = theme.bars;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < W; i++) {
          const y = H / 2 + Math.sin(i * 0.05 + t * 2) * 4;
          i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, skinId]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      className="w-full"
      style={{ display: 'block', imageRendering: skinId === 'graphing-calc' ? 'pixelated' : 'auto' }}
    />
  );
}