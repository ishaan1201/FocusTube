import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const TOPICS = [
  { icon: "🧠", name: "AI", key: "AI" },
  { icon: "📈", name: "Trading", key: "Trading" },
  { icon: "💻", name: "Coding", key: "Coding" },
  { icon: "🎨", name: "Design", key: "Design" },
  { icon: "🧘", name: "Psychology", key: "Psychology" },
  { icon: "⚡", name: "Productivity", key: "Productivity" },
  { icon: "💰", name: "Finance", key: "Finance" },
  { icon: "🎬", name: "Filmmaking", key: "Filmmaking" },
  { icon: "🚀", name: "Startups", key: "Entrepreneurship" },
  { icon: "🌌", name: "Space", key: "Space" },
  { icon: "🔮", name: "Philosophy", key: "Philosophy" },
  { icon: "🎵", name: "Music", key: "Music" },
];

const FEATURES = [
  { color: "#8b5cf6", title: "Smart Topic Feed", desc: "Only videos from your chosen interests. Every. Single. Time. Zero noise guaranteed." },
  { color: "#06b6d4", title: "Daily Curated Drops", desc: "Wake up to fresh, hand-picked content in your topics. Like a morning briefing for your brain." },
  { color: "#10b981", title: "Zero Algorithm Chaos", desc: "No random rabbit holes. No regret scrolls. Just the content you chose to care about." },
  { color: "#f59e0b", title: "Deep Learning Mode", desc: "Watch a topic like a Netflix series. Sequential, progressive, and deeply satisfying." },
  { color: "#ec4899", title: "Curiosity Graph", desc: "Discover related topics naturally. Let one curiosity bloom into many without the chaos." },
  { color: "#6366f1", title: "Your Learning Identity", desc: "Curio builds a profile around your intellectual curiosity — not your clickbait history.", wide: true },
];

