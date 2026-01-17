import { useEffect, useRef } from 'react';

/**
 * FireDrops Component
 * A transparent, full-screen particle overlay simulating falling fire embers.
 * Designed to be placed over any background.
 */
const Fire = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Configuration
    const PARTICLE_COUNT = 150;
    let embers = [];

    class Ember {
      constructor(width, height) {
        this.width = width;
        this.height = height;
        this.reset();
      }

      reset() {
        this.x = Math.random() * this.width;
        this.y = Math.random() * -this.height; 
        this.size = Math.random() * 2.5 + 0.5;
        this.speedY = Math.random() * 1.2 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.opacity = Math.random() * 0.6 + 0.4;
        // Varying from deep red to bright orange
        this.hue = Math.random() * 25 + 10; 
        this.flickerSpeed = Math.random() * 0.02 + 0.005;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        // Oscillate opacity for the glowing flicker effect
        this.opacity -= this.flickerSpeed;
        if (this.opacity <= 0.1 || this.opacity >= 0.9) {
          this.flickerSpeed *= -1;
        }

        // Reset once fully off the bottom
        if (this.y > this.height + 20) {
          this.reset();
        }
      }

      draw(context) {
        context.save();
        context.globalAlpha = this.opacity;
        
        // Glow effect
        const gradient = context.createRadialGradient(
          this.x, this.y, 0, 
          this.x, this.y, this.size * 3
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 60%, 1)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);
        
        context.beginPath();
        context.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        context.fillStyle = gradient;
        context.fill();
        
        // Bright hot core
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = '#fff9e6';
        context.fill();
        
        context.restore();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      embers = Array.from({ length: PARTICLE_COUNT }, () => new Ember(canvas.width, canvas.height));
    };

    const animate = () => {
      // ClearRect with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      embers.forEach(ember => {
        ember.update();
        ember.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-50">
      <canvas
        ref={canvasRef}
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default Fire;