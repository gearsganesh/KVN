// KVN Weddings & Conventions - Supabase configuration
// Browser-safe Supabase publishable key.
// NEVER replace this with a service_role/secret key.
window.KVN_SUPABASE_URL = "https://xtdvdxpabxjryaqkcrcc.supabase.co";
window.KVN_SUPABASE_ANON_KEY = "sb_publishable_2t_AblKyPQ3fFsCxMARMiQ_56-IHCAh";

// Booking workflow compatibility layer.
// The manager page historically updated enquiries directly, which changed the
// enquiry status but did not create/release the corresponding calendar booking.
// Route those status changes through the transactional Supabase RPC instead.
(() => {
  const originalCreateClient = window.supabase?.createClient;
  if (!originalCreateClient) return;

  window.supabase.createClient = (...args) => {
    const client = originalCreateClient(...args);
    const originalFrom = client.from.bind(client);

    client.from = (table) => {
      const builder = originalFrom(table);
      if (table !== "enquiries") return builder;

      const originalUpdate = builder.update.bind(builder);
      builder.update = (values) => {
        if (!values || typeof values.status !== "string") {
          return originalUpdate(values);
        }

        const updateBuilder = originalUpdate(values);
        const originalEq = updateBuilder.eq.bind(updateBuilder);
        updateBuilder.eq = (column, value) => {
          if (column === "id") {
            return client.rpc("update_enquiry_status", {
              p_enquiry_id: value,
              p_status: values.status
            });
          }
          return originalEq(column, value);
        };
        return updateBuilder;
      };

      return builder;
    };

    return client;
  };
})();

