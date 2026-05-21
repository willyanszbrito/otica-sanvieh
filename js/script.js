document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);
    setDynamicTitle('A Visão Perfeita'); // SEO inicial
    initA11y();
    loadDatabase();
});

// Global state
let dbData = null;
let triageState = {
    age: null,
    condition: null,
    lead: {
        name: '',
        whatsapp: ''
    }
};

// ==========================================
// SEO & Utils
// ==========================================
function setDynamicTitle(pageName) {
    document.title = `Sanviêh | ${pageName}`;
}

function pushToDataLayer(eventName, payload = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: eventName,
        ...payload
    });
}

// ==========================================
// Accessibility (Font Resizer)
// ==========================================
function initA11y() {
    const btnInc = document.getElementById('btn-increase-font');
    const btnDec = document.getElementById('btn-decrease-font');
    const root = document.documentElement;
    
    // Ler preferência salva
    let savedSize = localStorage.getItem('fontSize');
    let currentSize = savedSize ? parseInt(savedSize) : 16;
    
    if (savedSize) {
        root.style.fontSize = `${currentSize}px`;
    }

    if(btnInc && btnDec) {
        btnInc.addEventListener('click', () => {
            if (currentSize < 24) {
                currentSize += 2;
                root.style.fontSize = `${currentSize}px`;
                localStorage.setItem('fontSize', currentSize);
                ScrollTrigger.refresh(); // Refresh ScrollTrigger to adjust new heights
            }
        });

        btnDec.addEventListener('click', () => {
            if (currentSize > 14) {
                currentSize -= 2;
                root.style.fontSize = `${currentSize}px`;
                localStorage.setItem('fontSize', currentSize);
                ScrollTrigger.refresh(); // Refresh ScrollTrigger to adjust new heights
            }
        });
    }
}

// ==========================================
// Fetch JSON (Mocking a DB call)
// ==========================================
async function loadDatabase() {
    try {
        const response = await fetch('js/db.json');
        if (!response.ok) throw new Error('Falha ao carregar os dados');
        
        dbData = await response.json();
        
        // Populate Hero text
        document.getElementById('hero-title').innerHTML = dbData.hero.title;
        document.getElementById('hero-subtitle').innerHTML = dbData.hero.subtitle;
        
        // Render Services
        renderServices();

        // Initial setup for Triage Card
        renderTriageStep1();
        pushToDataLayer('view_landing_page');

        // Init GSAP animations after DOM is ready
        setTimeout(() => {
            initAnimations();
            ScrollTrigger.refresh(); // Force recalculation
        }, 100);

    } catch (error) {
        console.error(error);
        const cardContent = document.getElementById('triage-card-content');
        if(cardContent) cardContent.innerHTML = '<h2 class="text-white">Erro ao carregar os dados.</h2>';
    }
}

// ==========================================
// GSAP Animations
// ==========================================
function initAnimations() {
    // 1. Parallax no Hero Background
    gsap.to("#hero-bg", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
            trigger: "main",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // Header Reveal
    gsap.from(".gsap-header", {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

    // Hero Text Reveal
    gsap.from(".gsap-hero-text", {
        y: 50,
        opacity: 0,
        duration: 1.2,
        delay: 0.2,
        ease: "power3.out"
    });

    // Hero Card Reveal
    gsap.from(".gsap-hero-card", {
        y: 50,
        opacity: 0,
        duration: 1.2,
        delay: 0.4,
        ease: "power3.out"
    });

    // 2. Services Grid Stagger Reveal
    gsap.from(".gsap-service-item", {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#servicos",
            start: "top 80%", 
        }
    });

    // Section Title
    gsap.from(".gsap-section-title", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
            trigger: "#servicos",
            start: "top 85%"
        }
    });

    // Maison Section Reveal
    gsap.from(".gsap-maison-text", {
        x: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
            trigger: "#maison",
            start: "top 80%"
        }
    });

    gsap.from(".gsap-maison-map", {
        x: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
            trigger: "#maison",
            start: "top 80%"
        }
    });
}

// Render Services Grid
function renderServices() {
    const grid = document.getElementById('services-grid');
    if(!grid || !dbData.services) return;
    
    let html = '';
    dbData.services.forEach((service) => {
        html += `
        <div class="gsap-service-item bg-coffeeDark border border-nude/10 rounded-2xl p-8 hover:border-terracotta/50 transition-all duration-300 group">
            <div class="w-14 h-14 bg-terracotta/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-terracotta/20 transition-all duration-500">
                <svg class="w-8 h-8 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${service.icon}"></path>
                </svg>
            </div>
            <h3 class="font-serif text-xl text-nude font-semibold mb-3">${service.title}</h3>
            <p class="text-nude/70 text-sm font-light leading-relaxed">${service.description}</p>
        </div>
        `;
    });
    grid.innerHTML = html;
}

