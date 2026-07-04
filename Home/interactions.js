document.addEventListener('DOMContentLoaded', () => {
  // 1. Mouse Spotlight Cursor Glow
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth out cursor movement (Lerping) for high performance
  function updateGlowPosition() {
    currentX += (mouseX - currentX) * 0.15;
    currentY += (mouseY - currentY) * 0.15;
    glow.style.transform = `translate3d(calc(${currentX}px - 50%), calc(${currentY}px - 50%), 0)`;
    requestAnimationFrame(updateGlowPosition);
  }
  updateGlowPosition();

  // 2. Parallax Rotating Dumbbell
  const dumbbell = document.querySelector('.scroll-dumbbell');
  if (dumbbell) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY || window.pageYOffset;
      // Rotate by 0.15 deg per scroll pixel and translate vertically
      dumbbell.style.transform = `translateY(${scrolled * 0.25}px) rotate(${scrolled * 0.15}deg)`;
    });
  }

  // 3. Scroll Reveal Content (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
        // Optional: stop observing once revealed
        // revealObserver.unobserve(entry.target);
      } else {
        // Remove class if scroll back up to create continuous interactions
        entry.target.classList.remove('reveal-active');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px' // triggers slightly before entering view
  });

  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });
});
