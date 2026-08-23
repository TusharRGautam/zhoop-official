
    // ── STICKY TOP LOCK ON LOAD (PREVENTS ANY JUMP DOWN OR UP) ──
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    if (!window.location.hash) {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
    }

    window.addEventListener('load', () => {
        if (!window.location.hash) {
            document.documentElement.style.scrollBehavior = 'auto';
            window.scrollTo(0, 0);
            setTimeout(() => {
                document.documentElement.style.scrollBehavior = 'smooth';
            }, 100);
        } else {
            document.documentElement.style.scrollBehavior = 'smooth';
        }
    });


    // ── 3D ROLL-TEXT LINK SETUP ──
    document.querySelectorAll('.footer-links a').forEach(link => {
        const txt = link.textContent.trim();
        link.classList.add('roll-link');
        link.innerHTML = `
            <span class="roll-wrapper">
                <span class="roll-original">${txt}</span>
                <span class="roll-hover">${txt}</span>
            </span>
        `;
    });

    // ── PARTICLE CANVAS (3D Cyber Wave Mesh) ──
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let W, H;
    let time = 0;

    // Camera parameters
    const focalLength = 400;
    let angleX = 0.55; // Tilt
    let angleY = 0.45; // Rotation
    let targetAngleX = 0.55;
    let targetAngleY = 0.45;

    // Mouse interactive distortion
    let targetMouseX = 0;
    let targetMouseY = 0;
    let curMouseX = 0;
    let curMouseY = 0;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', e => {
        // Calculate normalized mouse coords (-1 to 1)
        targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
        
        // Tilt camera slightly based on mouse
        targetAngleY = 0.45 + targetMouseX * 0.15;
        targetAngleX = 0.55 + targetMouseY * 0.15;
    });

    // Scroll adds rotation
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        targetAngleY = 0.45 + targetMouseX * 0.15 + scrolled * 0.5;
    });

    // 3D Grid Wave config
    const cols = 28;
    const rows = 28;
    const spacing = 45;

    function project3D(x, y, z) {
        // Rotate around Y-axis (left/right)
        let cosY = Math.cos(angleY), sinY = Math.sin(angleY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;

        // Rotate around X-axis (tilt up/down)
        let cosX = Math.cos(angleX), sinX = Math.sin(angleX);
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        // Push back into screen Z space
        let zPos = z2 + 800; // Camera distance
        if (zPos <= 10) return null;

        // Project
        let scale = focalLength / zPos;
        return {
            x: W / 2 + x1 * scale,
            y: H / 2 + y2 * scale,
            depth: zPos,
            scale: scale
        };
    }

    function animateCanvas() {
        ctx.clearRect(0, 0, W, H);
        time += 0.025;

        // Smoothly interpolate mouse and angles
        curMouseX += (targetMouseX - curMouseX) * 0.08;
        curMouseY += (targetMouseY - curMouseY) * 0.08;
        angleX += (targetAngleX - angleX) * 0.08;
        angleY += (targetAngleY - angleY) * 0.08;

        const projectedPoints = [];

        // 1. Generate & distort all 3D grid points
        for (let c = 0; c < cols; c++) {
            projectedPoints[c] = [];
            for (let r = 0; r < rows; r++) {
                // Coordinate centering
                let x = (c - cols / 2) * spacing;
                let z = (r - rows / 2) * spacing;

                // Wave pattern
                let distFromCenter = Math.sqrt(x*x + z*z);
                let wave1 = Math.sin(distFromCenter * 0.012 - time * 1.5) * 28;
                let wave2 = Math.cos(x * 0.008 + time) * Math.sin(z * 0.008 + time) * 16;
                
                // Interactive mouse ripple distortion
                let mouseDistX = x - curMouseX * 300;
                let mouseDistZ = z - curMouseY * 300;
                let mouseDist = Math.sqrt(mouseDistX*mouseDistX + mouseDistZ*mouseDistZ);
                let mouseFactor = Math.max(0, 150 - mouseDist) / 150;
                let mouseRipple = Math.sin(mouseDist * 0.05 - time * 4) * 35 * mouseFactor;

                let y = wave1 + wave2 + mouseRipple;

                // Project
                let proj = project3D(x, y, z);
                projectedPoints[c][r] = proj;
            }
        }

        // 2. Draw lines connecting the grid points (creating the cyber mesh)
        ctx.lineWidth = 0.65;
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                let p = projectedPoints[c][r];
                if (!p) continue;

                // Connecting to right neighbor
                if (c < cols - 1) {
                    let pRight = projectedPoints[c + 1][r];
                    if (pRight) {
                        let alpha = Math.min(0.2, (p.scale * 0.15)) * (1 - (p.depth - 400) / 900);
                        ctx.strokeStyle = `rgba(0, 245, 255, ${Math.max(0, alpha)})`;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pRight.x, pRight.y);
                        ctx.stroke();
                    }
                }

                // Connecting to bottom neighbor
                if (r < rows - 1) {
                    let pBottom = projectedPoints[c][r + 1];
                    if (pBottom) {
                        let alpha = Math.min(0.2, (p.scale * 0.15)) * (1 - (p.depth - 400) / 900);
                        ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0, alpha)})`;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pBottom.x, pBottom.y);
                        ctx.stroke();
                    }
                }
            }
        }

        // 3. Draw floating highlight particle nodes at intersections
        for (let c = 0; c < cols; c += 2) {
            for (let r = 0; r < rows; r += 2) {
                let p = projectedPoints[c][r];
                if (!p) continue;

                let depthFade = (1 - (p.depth - 400) / 900);
                if (depthFade <= 0) continue;

                let size = p.scale * 0.9;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fillStyle = c % 4 === 0 
                    ? `rgba(0, 245, 255, ${0.45 * depthFade})` 
                    : `rgba(236, 72, 153, ${0.45 * depthFade})`;
                ctx.fill();
            }
        }

        requestAnimationFrame(animateCanvas);
    }
    animateCanvas();

    // ── PREMIUM HACKER TEXT DECRYPTION SCRAMBLER ──
    const scrambleLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+-/<>[]{}';
    
    function scramble(element) {
        if (element.classList.contains('no-scramble')) return;
        if (element.classList.contains('scrambling')) return;
        element.classList.add('scrambling');
        
        const originalText = element.getAttribute('data-value') || element.innerText;
        if (!element.getAttribute('data-value')) {
            element.setAttribute('data-value', originalText);
        }
        
        let iteration = 0;
        let interval = setInterval(() => {
            element.innerText = originalText
                .split('')
                .map((char, index) => {
                    if (char === ' ' || char === '\n' || char === '\r') return char;
                    if (index < iteration) {
                        return originalText[index];
                    }
                    return scrambleLetters[Math.floor(Math.random() * scrambleLetters.length)];
                })
                .join('');
            
            if (iteration >= originalText.length) {
                clearInterval(interval);
                element.classList.remove('scrambling');
            }
            iteration += 1/3;
        }, 25);
    }

    // Set up hover scrambling (scramble inner spans for roll links to prevent double text content)
    document.querySelectorAll('.section-title, .section-label, .contact-mega, .footer-links a').forEach(el => {
        el.addEventListener('mouseenter', () => {
            const original = el.querySelector('.roll-original');
            const hover = el.querySelector('.roll-hover');
            if (original && hover) {
                scramble(original);
                scramble(hover);
            } else {
                scramble(el);
            }
        });
    });

    // Auto scramble on Viewport Entry
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    scramble(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.section-title, .section-label, .contact-mega').forEach(el => {
            observer.observe(el);
        });
    }

    // ── 3D PARALLAX TILT ON CARDS ──
    document.querySelectorAll('.s-card, .w-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            
            // Mouse coords relative to card center (-1 to 1)
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const tiltX = (y - 0.5) * -16; // Rotate around X based on vertical move
            const tiltY = (x - 0.5) * 16;  // Rotate around Y based on horizontal move

            // Update mouse glow positions
            card.style.setProperty('--mx', (x * 100) + '%');
            card.style.setProperty('--my', (y * 100) + '%');

            // Apply 3D rotation and translation
            gsap.to(card, {
                rotationX: tiltX,
                rotationY: tiltY,
                transformPerspective: 1200,
                z: 15,
                duration: 0.4,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        });

        card.addEventListener('mouseleave', () => {
            // Smooth reset rotation on mouse leave
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                z: 0,
                duration: 0.75,
                ease: 'power3.out',
                overwrite: 'auto'
            });
        });
    });

    // ── MAGNETIC BUTTON INTERACTIONS ──
    document.addEventListener('mousemove', e => {
        // Skip on mobile screens
        if (window.innerWidth <= 768) return;

        document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta, .contact-chip, .nav-logo').forEach(el => {
            const rect = el.getBoundingClientRect();
            const elX = rect.left + rect.width / 2;
            const elY = rect.top + rect.height / 2;
            const dx = e.clientX - elX;
            const dy = e.clientY - elY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Trigger magnetic range
            if (dist < 75) {
                gsap.to(el, {
                    x: dx * 0.38,
                    y: dy * 0.38,
                    duration: 0.35,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            } else {
                gsap.to(el, {
                    x: 0,
                    y: 0,
                    duration: 0.65,
                    ease: 'elastic.out(1.1, 0.45)',
                    overwrite: 'auto'
                });
            }
        });
    });

    gsap.registerPlugin(ScrollTrigger);

    // ── SCROLL-DRIVEN MORPHING GLOWS ──
    gsap.to('.glow-1', {
        x: '45vw',
        y: '50vh',
        opacity: 0.22,
        duration: 1,
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2
        }
    });
    gsap.to('.glow-2', {
        x: '-45vw',
        y: '-55vh',
        opacity: 0.22,
        duration: 1,
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2
        }
    });

    // ── DIAGONAL WIPE REVEAL ANIMATION ──
    gsap.utils.toArray('.reveal-wipe').forEach(el => {
        gsap.to(el, {
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            duration: 1.4,
            ease: 'power3.inOut',
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // HERO HEADLINE — word-by-word reveal (using fromTo so text is visible even if GSAP fails)
    gsap.timeline({ delay: 0.3 })
        .to('#hero-pill', { opacity:1, y:0, duration:0.8, ease:'power3.out' })
        .fromTo('#hero-h1 .word-inner',
            { y: '105%', opacity: 0 },
            { y: '0%', opacity: 1, duration: 1.1, stagger: 0.15, ease: 'expo.out' },
        '-=0.4')
        .to('#hero-sub', { opacity:1, y:0, duration:0.8, ease:'power3.out' }, '-=0.6')
        .to('#hero-stats', { opacity:1, duration:0.6, ease:'power2.out' }, '-=0.5')
        .to('#hero-btns', { opacity:1, y:0, duration:0.7, ease:'power3.out' }, '-=0.5')
        .to('#scroll-ind', { opacity:1, duration:0.5 }, '-=0.2');

    // HERO 3D TILT
    document.getElementById('hero').addEventListener('mousemove', e => {
        const { clientX: x, clientY: y, currentTarget: el } = e;
        const { width: W, height: H, left, top } = el.getBoundingClientRect();
        const rx = ((y - top) / H - 0.5) * -12;
        const ry = ((x - left) / W - 0.5) * 12;
        gsap.to('#hero-h1', {
            rotationX: rx, rotationY: ry,
            transformPerspective: 900,
            duration: 0.6,
            ease: 'power2.out'
        });
    });
    document.getElementById('hero').addEventListener('mouseleave', () => {
        gsap.to('#hero-h1', { rotationX:0, rotationY:0, duration:1, ease:'elastic.out(1,0.5)' });
    });

    // COUNTER ANIMATION
    function animateCounter(el, target) {
        const suffix = el.dataset.count == 100 ? '%' : '+';
        gsap.fromTo(el, { innerText: 0 }, {
            innerText: target,
            duration: 2,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate() { el.innerText = Math.floor(el.innerText) + suffix; }
        });
    }

    ScrollTrigger.create({
        trigger: '#hero-stats',
        start: 'top 80%',
        once: true,
        onEnter() {
            document.querySelectorAll('.stat-number').forEach(el => {
                animateCounter(el, parseInt(el.dataset.count));
            });
        }
    });

    // SCROLL REVEAL
    gsap.utils.toArray('.reveal-up').forEach(el => {
        gsap.fromTo(el, { opacity:0, y:50 }, {
            opacity:1, y:0, duration:0.9,
            ease:'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    gsap.utils.toArray('.reveal-left').forEach(el => {
        gsap.fromTo(el, { opacity:0, x:-50 }, {
            opacity:1, x:0, duration:0.9,
            ease:'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    gsap.utils.toArray('.reveal-right').forEach(el => {
        gsap.fromTo(el, { opacity:0, x:50 }, {
            opacity:1, x:0, duration:0.9,
            ease:'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // WORK MOSAIC — click to interact
    document.querySelectorAll('.w-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't intercept if clicking direct external link
            if (e.target.closest('.w-link')) return;

            const interactBtn = this.querySelector('.w-interact');
            const iframe = this.querySelector('iframe');
            if (iframe) {
                const dataSrc = iframe.getAttribute('data-src');
                if (dataSrc && (!iframe.src || iframe.src === 'about:blank' || iframe.src === window.location.href)) {
                    iframe.src = dataSrc;
                }
                iframe.style.pointerEvents = 'auto';
                iframe.style.opacity = '1';
                if (interactBtn) interactBtn.classList.add('hidden');
                const previewImg = this.querySelector('.w-preview-img, .w-preview-content');
                if (previewImg) previewImg.style.opacity = '0';
                const overlay = this.querySelector('.w-overlay');
                if (overlay) overlay.style.opacity = '0';
                setTimeout(() => { if (overlay) overlay.style.opacity = ''; }, 2500);
            } else {
                // If there's no iframe, open the data-url link in a new tab
                const url = this.getAttribute('data-url');
                if (url) {
                    window.open(url, '_blank');
                }
            }
        });
    });

    // MOBILE APP CARDS — click to open Google Play
    document.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('click', function(e) {
            const url = this.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });

    // IFRAME FADE IN on load
    document.querySelectorAll('.w-iframe-wrap iframe').forEach(iframe => {
        iframe.style.pointerEvents = 'none';
        iframe.addEventListener('load', () => {
            if (iframe.src && iframe.src !== 'about:blank' && iframe.src !== window.location.href) {
                iframe.style.opacity = '1';
            }
        });
    });

    // NAV SCROLL EFFECT
    ScrollTrigger.create({
        start: 'top -60',
        onUpdate(self) {
            document.getElementById('main-nav').style.background =
                self.direction === 1 ? 'rgba(3,5,7,0.92)' : 'rgba(3,5,7,0.7)';
        }
    });

    // IFRAME LOADERS
    document.querySelectorAll('.work-preview iframe').forEach(iframe => {
        iframe.addEventListener('load', () => {
            iframe.style.opacity = '1';
        });
        iframe.style.opacity = '0';
        iframe.style.transition = 'opacity 0.5s ease';
    });

    // ── MOBILE NAV DRAWER ──
    const toggle = document.getElementById('mobileToggle');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileOverlay');

    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('open');
        toggle.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        toggle.classList.remove('open');
        document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
        drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    overlay.addEventListener('click', closeDrawer);

    // Close drawer when any link is clicked
    document.querySelectorAll('.mob-link').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });



    function initGrowthJourney() {
        const progressLine = document.getElementById('journey-progress-line');
        const progressDot  = document.getElementById('journey-progress-dot');

        if (!progressLine || !progressDot) return;

        const milestones = [
            { id: 'ms-1', cardId: 'fc-1', pbId: 'pb-1', color: '#00f5ff' },
            { id: 'ms-2', cardId: 'fc-2', pbId: 'pb-2', color: '#a855f7' },
            { id: 'ms-3', cardId: 'fc-3', pbId: 'pb-3', color: '#22c55e' },
            { id: 'ms-4', cardId: 'fc-4', pbId: 'pb-4', color: '#ec4899' },
            { id: 'ms-5', cardId: 'fc-5', pbId: 'pb-5', color: '#fbbf24' },
        ];

        // 1. Progress line filling - only grows, never shrinks on scroll up
        let maxProgress = 0;
        ScrollTrigger.create({
            trigger: '#process',
            start: 'top 75%',
            end: 'bottom 25%',
            onUpdate(self) {
                const progress = self.progress;
                if (progress > maxProgress) {
                    maxProgress = progress;
                    
                    // Update line height
                    progressLine.style.height = `${maxProgress * 100}%`;
                    
                    // Position and show progress dot
                    progressDot.style.top = `${maxProgress * 100}%`;
                    progressDot.style.opacity = maxProgress > 0.01 && maxProgress < 0.99 ? '1' : '0';

                    // Update dot color based on active milestone thresholds
                    let activeColor = '#00f5ff';
                    const thresholds = [0.05, 0.28, 0.52, 0.75, 0.95];
                    thresholds.forEach((th, idx) => {
                        if (maxProgress >= th) {
                            activeColor = milestones[idx].color;
                        }
                    });
                    progressDot.style.backgroundColor = activeColor;
                    progressDot.style.boxShadow = `0 0 20px ${activeColor}`;
                }
            }
        });

        // 2. Individual triggers for milestones - snappier response, once triggered stays visible
        milestones.forEach(m => {
            const item = document.getElementById(m.id);
            if (!item) return;

            const iconWrap = item.querySelector('.ms-icon-wrap');
            const icon = item.querySelector('i');
            const card = document.getElementById(m.cardId);
            const pb = document.getElementById(m.pbId);

            ScrollTrigger.create({
                trigger: item,
                start: 'top 85%', // Trigger faster (sooner) in viewport
                once: true, // Run animation only once
                onEnter() {
                    // Activate node styling
                    if (iconWrap) {
                        iconWrap.style.borderColor = m.color;
                        iconWrap.style.boxShadow = `0 0 30px ${m.color}80`;
                        iconWrap.style.background = m.color;
                    }
                    if (icon) {
                        icon.style.color = '#030507';
                    }
                    // Show float card
                    if (card) {
                        card.classList.add('ms-card-visible');
                    }
                    // Light up progress bar segment
                    if (pb) {
                        pb.classList.add('pb-active');
                    }
                }
            });
        });

        // Rocket icon jiggle on complete
        ScrollTrigger.create({
            trigger: '#ms-5',
            start: 'top 80%',
            once: true,
            onEnter() {
                const finalIcon = document.getElementById('ms-final-icon');
                if (finalIcon) {
                    gsap.fromTo(finalIcon,
                        { rotation: -15, scale: 0.8 },
                        { rotation: 0, scale: 1, duration: 1.2, ease: 'elastic.out(1.2, 0.5)' }
                    );
                }
            }
        });
    }

    // Initialize immediately when layout is ready so the scroll line draws instantly
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGrowthJourney);
    } else {
        initGrowthJourney();
    }

    // Fallback: Refresh ScrollTrigger safely without viewport scrolling
    window.addEventListener('load', () => {
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" });
        }
    });

    // ── CONTACT FORM HANDLER (WHATSAPP & EMAIL) ──
    const contactForm = document.getElementById('zhoop-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('cf-name').value.trim();
            const contactInfo = document.getElementById('cf-contact').value.trim();
            const service = document.getElementById('cf-service').value;
            const message = document.getElementById('cf-message').value.trim();

            const text = `Hi Zhoop Team!👋\n\n*Name:* ${name}\n*Contact:* ${contactInfo}\n*Service Needed:* ${service}\n*Project Details:* ${message || 'N/A'}`;
            const waUrl = `https://wa.me/918169151456?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank');
        });

        const btnEmail = document.getElementById('btn-submit-email');
        if (btnEmail) {
            btnEmail.addEventListener('click', function() {
                const name = document.getElementById('cf-name').value.trim();
                const contactInfo = document.getElementById('cf-contact').value.trim();
                const service = document.getElementById('cf-service').value;
                const message = document.getElementById('cf-message').value.trim();

                const subject = `New Inquiry from ${name || 'Website Visitor'} - Zhoop`;
                const body = `Hi Zhoop Team,\n\nName: ${name}\nContact: ${contactInfo}\nService Required: ${service}\nMessage:\n${message}`;
                const mailtoUrl = `mailto:tushargautam@zhoop.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoUrl;
            });
        }
    }


    // ── SMOOTH SCROLL HANDLER FOR HEADER & NAVIGATION ANCHOR LINKS ──
    document.querySelectorAll('a[href^="#"], .mob-link[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const navHeight = 90;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
