import { useEffect, useRef, useState } from "react";

/**
 * FabricRollAnimation
 * A canvas-based 3D fabric unrolling from a bolt — appears on login + dashboard.
 * Pure JS/Canvas, no libraries needed.
 */
export default function FabricRollAnimation({ onComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    // --- Config ---
    const BOLT_X = W * 0.5;
    const BOLT_Y = H * 0.42;
    const BOLT_W = 120;
    const BOLT_H = 60;
    const ROLL_DURATION = 2200; // ms
    const FADE_DURATION = 600;
    const FABRIC_COLORS = ["#F97316","#E11D48","#0D9488","#8B5CF6","#F59E0B","#10B981"];
    const STRIPE_COLORS = ["#FBBF24","#FB7185","#34D399","#A78BFA","#FDE68A","#6EE7B7"];

    let startTime = null;
    let phase = "roll"; // roll | hold | fade
    let holdStart = null;
    let fadeStart = null;

    function drawBolt(cx, cy, w, h, color, t) {
      ctx.save();
      // Shadow
      ctx.shadowBlur = 30;
      ctx.shadowColor = color + "60";

      // Ellipse top (end of bolt)
      ctx.beginPath();
      ctx.ellipse(cx, cy - h/2, w/2, h*0.18, 0, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();

      // Body
      const grad = ctx.createLinearGradient(cx - w/2, 0, cx + w/2, 0);
      grad.addColorStop(0,   shadeColor(color, -30));
      grad.addColorStop(0.3, color);
      grad.addColorStop(0.7, shadeColor(color, 20));
      grad.addColorStop(1,   shadeColor(color, -20));
      ctx.beginPath();
      ctx.rect(cx - w/2, cy - h/2, w, h);
      ctx.fillStyle = grad;
      ctx.fill();

      // Fabric layer lines on body
      for (let i = 0; i < 6; i++) {
        const ly = cy - h/2 + (h / 6) * i + 4;
        ctx.beginPath();
        ctx.moveTo(cx - w/2, ly);
        ctx.lineTo(cx + w/2, ly);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Ellipse bottom
      ctx.beginPath();
      ctx.ellipse(cx, cy + h/2, w/2, h*0.18, 0, 0, Math.PI*2);
      ctx.fillStyle = shadeColor(color, -15);
      ctx.fill();

      // Label sticker
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      roundRect(ctx, cx - 22, cy - 12, 44, 24, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 7px 'Syne', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SURYA", cx, cy + 1);
      ctx.font = "6px 'Syne', sans-serif";
      ctx.fillText("CLOTH", cx, cy + 9);

      ctx.restore();
    }

    function drawFabric(progress, color, stripeColor) {
      // Fabric unrolls from bolt toward viewer (downward + perspective)
      const maxLen = H * 0.55;
      const len = maxLen * easeOutCubic(progress);
      const fabricW = BOLT_W * 0.85;

      ctx.save();
      ctx.translate(BOLT_X, BOLT_Y + BOLT_H/2);

      // Fabric strip with perspective taper
      const gradient = ctx.createLinearGradient(0, 0, 0, len);
      gradient.addColorStop(0,   color + "EE");
      gradient.addColorStop(0.3, color + "CC");
      gradient.addColorStop(0.7, shadeColor(color, -10) + "AA");
      gradient.addColorStop(1,   shadeColor(color, -20) + "66");

      // Main fabric body (trapezoid for perspective)
      const topW = fabricW;
      const botW = fabricW * 0.75; // narrows toward viewer
      ctx.beginPath();
      ctx.moveTo(-topW/2, 0);
      ctx.lineTo( topW/2, 0);
      ctx.lineTo( botW/2, len);
      ctx.lineTo(-botW/2, len);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Weave / stripe pattern
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 12; i++) {
        const y = (len / 12) * i;
        const wAtY = topW - (topW - botW) * (y / len);
        ctx.beginPath();
        ctx.moveTo(-wAtY/2, y);
        ctx.lineTo( wAtY/2, y);
        ctx.strokeStyle = stripeColor + "30";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // Vertical threads
      for (let i = -3; i <= 3; i++) {
        const xFrac = i / 3.5;
        const x0 = (topW/2) * xFrac;
        const x1 = (botW/2) * xFrac;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x1, len);
        ctx.strokeStyle = stripeColor + "20";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Bottom hem (curled edge)
      ctx.beginPath();
      ctx.ellipse(0, len, botW/2, 6, 0, 0, Math.PI);
      ctx.strokeStyle = shadeColor(color, -20) + "88";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    function drawParticles(t) {
      // Small floating fabric dust particles
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + t * 0.001;
        const r = 60 + Math.sin(t * 0.002 + i) * 20;
        const px = BOLT_X + Math.cos(angle) * r;
        const py = BOLT_Y + Math.sin(angle) * r * 0.4;
        const alpha = 0.15 + Math.sin(t * 0.003 + i) * 0.1;
        const size = 1.5 + Math.sin(t * 0.004 + i) * 1;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = FABRIC_COLORS[i % FABRIC_COLORS.length] + Math.round(alpha * 255).toString(16).padStart(2,"0");
        ctx.fill();
      }
    }

    function render(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, W, H);

      // Background radial glow
      const bgGrad = ctx.createRadialGradient(BOLT_X, BOLT_Y, 10, BOLT_X, BOLT_Y, W * 0.6);
      bgGrad.addColorStop(0,   "rgba(249,115,22,0.06)");
      bgGrad.addColorStop(0.4, "rgba(244,63,94,0.03)");
      bgGrad.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      if (phase === "roll") {
        const progress = Math.min(elapsed / ROLL_DURATION, 1);

        // Draw multiple fabric layers offset
        FABRIC_COLORS.slice(0, 3).forEach((color, i) => {
          const layerProgress = Math.max(0, progress - i * 0.08);
          if (layerProgress > 0) {
            ctx.globalAlpha = 0.25 - i * 0.07;
            ctx.save();
            ctx.translate((i-1) * 6, i * 4);
            drawFabric(layerProgress, color, STRIPE_COLORS[i]);
            ctx.restore();
            ctx.globalAlpha = 1;
          }
        });

        // Main fabric
        drawFabric(progress, "#F97316", "#FBBF24");

        drawParticles(elapsed);

        // Bolt on top
        drawBolt(BOLT_X, BOLT_Y, BOLT_W, BOLT_H, "#1C0900", progress);

        // "SURYA" text fades in
        const textAlpha = Math.max(0, (progress - 0.6) / 0.4);
        if (textAlpha > 0) {
          ctx.globalAlpha = textAlpha;
          ctx.font = "800 48px 'Syne', sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#F97316";
          ctx.fillText("SURYA", BOLT_X, BOLT_Y - BOLT_H - 20);
          ctx.font = "500 14px 'DM Sans', sans-serif";
          ctx.fillStyle = "#F9731390";
          ctx.shadowBlur = 0;
          ctx.letterSpacing = "0.18em";
          ctx.fillText("CLOTH STORE · BILLING SYSTEM", BOLT_X, BOLT_Y - BOLT_H);
          ctx.globalAlpha = 1;
        }

        if (progress >= 1) {
          phase = "hold";
          holdStart = timestamp;
        }

      } else if (phase === "hold") {
        drawFabric(1, "#F97316", "#FBBF24");
        drawParticles(elapsed);
        drawBolt(BOLT_X, BOLT_Y, BOLT_W, BOLT_H, "#1C0900", 1);
        ctx.font = "800 48px 'Syne', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#F97316";
        ctx.fillText("SURYA", BOLT_X, BOLT_Y - BOLT_H - 20);
        ctx.shadowBlur = 0;
        ctx.font = "500 14px 'DM Sans', sans-serif";
        ctx.fillStyle = "#F9731390";
        ctx.fillText("CLOTH STORE · BILLING SYSTEM", BOLT_X, BOLT_Y - BOLT_H);

        if (timestamp - holdStart > 800) {
          phase = "fade";
          fadeStart = timestamp;
        }

      } else if (phase === "fade") {
        const fp = (timestamp - fadeStart) / FADE_DURATION;
        ctx.globalAlpha = Math.max(0, 1 - fp);
        drawFabric(1, "#F97316", "#FBBF24");
        drawBolt(BOLT_X, BOLT_Y, BOLT_W, BOLT_H, "#1C0900", 1);
        ctx.font = "800 48px 'Syne', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#F97316";
        ctx.fillText("SURYA", BOLT_X, BOLT_Y - BOLT_H - 20);
        ctx.globalAlpha = 1;

        if (fp >= 1) {
          setVisible(false);
          onComplete?.();
          return;
        }
      }

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  if (!visible) return null;

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(160deg,#130800 0%,#1A0B02 50%,#0E0700 100%)",
      cursor: "pointer",
    }} onClick={() => { setVisible(false); onComplete?.(); }} />
  );
}

// --- Helpers ---
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function shadeColor(hex, pct) {
  const num = parseInt(hex.replace("#",""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + pct));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + pct));
  const b = Math.min(255, Math.max(0, (num & 0xff) + pct));
  return "#" + [r,g,b].map(v => v.toString(16).padStart(2,"0")).join("");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}
