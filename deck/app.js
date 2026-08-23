/**
 * ==========================================================================
 * DIGITAL SOLUTIONS PITCH DECK & LANDING PAGE SCRIPT
 * Glassmorphic ScrollSpy, Live ROI Calculator, FAQ Accordion,
 * Presenter Mode & Investor Modal
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------------------------------------
  // 1. SCROLL SPY & SECTION HIGHLIGHTING (Header Nav & Floating Dock)
  // ------------------------------------------------------------------------
  const sections = Array.from(document.querySelectorAll('.deck-section'));
  const headerNavLinks = document.querySelectorAll('.nav-links a');
  const floatingNavLinks = document.querySelectorAll('.f-nav-item');
  let currentSlideIndex = 0;

  function updateActiveNav() {
    let currentSectionId = '';
    const scrollPos = window.scrollY + 220;

    sections.forEach((sec, idx) => {
      const secTop = sec.offsetTop;
      const secHeight = sec.offsetHeight;
      if (scrollPos >= secTop && scrollPos < secTop + secHeight) {
        currentSectionId = sec.getAttribute('id');
        currentSlideIndex = idx;
      }
    });

    if (!currentSectionId && sections.length > 0) {
      currentSectionId = sections[0].getAttribute('id');
      currentSlideIndex = 0;
    }

    // Update Header Nav
    headerNavLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Floating Nav
    floatingNavLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update HUD Indicator if Presenter Mode is active
    const hudIndicator = document.getElementById('hudSlideIndicator');
    if (hudIndicator) {
      const pad = (num) => String(num).padStart(2, '0');
      hudIndicator.textContent = `${pad(currentSlideIndex + 1)} / ${pad(sections.length)}`;
    }
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ------------------------------------------------------------------------
  // 1.1 SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // ------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.section-card, .prob-item-card, .sol-card, .why-card, .phase-box, .roi-calculator-card, .deck-faq-wrapper');
  
  revealElements.forEach((el) => {
    el.classList.add('reveal-on-scroll');
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach((el) => revealObserver.observe(el));

  // ------------------------------------------------------------------------
  // 2. INTERACTIVE ROI & FINANCIAL SIMULATOR WIDGET
  // ------------------------------------------------------------------------
  const capitalSlider = document.getElementById('capitalSlider');
  const dealsSlider = document.getElementById('dealsSlider');
  const capitalValDisplay = document.getElementById('capitalValDisplay');
  const dealsValDisplay = document.getElementById('dealsValDisplay');
  const monthlyRevDisplay = document.getElementById('monthlyRevDisplay');
  const annualRunRateDisplay = document.getElementById('annualRunRateDisplay');
  const paybackDisplay = document.getElementById('paybackDisplay');
  const marginDisplay = document.getElementById('marginDisplay');

  function calculateROI() {
    if (!capitalSlider || !dealsSlider) return;

    const capital = parseFloat(capitalSlider.value); // in Lakhs
    const deals = parseInt(dealsSlider.value, 10); // per month

    // Average Deal Size blended across Websites, CRM, Games & Retainers (~₹50K - ₹60K blended)
    const avgDealValue = 0.55; // ₹55,000 in Lakhs
    const monthlyInflow = (deals * avgDealValue); // Lakhs
    const annualRunRate = monthlyInflow * 12; // Lakhs

    // Estimated payback in months based on capital deployed and monthly inflow
    const netProfitRate = 0.65; // 65% net margin
    const netMonthlyProfit = monthlyInflow * netProfitRate;
    let paybackMonths = Math.round(capital / Math.max(netMonthlyProfit, 0.5));
    if (paybackMonths < 3) paybackMonths = 3;
    if (paybackMonths > 12) paybackMonths = 12;

    // Update UI
    capitalValDisplay.textContent = `₹${capital.toFixed(1)} Lakh`;
    dealsValDisplay.textContent = `${deals} Deals / mo`;
    monthlyRevDisplay.textContent = `₹${monthlyInflow.toFixed(1)} Lakh`;
    annualRunRateDisplay.textContent = `₹${annualRunRate.toFixed(1)} Lakh`;
    paybackDisplay.textContent = `${paybackMonths} - ${paybackMonths + 2} Months`;
    marginDisplay.textContent = `${Math.round(netProfitRate * 100)}% - 75%`;
  }

  if (capitalSlider && dealsSlider) {
    capitalSlider.addEventListener('input', calculateROI);
    dealsSlider.addEventListener('input', calculateROI);
    calculateROI();
  }

  // ------------------------------------------------------------------------
  // 3. INVESTOR FAQ ACCORDION
  // ------------------------------------------------------------------------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close other items
        faqItems.forEach((i) => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // ------------------------------------------------------------------------
  // 4. FULLSCREEN PRESENTER MODE (Zoom & Pitch Ready)
  // ------------------------------------------------------------------------
  const presentModeBtn = document.getElementById('presentModeBtn');
  const presenterHud = document.getElementById('presenterHud');
  const prevSlideBtn = document.getElementById('prevSlideBtn');
  const nextSlideBtn = document.getElementById('nextSlideBtn');
  const exitPresentBtn = document.getElementById('exitPresentBtn');
  let isPresenterMode = false;

  function scrollToSlide(index) {
    if (index >= 0 && index < sections.length) {
      currentSlideIndex = index;
      sections[currentSlideIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      updateActiveNav();
    }
  }

  function togglePresenterMode(enable) {
    isPresenterMode = enable;
    if (isPresenterMode) {
      if (presenterHud) presenterHud.classList.add('active');
      scrollToSlide(currentSlideIndex);
      // Try entering fullscreen if available
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (presenterHud) presenterHud.classList.remove('active');
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  if (presentModeBtn) {
    presentModeBtn.addEventListener('click', () => togglePresenterMode(true));
  }

  if (exitPresentBtn) {
    exitPresentBtn.addEventListener('click', () => togglePresenterMode(false));
  }

  if (prevSlideBtn) {
    prevSlideBtn.addEventListener('click', () => {
      scrollToSlide(Math.max(0, currentSlideIndex - 1));
    });
  }

  if (nextSlideBtn) {
    nextSlideBtn.addEventListener('click', () => {
      scrollToSlide(Math.min(sections.length - 1, currentSlideIndex + 1));
    });
  }

  // Keyboard navigation for presentation mode
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        togglePresenterMode(!isPresenterMode);
      }
    } else if (isPresenterMode) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSlide(Math.min(sections.length - 1, currentSlideIndex + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSlide(Math.max(0, currentSlideIndex - 1));
      } else if (e.key === 'Escape') {
        togglePresenterMode(false);
      }
    }
  });

  // ------------------------------------------------------------------------
  // 5. INTERACTIVE IMAGE PLACEHOLDERS (Drag & Drop + File Upload + Preview)
  // ------------------------------------------------------------------------
  const placeholders = document.querySelectorAll('.image-placeholder-box');

  placeholders.forEach((box) => {
    const fileInput = box.querySelector('.ph-file-input');
    const previewImg = box.querySelector('.ph-preview-img');
    const removeBtn = box.querySelector('.ph-remove-btn');
    const content = box.querySelector('.placeholder-content');

    function handleFile(file) {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
          }
          if (removeBtn) removeBtn.style.display = 'flex';
          if (content) content.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
        }
      });
    }

    // Drag & Drop
    box.addEventListener('dragover', (e) => {
      e.preventDefault();
      box.style.borderColor = 'var(--primary)';
      box.style.background = 'rgba(0, 245, 255, 0.08)';
    });

    box.addEventListener('dragleave', (e) => {
      e.preventDefault();
      box.style.borderColor = '';
      box.style.background = '';
    });

    box.addEventListener('drop', (e) => {
      e.preventDefault();
      box.style.borderColor = '';
      box.style.background = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    // Remove Image Reset
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (previewImg) {
          previewImg.src = '';
          previewImg.style.display = 'none';
        }
        if (removeBtn) removeBtn.style.display = 'none';
        if (content) content.style.display = 'block';
        if (fileInput) fileInput.value = '';
      });
    }
  });

  // ------------------------------------------------------------------------
  // 6. INVESTOR INQUIRY MODAL
  // ------------------------------------------------------------------------
  const contactModal = document.getElementById('contactModal');
  const openModalBtns = [
    document.getElementById('openContactModal'),
    document.getElementById('deckInvestBtn')
  ];
  const closeModalBtn = document.getElementById('closeContactModal');
  const investorForm = document.getElementById('investorForm');

  openModalBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (contactModal) contactModal.classList.add('active');
      });
    }
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      if (contactModal) contactModal.classList.remove('active');
    });
  }

  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        contactModal.classList.remove('active');
      }
    });
  }

  const investorSuccessView = document.getElementById('investorSuccessView');
  const successCloseBtn = document.getElementById('successCloseBtn');
  const successWaBtn = document.getElementById('successWaBtn');
  const investorSubmitBtn = document.getElementById('investorSubmitBtn');

  if (investorForm) {
    investorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('investorName').value.trim();
      const email = document.getElementById('investorEmail').value.trim();
      const phone = document.getElementById('investorPhone').value.trim();
      const interest = document.getElementById('investorInterest').value;

      // Loading State on Button
      if (investorSubmitBtn) {
        investorSubmitBtn.disabled = true;
        investorSubmitBtn.innerHTML = `<span>Sending Inquiry...</span>`;
      }

      // Payload for Automated Background Email Delivery to Founders
      const payload = {
        name: name,
        email: email,
        phone: phone,
        investmentInterest: interest,
        _subject: `🚀 New Investor Inquiry: ₹15L Seed Round — ${name}`,
        _template: 'table',
        _captcha: 'false'
      };

      try {
        // Send email silently in background to official founder inbox
        await fetch('https://formsubmit.co/ajax/tushargautam@zhoop.in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.log('Background email dispatched:', err);
      }

      // Update WhatsApp direct button with pre-filled investor inquiry text
      if (successWaBtn) {
        const waText = `Hi Tushar & Pushpaindu, I just submitted an investor inquiry on Zhoop Pitch Deck.\n\n*Name:* ${name}\n*Email:* ${email}\n*Phone:* ${phone}\n*Interest:* ${interest}`;
        successWaBtn.href = `https://wa.me/918169151456?text=${encodeURIComponent(waText)}`;
      }

      // Transition Form to Success View
      investorForm.style.display = 'none';
      if (investorSuccessView) {
        investorSuccessView.style.display = 'block';
      }

      // Reset button state for future
      if (investorSubmitBtn) {
        investorSubmitBtn.disabled = false;
        investorSubmitBtn.innerHTML = `<span>Submit Investor Inquiry</span>`;
      }
    });
  }

  // Handle Success View Close
  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', () => {
      if (contactModal) contactModal.classList.remove('active');
      setTimeout(() => {
        if (investorForm) {
          investorForm.reset();
          investorForm.style.display = 'block';
        }
        if (investorSuccessView) {
          investorSuccessView.style.display = 'none';
        }
      }, 300);
    });
  }

  // ------------------------------------------------------------------------
  // 7. PRINT / PDF EXPORT
  // ------------------------------------------------------------------------
  const printBtn = document.getElementById('printDeckBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});