// ==========================================
// GSAP Transition Helper for Glassmorphism
// ==========================================
function transitionCard(renderFunc) {
    const cardContent = document.getElementById('triage-card-content');
    const cardWrapper = document.getElementById('triage-card');
    
    gsap.to(cardContent, {
        y: -20,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            renderFunc();
            
            gsap.set(cardContent, { y: 20, opacity: 0 });
            
            // Calculando a nova altura de forma mais segura
            const newHeight = cardContent.scrollHeight + 80; 
            
            gsap.to(cardWrapper, {
                height: newHeight,
                duration: 0.4,
                ease: "power2.inOut",
                onComplete: () => {
                    // Libera a altura para auto para nunca cortar (vazar) conteúdo, independente do tamanho
                    gsap.set(cardWrapper, { height: "auto" }); 
                    ScrollTrigger.refresh();

                    gsap.to(cardContent, {
                        y: 0,
                        opacity: 1,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                }
            });
        }
    });
}

// ==========================================
// Triage System
// ==========================================
function renderTriageStep1() {
    const cardContent = document.getElementById('triage-card-content');
    const stepData = dbData.triage.step1;

    let optionsHtml = stepData.options.map((opt) => `
        <button class="w-full text-left px-6 py-4 rounded-xl border border-terracotta/30 hover:bg-terracotta/10 hover:border-terracotta/60 hover:shadow-[0_0_15px_rgba(194,139,123,0.2)] text-nude transition-all duration-300 mb-4 font-medium backdrop-blur-sm shadow-sm" 
            onclick="handleStep1('${opt.value}')" aria-label="${opt.label}">
            ${opt.label}
        </button>
    `).join('');

    cardContent.innerHTML = `
        <h2 class="font-serif text-2xl md:text-3xl font-medium text-heroText mb-8 leading-tight tracking-wide">
            ${stepData.question}
        </h2>
        ${optionsHtml}
    `;
}

function handleStep1(value) {
    triageState.age = value;
    pushToDataLayer('step_age', { age: value });
    transitionCard(renderTriageStep2);
}

function renderTriageStep2() {
    const cardContent = document.getElementById('triage-card-content');
    const stepData = dbData.triage.step2;

    let optionsHtml = stepData.options.map((opt) => `
        <button class="w-full text-left px-6 py-4 rounded-xl border border-terracotta/30 hover:bg-terracotta/10 hover:border-terracotta/60 hover:shadow-[0_0_15px_rgba(194,139,123,0.2)] text-nude transition-all duration-300 mb-4 font-medium backdrop-blur-sm shadow-sm" 
            onclick="handleStep2('${opt.value}')" aria-label="${opt.label}">
            ${opt.label}
        </button>
    `).join('');

    cardContent.innerHTML = `
        <h2 class="font-serif text-xl md:text-2xl font-medium text-heroText mb-8 leading-relaxed tracking-wide">
            ${stepData.question}
        </h2>
        ${optionsHtml}
    `;
}

function handleStep2(value) {
    triageState.condition = value;
    pushToDataLayer('step_condition', { condition: value });
    transitionCard(renderLeadForm);
}

// ==========================================
// Lead Capture Form
// ==========================================
function renderLeadForm() {
    const cardContent = document.getElementById('triage-card-content');
    const stepData = dbData.triage.step3;

    cardContent.innerHTML = `
        <h2 class="font-serif text-3xl font-medium text-heroText mb-2 tracking-wide">${stepData.title}</h2>
        <p class="text-nude/70 text-sm mb-8 font-light">${stepData.subtitle}</p>
        
        <form id="lead-form" onsubmit="handleLeadSubmit(event)" class="pb-2">
            <div class="mb-5 relative group">
                <label for="lead-name" class="block text-sm font-medium text-nude/90 mb-2">Nome Completo</label>
                <input type="text" id="lead-name" placeholder="Ex: Maria Silva" required aria-required="true"
                    class="w-full bg-coffeeDark/60 border border-terracotta/30 rounded-xl px-4 py-3 text-nude placeholder-nude/40 focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all backdrop-blur-sm">
            </div>
            
            <div class="mb-5 relative group">
                <label for="lead-whatsapp" class="block text-sm font-medium text-nude/90 mb-2">WhatsApp</label>
                <input type="tel" id="lead-whatsapp" placeholder="(11) 99999-9999" required aria-required="true" maxlength="15"
                    class="w-full bg-coffeeDark/60 border border-terracotta/30 rounded-xl px-4 py-3 text-nude placeholder-nude/40 focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all backdrop-blur-sm">
                <span id="whatsapp-error" class="text-red-400 text-xs mt-2 hidden">Digite um número de WhatsApp válido.</span>
            </div>
            
            <div class="flex items-start gap-3 mt-4 mb-6 group">
                <input type="checkbox" id="lead-lgpd" required aria-required="true" 
                    class="mt-1 w-4 h-4 accent-terracotta rounded border-terracotta/30 bg-transparent cursor-pointer transition-transform group-hover:scale-110">
                <label for="lead-lgpd" class="text-xs text-nude/70 font-light leading-relaxed cursor-pointer transition-colors group-hover:text-nude">
                    Concordo com a <a href="politica-privacidade.html" target="_blank" class="text-terracotta hover:underline">Política de Privacidade</a> e autorizo o contato via WhatsApp.
                </label>
            </div>
            
            <button type="submit" 
                class="w-full px-6 py-4 rounded-xl bg-terracotta hover:bg-terracottaDark text-white font-semibold tracking-wide transition-all duration-500 shadow-[0_4px_20px_rgba(194,139,123,0.3)] hover:shadow-[0_6px_25px_rgba(194,139,123,0.5)] transform hover:-translate-y-1">
                Descobrir Minha Lente Ideal
            </button>
        </form>
    `;

    const inputTel = document.getElementById('lead-whatsapp');
    inputTel.addEventListener('input', applyWhatsappMask);
}

function applyWhatsappMask(e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    }
    if (value.length > 9) {
        value = `${value.substring(0, 10)}-${value.substring(10)}`;
    }
    e.target.value = value;
}