// Keep the Admin / Manager dashboard visually consistent with the public KVN site.
// Uses the same Vanta Birds effect, colors, density and transparent background.
(() => {
  const style = document.createElement('style');
  style.textContent = `
    html, body { background: #fdf5e6 !important; }
    body { background: transparent !important; }
    #vanta-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      opacity: .85;
      overflow: hidden;
    }
    #vanta-bg canvas { display:block; pointer-events:none; }
    body::before {
      z-index: 0 !important;
    }
    .app {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') return resolve();
        existing.addEventListener('load', resolve, {once:true});
        existing.addEventListener('error', reject, {once:true});
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function initBackground() {
    if (!document.getElementById('vanta-bg')) {
      const bg = document.createElement('div');
      bg.id = 'vanta-bg';
      document.body.insertBefore(bg, document.body.firstChild);
    }

    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.birds.min.js');

      if (!window.VANTA?.BIRDS || window.KVN_VANTA) return;

      window.KVN_VANTA = window.VANTA.BIRDS({
        el: '#vanta-bg',
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        backgroundAlpha: 0,
        color1: 0xe8a52e,
        color2: 0x6b1637,
        colorMode: 'variance',
        birdSize: 1.5,
        wingSpan: 24,
        speedLimit: 3.4,
        separation: 26,
        alignment: 20,
        cohesion: 20,
        quantity: 5
      });
    } catch (e) {
      console.warn('KVN admin background failed to initialise', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackground, {once:true});
  } else {
    initBackground();
  }
})();

// Public-site positioning: KVN is not only a wedding venue. Highlight the
// highway-accessible outdoor space, corporate events and catering for smaller events.
(() => {
  const isPublicSite = location.pathname === '/' || location.pathname.endsWith('/index.html');
  if (!isPublicSite) return;

  const style = document.createElement('style');
  style.textContent = `
    .corporate-band{background:linear-gradient(135deg,rgba(61,13,33,.97),rgba(107,22,55,.95));color:#fff;overflow:hidden;border-top:1px solid rgba(232,165,46,.22);border-bottom:1px solid rgba(232,165,46,.22)}
    .corporate-inner{max-width:1240px;margin:auto;padding:100px 26px}
    .corporate-band .eyebrow{color:var(--gold-soft)}
    .corporate-band .eyebrow::before,.corporate-band .eyebrow::after{color:var(--gold)}
    .corporate-band .section-title{color:#fff}
    .corporate-band .section-title em{color:var(--gold-soft)}
    .corporate-band .section-sub{color:#eadfcf}
    .corporate-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:42px}
    .corporate-card{padding:30px 26px;border:1px solid rgba(232,165,46,.28);border-radius:14px;background:rgba(255,255,255,.055);box-shadow:0 18px 45px rgba(0,0,0,.18);transition:transform .3s,border-color .3s,background .3s}
    .corporate-card:hover{transform:translateY(-6px);border-color:var(--marigold);background:rgba(232,165,46,.09)}
    .corporate-icon{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--marigold),var(--gold));color:var(--wine-deep);font:800 1.15rem 'Manrope',sans-serif;margin-bottom:20px;box-shadow:0 8px 22px rgba(232,165,46,.24)}
    .corporate-card h3{font-size:1.55rem;color:#fff;margin-bottom:10px;font-weight:400}
    .corporate-card p{margin:0;color:#e8dccb;line-height:1.8;font-size:.94rem}
    .corporate-advantage{margin-top:28px;padding:28px 30px;border:1px solid rgba(232,165,46,.34);border-radius:14px;background:linear-gradient(90deg,rgba(232,165,46,.11),rgba(255,255,255,.035));display:grid;grid-template-columns:1.15fr .85fr;gap:24px;align-items:center}
    .corporate-advantage h3{font-size:2rem;color:#fff;margin-bottom:10px;font-weight:400}
    .corporate-advantage h3 em{color:var(--gold-soft);font-style:italic}
    .corporate-advantage p{margin:0;color:#e8dccb;line-height:1.8}
    .corporate-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .corporate-stat{padding:18px;border-radius:10px;background:rgba(0,0,0,.16);border:1px solid rgba(255,255,255,.08)}
    .corporate-stat b{display:block;color:var(--gold-soft);font:500 1.15rem 'Fraunces',Georgia,serif;margin-bottom:5px}
    .corporate-stat span{color:#dfd2c0;font-size:.78rem;line-height:1.5}
    .corporate-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:34px}
    .corporate-actions .btn.wine{background:linear-gradient(135deg,var(--marigold),var(--gold));color:var(--wine-deep);box-shadow:0 14px 32px rgba(232,165,46,.32)}
    .corporate-actions .btn.wine:hover{box-shadow:0 20px 40px rgba(232,165,46,.45)}
    @media(max-width:960px){.corporate-grid{grid-template-columns:1fr 1fr}.corporate-advantage{grid-template-columns:1fr}}
    @media(max-width:700px){.corporate-grid{grid-template-columns:1fr}.corporate-inner{padding:64px 16px}.corporate-advantage{padding:24px 20px}.corporate-advantage h3{font-size:1.7rem}.corporate-stats{grid-template-columns:1fr}.corporate-actions{margin-top:26px}}
  `;
  document.head.appendChild(style);

  function addCorporatePositioning() {
    if (document.getElementById('corporate')) return;

    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      const galleryLink = Array.from(navLinks.querySelectorAll('a')).find(a => a.getAttribute('href') === '#gallery');
      const link = document.createElement('a');
      link.href = '#corporate';
      link.textContent = 'Corporate & Outdoor';
      if (galleryLink) navLinks.insertBefore(link, galleryLink); else navLinks.appendChild(link);
    }

    const kicker = document.querySelector('.hero .kicker');
    if (kicker) kicker.textContent = 'Weddings · Receptions · Corporate · Outdoor Events';
    const heroText = document.querySelector('.hero p');
    if (heroText) heroText.textContent = 'A distinctive venue in Velappanchavadi, Chennai, for weddings, corporate gatherings, outdoor events and celebrations, with the rare advantage of expansive outdoor event space right beside the highway.';
    const heroNote = document.querySelector('.hero-note');
    if (heroNote) heroNote.textContent = 'Weddings · Corporate Events · Outdoor Displays · Expos · Catering up to 200';

    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    const section = document.createElement('section');
    section.className = 'corporate-band';
    section.id = 'corporate';
    section.innerHTML = `
      <div class="corporate-inner">
        <div class="eyebrow" data-reveal>Beyond Weddings</div>
        <h2 class="section-title" data-reveal data-reveal-delay="1">A Venue for <em>Business, Brands & Outdoor Events</em></h2>
        <p class="section-sub" data-reveal data-reveal-delay="2">KVN is more than a wedding venue. Our highway-accessible location and expansive outdoor floor space open up possibilities that are difficult to find in the city.</p>
        <div class="corporate-grid">
          <article class="corporate-card" data-reveal><div class="corporate-icon">01</div><h3>Corporate Events</h3><p>Team gatherings, annual meets, conferences, seminars, dealer meets, employee celebrations and formal corporate functions in a polished setting.</p></article>
          <article class="corporate-card" data-reveal data-reveal-delay="1"><div class="corporate-icon">02</div><h3>Outdoor Displays & Expos</h3><p>Use our outdoor floor space for exhibitions, product showcases, trade displays, public-facing activations and event setups that need room to breathe.</p></article>
          <article class="corporate-card" data-reveal data-reveal-delay="2"><div class="corporate-icon">03</div><h3>Car & Truck Displays</h3><p>A practical venue for automobile launches, commercial vehicle displays, fleet showcases, roadshows and brand experiences where vehicle access matters.</p></article>
        </div>
        <div class="corporate-advantage" data-reveal>
          <div><h3>The <em>space advantage</em> Chennai rarely offers.</h3><p>Set beside a major highway, KVN combines easy access with expansive outdoor floor space. Vehicles, exhibition structures, display zones and guest movement can be planned together instead of forcing everything indoors.</p></div>
          <div class="corporate-stats">
            <div class="corporate-stat"><b>Highway Access</b><span>Convenient arrival for guests, exhibitors and commercial vehicles.</span></div>
            <div class="corporate-stat"><b>Outdoor Floor Space</b><span>Flexible open-air area for displays, expos and event installations.</span></div>
            <div class="corporate-stat"><b>Up to 200 Catering</b><span>Catering support for smaller corporate and private events up to 200 guests.</span></div>
            <div class="corporate-stat"><b>Indoor + Outdoor</b><span>Pair an indoor function with an outdoor activation or display.</span></div>
          </div>
        </div>
        <div class="corporate-actions" data-reveal><a class="btn wine" href="#availability">Plan a Corporate Event</a><a class="btn" href="#contact">Talk to KVN</a></div>
      </div>`;
    gallery.parentNode.insertBefore(section, gallery);

    const eventType = document.getElementById('eventType');
    if (eventType) {
      const extra = [
        ['Corporate Event','Corporate Event'],
        ['Conference / Seminar','Conference / Seminar'],
        ['Product Launch','Product Launch'],
        ['Expo / Exhibition','Expo / Exhibition'],
        ['Car / Truck Display','Car / Truck Display'],
        ['Outdoor Event','Outdoor Event']
      ];
      extra.forEach(([value,label]) => {
        if (![...eventType.options].some(o => o.value === value)) eventType.add(new Option(label,value));
      });
    }

    const contactLine = document.querySelector('#contact p');
    if (contactLine) contactLine.textContent = 'Velappanchavadi, Chennai · Weddings · Receptions · Corporate Events · Outdoor Events · Expos · Vehicle Displays · Catering up to 200';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addCorporatePositioning, {once:true});
  else addCorporatePositioning();
})();