export default function LandingPage() {
  const [selected, setSelected] = useState(new Set());
  const [navScrolled, setNavScrolled] = useState(false);
  const particleCanvasRef = useRef(null);
  const dotsCanvasRef = useRef(null);

  // Navbar scroll
  useEffect(() => {
    let lastY = window.scrollY;
    const nav = document.getElementById("curio-nav");
    const handler = () => {
      const y = window.scrollY;
      setNavScrolled(y > 40);
      if (nav) nav.style.transform = (y > lastY + 4 && y > 80) ? "translateY(-100%)" : "translateY(0)";
      lastY = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".c-reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("c-visible"), i * 80);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, particles = [], animId;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    class P {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * W; this.y = init ? Math.random() * H : H + 10;
        this.r = Math.random() * 1.5 + 0.3; this.sp = Math.random() * 0.4 + 0.1;
        this.op = Math.random() * 0.6 + 0.1; this.dx = (Math.random() - 0.5) * 0.3;
        this.hue = [260, 190, 330][Math.floor(Math.random() * 3)];
      }
      update() { this.y -= this.sp; this.x += this.dx; if (this.y < -10 || this.x < -20 || this.x > W + 20) this.reset(); }
      draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fillStyle = `hsla(${this.hue},80%,70%,${this.op})`; ctx.fill(); }
    }
    resize();
    particles = Array.from({ length: 90 }, () => new P());
    const loop = () => { ctx.clearRect(0, 0, W, H); particles.forEach(p => { p.update(); p.draw(); }); animId = requestAnimationFrame(loop); };
    loop();
    const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  // Dots canvas
  useEffect(() => {
    const canvas = dotsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, mouse = { x: -9999, y: -9999 };
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; draw(); };
    const draw = () => {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      const gap = 32;
      for (let r = 0; r <= Math.ceil(H / gap); r++) for (let c = 0; c <= Math.ceil(W / gap); c++) {
        const x = c * gap, y = r * gap;
        const d = Math.hypot(x - mouse.x, y - mouse.y), maxD = 120;
        const glow = d < maxD ? 1 - d / maxD : 0;
        ctx.beginPath(); ctx.arc(x, y, 1.2 + glow * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${260 + glow * 60},80%,70%,${0.18 + glow * 0.55})`; ctx.fill();
      }
    };
    const sec = canvas.closest("section");
    const mm = (e) => { const r = canvas.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; draw(); };
    const ml = () => { mouse = { x: -9999, y: -9999 }; draw(); };
    sec?.addEventListener("mousemove", mm); sec?.addEventListener("mouseleave", ml);
    const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement);
    setTimeout(resize, 100);
    return () => { sec?.removeEventListener("mousemove", mm); sec?.removeEventListener("mouseleave", ml); ro.disconnect(); };
  }, []);

  // Feed cycling
  useEffect(() => {
    const items = document.querySelectorAll(".feed-item");
    if (!items.length) return;
    let cur = 0;
    const id = setInterval(() => {
      items[cur].classList.remove("active");
      cur = (cur + 1) % items.length;
      items[cur].classList.add("active");
    }, 2800);
    return () => clearInterval(id);
  }, []);

  // Counter animation
  useEffect(() => {
    const stats = document.querySelectorAll(".stat-num");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target; const raw = el.textContent.trim();
        if (raw === "∞" || raw === "0") { obs.unobserve(el); return; }
        const num = parseFloat(raw.replace("%", "")); if (isNaN(num)) { obs.unobserve(el); return; }
        const isPct = raw.includes("%"); let start = 0;
        const step = ts => { if (!start) start = ts; const p = Math.min((ts - start) / 1400, 1); const e2 = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(e2 * num) + (isPct ? "%" : ""); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step); obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const toggleTopic = (key) => {
    setSelected(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  };

  return (
    <div style={{ background: "#060812", color: "#f0f0f6", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500;600;700;800&display=swap');
        .c-logo-dot{width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#06b6d4);box-shadow:0 0 12px rgba(139,92,246,.8);animation:cpulse 2s ease-in-out infinite;display:inline-block}
        @keyframes cpulse{0%,100%{box-shadow:0 0 8px rgba(139,92,246,.6)}50%{box-shadow:0 0 20px rgba(139,92,246,1),0 0 40px rgba(6,182,212,.4)}}
        .c-badge-dot{width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px rgba(16,185,129,.8);animation:cblink 2s ease-in-out infinite;display:inline-block}
        @keyframes cblink{0%,100%{opacity:1}50%{opacity:.4}}
        .c-reveal{opacity:0;transform:translateY(30px);transition:opacity .7s ease,transform .7s ease}
        .c-visible{opacity:1;transform:translateY(0)}
        .c-grad-text{background:linear-gradient(135deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .c-grad-text-2{background:linear-gradient(135deg,#ec4899,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .c-red-grad{background:linear-gradient(135deg,#f43f5e,#fb923c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .c-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;font-size:15px;font-weight:600;border-radius:100px;text-decoration:none;transition:all .3s;position:relative;overflow:hidden;cursor:pointer;border:none}
        .c-btn:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(139,92,246,.35)}
        .c-glow{box-shadow:0 0 20px rgba(139,92,246,.3),0 0 40px rgba(6,182,212,.15)}
        .c-btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;color:rgba(240,240,246,.6);font-size:15px;font-weight:500;border-radius:100px;text-decoration:none;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);transition:all .3s}
        .c-btn-ghost:hover{color:#f0f0f6;border-color:rgba(255,255,255,.2);transform:translateY(-2px)}
        .c-glass{background:rgba(255,255,255,.04);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.08);border-radius:24px}
        .topic-card-c{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;cursor:pointer;transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease,background .25s ease;overflow:hidden;user-select:none}
        .topic-card-c:hover{transform:translateY(-4px) scale(1.04);border-color:rgba(139,92,246,.4);background:rgba(139,92,246,.07);box-shadow:0 8px 24px rgba(139,92,246,.2)}
        .topic-card-c.tselected{border-color:rgba(139,92,246,.6);background:rgba(139,92,246,.12);box-shadow:0 0 24px rgba(139,92,246,.25)}
        .topic-card-c.tselected::after{content:'✓';position:absolute;top:8px;right:10px;font-size:10px;color:#a78bfa;font-weight:700}
        .feed-item{display:flex;gap:12px;align-items:flex-start;padding:10px;border-radius:12px;transition:all .3s;cursor:pointer}
        .feed-item.active{background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.15)}
        .prob-item{display:flex;gap:14px;align-items:flex-start;padding:16px;background:rgba(248,113,113,.04);border:1px solid rgba(248,113,113,.1);border-radius:16px;transition:all .3s}
        .prob-item:hover{border-color:rgba(248,113,113,.2);background:rgba(248,113,113,.07)}
        .feat-card{padding:28px;display:flex;flex-direction:column;gap:12px;transition:all .3s;cursor:default}
        .feat-card:hover{transform:translateY(-4px)}
        .pill-c{position:absolute;background:rgba(255,255,255,.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.09);border-radius:100px;padding:8px 16px;font-size:13px;font-weight:500;color:rgba(240,240,246,.6);white-space:nowrap;animation:pfloat linear infinite}
        @keyframes pfloat{0%{transform:translateY(0) rotate(0deg);opacity:.6}25%{transform:translateY(-14px) rotate(1deg);opacity:.9}50%{transform:translateY(-6px) rotate(-1deg);opacity:.7}75%{transform:translateY(-18px) rotate(.5deg);opacity:.85}100%{transform:translateY(0) rotate(0deg);opacity:.6}}
        .orb-c{position:absolute;border-radius:50%;filter:blur(80px);opacity:.35;pointer-events:none}
        @keyframes odrift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,40px) scale(1.1)}}
        @keyframes odrift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-50px,60px) scale(1.05)}}
        @keyframes odrift3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-50px) scale(1.08)}}
        .scroll-arrow-c{width:24px;height:24px;border-right:2px solid rgba(240,240,246,.35);border-bottom:2px solid rgba(240,240,246,.35);transform:rotate(45deg);margin:0 auto;animation:sarrow 2s ease-in-out infinite}
        @keyframes sarrow{0%,100%{transform:rotate(45deg) translateY(0);opacity:.6}50%{transform:rotate(45deg) translateY(5px);opacity:1}}
        .pricing-card-c{padding:32px;display:flex;flex-direction:column;gap:16px;transition:all .3s}
        .pricing-card-c:hover{transform:translateY(-4px)}
        .pricing-feat-c{border:2px solid rgba(139,92,246,.3);box-shadow:0 0 40px rgba(139,92,246,.15)}
        .plan-btn{display:block;text-align:center;padding:12px;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;border:1px solid rgba(255,255,255,.12);color:rgba(240,240,246,.8);background:rgba(255,255,255,.05);transition:all .3s}
        .plan-btn:hover{background:rgba(255,255,255,.1);color:#f0f0f6}
        .plan-btn-feat{background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;border:none;box-shadow:0 0 20px rgba(139,92,246,.3)}
        .plan-btn-feat:hover{box-shadow:0 0 30px rgba(139,92,246,.5);transform:translateY(-1px)}
        .ui-nav-item{display:block;padding:8px 12px;border-radius:8px;font-size:12px;color:rgba(240,240,246,.5);text-decoration:none;transition:.2s}
        .ui-nav-item.active,.ui-nav-item:hover{background:rgba(139,92,246,.15);color:rgba(240,240,246,.9)}
        .section-lbl{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;border:1px solid rgba(139,92,246,.25);background:rgba(139,92,246,.08);padding:6px 14px;border-radius:100px;margin-bottom:20px}
        .section-lbl.bad{color:#f87171;border-color:rgba(248,113,113,.25);background:rgba(248,113,113,.08)}
        .section-lbl.good{color:#10b981;border-color:rgba(16,185,129,.25);background:rgba(16,185,129,.08)}
        .stat-num{display:block;font-family:'Syne',sans-serif;font-size:36px;font-weight:800;background:linear-gradient(135deg,#10b981,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .tagline-c{font-size:18px;font-weight:600;font-style:italic;color:rgba(240,240,246,.6);padding:14px 20px;background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.12);border-left:3px solid #10b981;border-radius:0 10px 10px 0;transition:all .3s}
        .tagline-c:hover{color:#f0f0f6;background:rgba(16,185,129,.08)}
        .hook-quote{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,52px);font-weight:800;line-height:1.15;margin-bottom:24px;background:linear-gradient(135deg,#8b5cf6,#06b6d4,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        @media(max-width:768px){.hero-grid{grid-template-columns:1fr!important}.prob-grid{grid-template-columns:1fr!important}.feat-grid{grid-template-columns:1fr!important}.price-grid{grid-template-columns:1fr!important}.hero-preview-box{display:none}}
      `}</style>

      {/* ── NAVBAR ── */}
      <nav id="curio-nav" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: navScrolled ? "14px 0" : "18px 0", transition: "all .4s", background: navScrolled ? "rgba(6,8,18,.85)" : "transparent", backdropFilter: navScrolled ? "blur(20px)" : "none", borderBottom: navScrolled ? "1px solid rgba(255,255,255,.08)" : "none" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 40 }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#f0f0f6", textDecoration: "none", flexShrink: 0 }}>
            <span className="c-logo-dot" /> Curio
          </a>
          <div style={{ display: "flex", gap: 32, flex: 1 }}>
            {["#topics", "#features", "#pricing"].map((h, i) => (
              <a key={i} href={h} style={{ color: "rgba(240,240,246,.6)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color .3s" }}
                onMouseEnter={e => e.target.style.color = "#f0f0f6"} onMouseLeave={e => e.target.style.color = "rgba(240,240,246,.6)"}>
                {["Topics", "Features", "Pricing"][i]}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginLeft: "auto" }}>
            <Link to="/classroom" className="c-btn c-glow" style={{ padding: "10px 20px", fontSize: 14 }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div className="orb-c" style={{ width: 600, height: 600, background: "radial-gradient(circle,#8b5cf6,transparent 70%)", top: -150, left: -150, animation: "odrift1 12s ease-in-out infinite" }} />
          <div className="orb-c" style={{ width: 500, height: 500, background: "radial-gradient(circle,#06b6d4,transparent 70%)", top: "30%", right: -100, animation: "odrift2 15s ease-in-out infinite" }} />
          <div className="orb-c" style={{ width: 400, height: 400, background: "radial-gradient(circle,#ec4899,transparent 70%)", bottom: 0, left: "40%", animation: "odrift3 18s ease-in-out infinite" }} />
          <canvas ref={particleCanvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4 }} />
          {/* floating pills */}
          {[["🧠 AI","15%","5%","20s","0s"],["📈 Trading","25%",null,"23s","-5s",true],["💻 Coding","55%","3%","18s","-8s"],["🎬 Filmmaking","70%",null,"25s","-3s",true],["🧘 Psychology","40%","7%","22s","-12s"],["⚡ Productivity","82%","15%","19s","-7s"],["💰 Finance","12%",null,"24s","-2s",true],["🎨 Design","88%",null,"21s","-9s",true],["🚀 Startups","60%",null,"26s","-14s",true]].map(([txt,top,left,dur,del,right],i)=>(
            <div key={i} className="pill-c" style={{top,left:left||undefined,right:right?"5%":undefined,animationDuration:dur,animationDelay:del}}>{txt}</div>
          ))}
        </div>

        <div className="hero-grid" style={{ position: "relative", zIndex: 2, maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 60, padding: "140px 80px 80px", minHeight: "100vh" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "rgba(240,240,246,.7)", border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", padding: "7px 14px", borderRadius: 100, marginBottom: 28 }}>
              <span className="c-badge-dot" /> Introducing Curio — The Future of Focused Learning
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(42px,6vw,76px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 24 }}>
              The internet,<br />
              <span className="c-grad-text">organized by<br />your curiosity.</span>
            </h1>
            <p style={{ fontSize: 18, color: "rgba(240,240,246,.6)", lineHeight: 1.7, marginBottom: 36 }}>
              Curio lets you choose the topics you love —<br />
              and builds a perfectly curated video world around them.
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 40 }}>
              <Link to="/classroom" className="c-btn c-glow">
                <span>Build My Feed</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <a href="#topics" className="c-btn-ghost"><span>Explore Topics</span></a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex" }}>
                {[1,2,3,4].map(n => <img key={n} src={`https://i.pravatar.cc/32?img=${n}`} alt="User" style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #060812", marginLeft: n===1?0:-8, objectFit: "cover" }} />)}
              </div>
              <p style={{ fontSize: 13, color: "rgba(240,240,246,.6)", margin: 0 }}>Join <strong style={{ color: "#f0f0f6" }}>12,000+</strong> curious minds already on the waitlist</p>
            </div>
          </div>

          <div className="hero-preview-box" style={{ position: "relative", zIndex: 2 }}>
            <div className="c-glass" style={{ padding: 20, maxWidth: 380, margin: "0 auto", borderColor: "rgba(139,92,246,.2)", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700 }}><span className="c-logo-dot" style={{ width: 7, height: 7 }} /> Curio</div>
                <div style={{ fontSize: 11, color: "#a78bfa", background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.2)", padding: "3px 10px", borderRadius: 100 }}>Your Feed</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["🧠","ai","AI","How GPT-4o Changes Everything About Search","14 min · Andrej Karpathy",true],["💻","code","Coding","Build a SaaS in 48 Hours with Next.js 14","32 min · Theo Browne",false],["🎨","design","Design","Why Figma's New Variables Will Replace CSS","21 min · Design Code",false]].map(([icon,type,tag,title,meta,active])=>(
                  <div key={tag} className={`feed-item${active?" active":""}`}>
                    <div style={{ width:52,height:52,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,background:type==="ai"?"linear-gradient(135deg,rgba(139,92,246,.3),rgba(6,182,212,.3))":type==="code"?"linear-gradient(135deg,rgba(16,185,129,.3),rgba(6,182,212,.3))":"linear-gradient(135deg,rgba(236,72,153,.3),rgba(245,158,11,.3))"}}>{icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <span style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#a78bfa",marginBottom:4,display:"block" }}>{tag}</span>
                      <p style={{ fontSize:13,fontWeight:500,color:"#f0f0f6",lineHeight:1.4,marginBottom:4 }}>{title}</p>
                      <span style={{ fontSize:11,color:"rgba(240,240,246,.35)" }}>{meta}</span>
                    </div>
                  </div>
                ))}
                <div style={{ paddingTop:8,borderTop:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ flex:1,height:3,background:"rgba(255,255,255,.08)",borderRadius:2 }}><div style={{ height:"100%",width:"25%",background:"linear-gradient(135deg,#8b5cf6,#06b6d4)",borderRadius:2 }} /></div>
                  <span style={{ fontSize:11,color:"rgba(240,240,246,.35)",whiteSpace:"nowrap" }}>3 of 12 today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}><div className="scroll-arrow-c" /></div>
      </section>

      {/* ── TOPICS ── */}
      <section id="topics" style={{ padding: "120px 0", textAlign: "center" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div className="section-lbl">Pick Your Interests</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,5vw,58px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>Your topics.<br /><span className="c-grad-text">Your world.</span></h2>
          <p style={{ fontSize: 18, color: "rgba(240,240,246,.6)", lineHeight: 1.7, marginBottom: 48 }}>Choose your interests once.<br />Curio keeps your feed perfectly focused.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 14, marginBottom: 40 }}>
            {TOPICS.map(t => (
              <div key={t.key} className={`topic-card-c${selected.has(t.key) ? " tselected" : ""}`} onClick={() => toggleTopic(t.key)} tabIndex={0}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && toggleTopic(t.key)}>
                <span style={{ fontSize: 28 }}>{t.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: selected.has(t.key) ? "#f0f0f6" : "rgba(240,240,246,.6)" }}>{t.name}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, color: "rgba(240,240,246,.6)", background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.2)", padding: "8px 20px", borderRadius: 100 }}>
              <span style={{ fontWeight: 700, color: "#a78bfa" }}>{selected.size}</span> topics selected
            </div>
            <Link to="/classroom" className="c-btn c-glow" style={{ opacity: selected.size > 0 ? 1 : 0.6 }}>
              <span>Build My Feed</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ── */}
      <section id="problem" style={{ padding: "120px 0" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div className="prob-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 48, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="section-lbl bad">The Problem</div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,5vw,58px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>Your attention<br /><span className="c-red-grad">is being stolen.</span></h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[["😵","Endless Scrolling","Platforms are engineered to keep you scrolling forever — not to bring you value."],["🎲","Random Algorithms","You never asked for cat videos between your startup content. The algorithm doesn't care."],["🌊","Content Overload","Billions of videos compete for your eyes every second. Signal buried under noise."],["⏱️","Time Wasted","The average person loses 2.5 hours daily to mindless content. That's 900 hours a year."]].map(([icon,title,desc])=>(
                  <div key={title} className="prob-item c-reveal">
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
                    <div><h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</h4><p style={{ fontSize: 13, color: "rgba(240,240,246,.6)", lineHeight: 1.5, margin: 0 }}>{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 60 }}>
              <div style={{ flex: 1, width: 1, background: "linear-gradient(to bottom,transparent,rgba(255,255,255,.08),transparent)", minHeight: 60 }} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".15em", color: "rgba(240,240,246,.35)", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", padding: "8px 10px", borderRadius: 8 }}>VS</div>
              <div style={{ flex: 1, width: 1, background: "linear-gradient(to bottom,transparent,rgba(255,255,255,.08),transparent)", minHeight: 60 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="section-lbl good">The Solution</div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,5vw,58px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}><span className="c-grad-text">Your interests<br />&gt; the algorithm.</span></h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {['"Focus is the new luxury."', '"No noise. Just curiosity."', '"Your feed. Your rules."'].map(q => <div key={q} className="tagline-c c-reveal">{q}</div>)}
              </div>
              <div className="c-glass c-reveal" style={{ display: "flex", alignItems: "center", padding: 24, borderColor: "rgba(16,185,129,.2)", marginTop: 8 }}>
                {[["100%","On-topic content"],["0","Random distraction"],["∞","Curiosity unlocked"]].map(([n,l],i)=>(
                  <>
                    {i > 0 && <div key={`d${i}`} style={{ width: 1, height: 50, background: "rgba(255,255,255,.08)", flexShrink: 0 }} />}
                    <div key={l} style={{ flex: 1, textAlign: "center" }}>
                      <span className="stat-num">{n}</span>
                      <span style={{ fontSize: 12, color: "rgba(240,240,246,.35)", fontWeight: 500 }}>{l}</span>
                    </div>
                  </>
                ))}
              </div>
              <Link to="/classroom" className="c-btn c-glow" style={{ alignSelf: "flex-start" }}>
                <span>Try Curio Free</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "120px 0", textAlign: "center" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div className="section-lbl">What You Get</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,5vw,58px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 48 }}>Built for the<br /><span className="c-grad-text">genuinely curious.</span></h2>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`feat-card c-glass c-reveal${f.wide ? " col-span-2" : ""}`} style={{ gridColumn: f.wide ? "span 2" : undefined, textAlign: "left" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: f.color, opacity: 0.8 }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(240,240,246,.6)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIRAL PREVIEW ── */}
      <section id="viral" style={{ padding: "120px 0" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div className="c-reveal" style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, lineHeight: 1.15 }}>
              Imagine opening the internet<br />
              <span className="c-grad-text">and seeing only what</span><br />
              <span className="c-grad-text-2">you truly care about.</span>
            </h2>
          </div>
          <div className="c-reveal">
            <div style={{ maxWidth: 860, margin: "0 auto" }}>
              <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6 }}>{["#f43f5e","#f59e0b","#10b981"].map(c=><span key={c} style={{ width:11,height:11,borderRadius:"50%",background:c,display:"block" }}/>)}</div>
                <div style={{ fontSize: 12, color: "rgba(240,240,246,.35)", flex: 1, textAlign: "center" }}>curio.app/feed</div>
              </div>
              <div className="c-glass" style={{ display: "grid", gridTemplateColumns: "180px 1fr", minHeight: 320, overflow: "hidden" }}>
                <div style={{ borderRight: "1px solid rgba(255,255,255,.08)", padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}><span className="c-logo-dot" style={{ width: 5, height: 5 }} /> Curio</div>
                  <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {["📡 My Feed","🧠 AI","💻 Coding","🎨 Design","🚀 Startups"].map((item,i) => <a key={i} className={`ui-nav-item${i===0?" active":""}`}>{item}</a>)}
                  </nav>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "rgba(240,240,246,.7)" }}>Good morning ✨</span>
                    <span style={{ fontSize: 12, color: "#f59e0b", background: "rgba(245,158,11,.1)", padding: "3px 10px", borderRadius: 100 }}>🔥 7 day streak</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[["🧠","AI","#8b5cf6","The Future of Human Intelligence"],["💻","Coding","#06b6d4","Building AI Tools with Python"],["🎨","Design","#ec4899","Design Systems at Scale"],["🚀","Startups","#f59e0b","How Notion Hit 30M Users"]].map(([icon,tag,color,title])=>(
                      <div key={tag} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, padding: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: `${color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 8 }}>{icon}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: ".08em", textTransform: "uppercase" }}>{tag}</span>
                        <p style={{ fontSize: 12, color: "#f0f0f6", lineHeight: 1.4, margin: "4px 0 0" }}>{title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "120px 0", textAlign: "center" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div className="section-lbl">Simple Pricing</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,5vw,58px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>Pick your<br /><span className="c-grad-text">curiosity plan.</span></h2>
          <p style={{ fontSize: 18, color: "rgba(240,240,246,.6)", marginBottom: 60 }}>Less than the cost of one coffee —<br />but feeds your mind every day.</p>
          <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 900, margin: "0 auto" }}>
            {[
              { name: "Starter", price: "Free", desc: "Perfect to explore Curio.", items: ["Choose up to 5 topics","Personalized feed","Basic recommendations"], off: ["Daily curated drops","Focus mode"], featured: false },
              { name: "Explorer", price: "$5", period: "/month", desc: "For the serious learner.", items: ["Unlimited topics","AI-curated feeds","Daily curated drops","Focus mode","Curiosity graph"], featured: true },
              { name: "Creator", price: "$12", period: "/month", desc: "Build. Share. Grow.", items: ["Everything in Explorer","Save learning playlists","Creator tools","Community discussions","Analytics dashboard"], featured: false },
            ].map((plan, i) => (
              <div key={i} className={`pricing-card-c c-glass c-reveal${plan.featured ? " pricing-feat-c" : ""}`}>
                {plan.featured && <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>⭐ Most Popular</div>}
                <div style={{ fontSize: 18, fontWeight: 700 }}>{plan.name}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 40, lineHeight: 1 }}>
                  {plan.price}{plan.period && <span style={{ fontSize: 16, fontWeight: 400, color: "rgba(240,240,246,.5)" }}>{plan.period}</span>}
                </div>
                <div style={{ fontSize: 13, color: "rgba(240,240,246,.5)" }}>{plan.desc}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                  {plan.items.map(item => <li key={item} style={{ fontSize: 13, color: "rgba(240,240,246,.8)", display: "flex", gap: 8 }}><span style={{ color: "#10b981" }}>✓</span>{item}</li>)}
                  {(plan.off||[]).map(item => <li key={item} style={{ fontSize: 13, color: "rgba(240,240,246,.3)", display: "flex", gap: 8 }}><span style={{ color: "rgba(240,240,246,.3)" }}>✗</span>{item}</li>)}
                </ul>
                <Link to="/classroom" className={`plan-btn${plan.featured ? " plan-btn-feat" : ""}`}>
                  {plan.name === "Starter" ? "Get Started Free" : plan.name === "Explorer" ? "Start Exploring" : "Go Creator"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOOK ── */}
      <section style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div className="orb-c" style={{ width:500,height:500,background:"radial-gradient(circle,#8b5cf6,transparent 70%)",top:"10%",left:"-10%",animation:"odrift1 14s ease-in-out infinite" }} />
          <div className="orb-c" style={{ width:400,height:400,background:"radial-gradient(circle,#06b6d4,transparent 70%)",bottom:"10%",right:"-5%",animation:"odrift2 16s ease-in-out infinite" }} />
        </div>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div className="c-reveal">
            <div className="hook-quote">"Your future is shaped by<br />what you watch every day."</div>
            <p style={{ fontSize: 18, color: "rgba(240,240,246,.6)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
              Every video you watch is either an investment or a distraction.<br />Curio helps you control that — one topic at a time.
            </p>
            <Link to="/classroom" className="c-btn c-glow">
              <span>Build My Feed</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <canvas ref={dotsCanvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4 }} />
        </div>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="c-reveal">
            <div className="section-lbl">Get Started Today</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 40 }}>
              Choose your interests.<br />
              <span className="c-grad-text">Let the internet</span><br />
              <span className="c-grad-text-2">organize itself.</span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
              <Link to="/classroom" className="c-btn c-glow">
                <span>Start Watching</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <a href="#topics" className="c-btn-ghost"><span>Create My Feed</span></a>
            </div>
            <p style={{ fontSize: 13, color: "rgba(240,240,246,.35)" }}>No credit card required · Cancel anytime · Free forever plan</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "60px 0 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 60, marginBottom: 48 }}>
            <div>
              <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#f0f0f6", textDecoration: "none", marginBottom: 12 }}>
                <span className="c-logo-dot" /> Curio
              </a>
              <p style={{ fontSize: 14, color: "rgba(240,240,246,.5)", lineHeight: 1.6, margin: 0 }}>The internet, organized<br />by your curiosity.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 48 }}>
              {[["Product",["Features","Pricing","Roadmap","Changelog"]],["Company",["About","Blog","Careers","Press"]],["Legal",["Privacy","Terms","Cookies"]]].map(([col,links])=>(
                <div key={col}>
                  <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "#f0f0f6" }}>{col}</h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {links.map(l=><a key={l} href="#" style={{ fontSize: 13, color: "rgba(240,240,246,.5)", textDecoration: "none", transition: "color .3s" }}
                      onMouseEnter={e=>e.target.style.color="#f0f0f6"} onMouseLeave={e=>e.target.style.color="rgba(240,240,246,.5)"}>{l}</a>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(240,240,246,.35)", margin: 0 }}>© 2026 Curio. All rights reserved.</p>
            <p style={{ fontSize: 13, color: "rgba(240,240,246,.35)", margin: 0 }}>Built for curious minds. 🧠</p>
          </div>
        </div>
      </footer>
    </div>
  );
}