function isValidWhatsApp(phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length === 11 && cleanPhone[2] === '9';
}

async function handleLeadSubmit(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('lead-name').value;
    const whatsInput = document.getElementById('lead-whatsapp').value;
    const errorSpan = document.getElementById('whatsapp-error');

    if (!isValidWhatsApp(whatsInput)) {
        errorSpan.classList.remove('hidden');
        errorSpan.classList.add('block');
        
        // Shake animation for error
        gsap.fromTo(document.getElementById('lead-whatsapp'), 
            { x: -5 }, 
            { x: 5, duration: 0.1, yoyo: true, repeat: 3, onComplete: () => gsap.set(document.getElementById('lead-whatsapp'), {x: 0}) }
        );
        
        document.getElementById('lead-whatsapp').focus();
        return;
    }
    
    errorSpan.classList.remove('block');
    errorSpan.classList.add('hidden');

    triageState.lead.name = nameInput;
    triageState.lead.whatsapp = whatsInput;

    localStorage.setItem('sanvieh_lead', JSON.stringify(triageState.lead));
    pushToDataLayer('submit_lead_form');

    const btnSubmit = event.target.querySelector('button[type="submit"]');
    btnSubmit.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    btnSubmit.disabled = true;

    try {
        await fetch('https://api.adminic.com.br/webhook/otica-sanvieh-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(triageState)
        });
    } catch (e) {
        console.log('Webhook simulado falhou ou bloqueado por CORS. Continuando o fluxo...', e);
    }

    transitionCard(renderResult);
}

// ==========================================
// Decision & Result
// ==========================================
function renderResult() {
    const cardContent = document.getElementById('triage-card-content');
    const { age, condition, lead } = triageState;

    const requiresVisit = (age === 'over_40' || condition === 'yes');
    const resultData = requiresVisit ? dbData.triage.results.store_visit : dbData.triage.results.online_catalog;

    let ctaHtml = '';
    
    if (requiresVisit) {
        const msg = `Olá, sou ${lead.name}, fiz a triagem no site. ${age === 'over_40' ? 'Tenho mais de 40 anos' : 'Tenho uma condição visual'} e preciso agendar minha medição de pupila presencial na Maison.`;
        const encodedMsg = encodeURIComponent(msg);
        const waLink = `${dbData.site_info.whatsapp_base_url || 'https://wa.me/'}${dbData.site_info.whatsapp_number}?text=${encodedMsg}`;
        
        ctaHtml = `<a href="${waLink}" target="_blank" onclick="pushToDataLayer('redirect_whatsapp')" class="inline-block w-full text-center px-6 py-4 rounded-xl bg-terracotta hover:bg-terracottaDark text-white font-semibold transition-all duration-500 shadow-[0_4px_20px_rgba(194,139,123,0.3)] hover:shadow-[0_6px_25px_rgba(194,139,123,0.5)] transform hover:-translate-y-1">${resultData.cta_text}</a>`;
    } else {
        ctaHtml = `<a href="${resultData.link}" class="inline-block w-full text-center px-6 py-4 rounded-xl bg-terracotta hover:bg-terracottaDark text-white font-semibold transition-all duration-500 shadow-[0_4px_20px_rgba(194,139,123,0.3)] hover:shadow-[0_6px_25px_rgba(194,139,123,0.5)] transform hover:-translate-y-1">${resultData.cta_text}</a>`;
    }

    cardContent.innerHTML = `
        <div class="text-center">
            <div class="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-terracotta/20 text-terracotta">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 class="font-serif text-3xl font-medium text-heroText mb-4 tracking-wide">Triagem Concluída</h2>
            <p class="text-nude/80 font-light mb-8 leading-relaxed">${resultData.message}</p>
            ${ctaHtml}
        </div>
    `;
}
