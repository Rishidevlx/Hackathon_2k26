import React, { useRef, useEffect } from 'react';

const BackgroundEffect = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                // Randomized size for "depth" feel
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = Math.random() * 0.6 - 0.3; 
                this.speedY = Math.random() * 0.6 - 0.3;
                this.color = '#00e5ff';
                this.pulse = Math.random() * Math.PI; // Random start phase for pulsing
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
                
                this.pulse += 0.02;
            }

            draw() {
                // Subtle pulse in opacity
                const opacity = 0.4 + Math.sin(this.pulse) * 0.3;
                ctx.fillStyle = `rgba(0, 229, 255, ${opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            // Increased density
            const numberOfParticles = (canvas.width * canvas.height) / 7000;
            for (let i = 0; i < numberOfParticles; i++) {
                let x = Math.random() * canvas.width;
                let y = Math.random() * canvas.height;
                particles.push(new Particle(x, y));
            }
        };

        const connect = () => {
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        const opacityValue = 1 - (distance / 120);
                        // Subtle flicker effect
                        const flicker = Math.random() > 0.98 ? 0.8 : 0.3;
                        ctx.strokeStyle = `rgba(0, 229, 255, ${opacityValue * flicker})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const drawGrid = () => {
            // Very subtle background grid
            ctx.strokeStyle = 'rgba(0, 162, 255, 0.03)';
            ctx.lineWidth = 1;
            const step = 50;
            for (let x = 0; x < canvas.width; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += step) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            connect();
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                zIndex: -1, 
                background: 'linear-gradient(to bottom, #000810, #001220)' 
            }} 
        />
    );
};

export default BackgroundEffect;
