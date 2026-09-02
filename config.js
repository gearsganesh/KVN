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
