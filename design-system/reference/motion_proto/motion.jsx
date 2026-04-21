// Atlas motion prototype — real spring physics via Framer Motion
const { motion, AnimatePresence, useMotionValue, useTransform, animate, useSpring } = window.Motion;

// ──────────────────────────────────────────────────────────
// Spring presets (match motion.css CSS vars, in JS)
// ──────────────────────────────────────────────────────────
const SPRING = {
  drag:   { type: 'spring', stiffness: 220, damping: 26, mass: 1 },
  panel:  { type: 'spring', stiffness: 260, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 15 },
  gentle: { type: 'spring', stiffness: 180, damping: 22 },
  stiff:  { type: 'spring', stiffness: 500, damping: 30 },
};

// ──────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────
const I = {
  mic: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10a7 7 0 0 1-14 0M12 19v4"/></svg>,
  img: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>,
  link:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  up:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
  plus:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
};

// ──────────────────────────────────────────────────────────
// 1. CARD DRAG — physics-based drag between columns
// ──────────────────────────────────────────────────────────
const initialBoard = {
  todo: [
    { id: 'c1', tag:'wedding', tagTone:'indigo', t:'Finalize invitations',  s:'Mon · 3pm' },
    { id: 'c2', tag:'home',    tagTone:'apricot',t:'Pick porch light',      s:'This week' },
  ],
  doing: [
    { id: 'c3', tag:'travel',  tagTone:'sage',   t:'Draft Lisbon itinerary',s:'Jul 12–26' },
  ],
  done: [
    { id: 'c4', tag:'home',    tagTone:'apricot',t:'Choose kitchen paint',  s:'Done' },
  ],
};

function DragBoard() {
  const [board, setBoard] = React.useState(initialBoard);
  const [over, setOver] = React.useState(null);
  const colRefs = React.useRef({});

  const findColFromPoint = (x, y) => {
    for (const [k, el] of Object.entries(colRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return k;
    }
    return null;
  };

  const onDrag = (e, info) => {
    const col = findColFromPoint(info.point.x, info.point.y);
    setOver(col);
  };

  const onDragEnd = (e, info, fromCol, card) => {
    const toCol = findColFromPoint(info.point.x, info.point.y);
    setOver(null);
    if (!toCol || toCol === fromCol) return;
    setBoard(prev => {
      const next = { ...prev };
      next[fromCol] = prev[fromCol].filter(c => c.id !== card.id);
      next[toCol]   = [...prev[toCol], card];
      return next;
    });
  };

  const cols = [
    { key: 'todo',  title: 'To do',       dot: '#A8A496' },
    { key: 'doing', title: 'In progress', dot: 'var(--accent-primary)' },
    { key: 'done',  title: 'Done',        dot: 'var(--sage-500)' },
  ];

  return (
    <div className="mp-board">
      {cols.map(col => (
        <div key={col.key}
          ref={el => colRefs.current[col.key] = el}
          className={'mp-col-b' + (over === col.key ? ' hover-target' : '')}>
          <div className="chead">
            <span className="dot" style={{background: col.dot}}/>
            <span>{col.title}</span>
            <span className="count">{board[col.key].length}</span>
          </div>
          <motion.div layout transition={SPRING.gentle} style={{display:'flex',flexDirection:'column',gap:6}}>
            {board[col.key].map(card => (
              <motion.div
                key={card.id}
                layout
                layoutId={card.id}
                drag
                dragSnapToOrigin
                dragElastic={0.18}
                dragTransition={SPRING.drag}
                whileDrag={{ scale: 1.04, rotate: 1.5, zIndex: 10 }}
                whileHover={{ y: -1 }}
                transition={SPRING.gentle}
                onDrag={onDrag}
                onDragEnd={(e, info) => onDragEnd(e, info, col.key, card)}
                className="mp-kcard"
                style={{ touchAction: 'none' }}
              >
                <div className={'tag ' + card.tagTone}>{card.tag}</div>
                <div className="t">{card.t}</div>
                <div className="s">{card.s}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 2. QUICK CAPTURE — gesture-driven bottom sheet
// ──────────────────────────────────────────────────────────
function QuickCapture() {
  const [open, setOpen] = React.useState(true);
  const y = useMotionValue(0);

  const onDragEnd = (e, info) => {
    // Dismiss if pulled past threshold or flicked down
    if (info.offset.y > 120 || info.velocity.y > 500) {
      setOpen(false);
    } else {
      animate(y, 0, SPRING.panel);
    }
  };

  return (
    <div className="mp-phone">
      <div className="fake-bg">
        <div className="h">Brain dump</div>
        <div className="row">8:14 — Idea for weekly sunday letter</div>
        <div className="row">7:52 — Voice note (34s)</div>
        <div className="row">yest — Link: Why we walk</div>
        <div className="row">yest — porch-light-options.jpg</div>
        <div className="row">Mon — Book flights</div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            className="mp-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            className="mp-sheet"
            drag="y"
            dragConstraints={{ top: 0, bottom: 400 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            style={{ y }}
            onDragEnd={onDragEnd}
            initial={{ y: 500 }}
            animate={{ y: 0 }}
            exit={{ y: 500 }}
            transition={SPRING.panel}
          >
            <div className="mp-grab"/>
            <div className="eyelab">capture · voice ready</div>
            <textarea rows={5} defaultValue={'A weekly letter we send each other on sundays — just the two of us, no one else reading.'}/>
            <div className="mp-capture-tools">
              <button>{I.mic}</button>
              <button>{I.img}</button>
              <button>{I.link}</button>
              <button className="send">{I.up}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          className="mp-trigger"
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.92 }}
          transition={SPRING.stiff}
        >{I.plus}</motion.button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 3. PAGE TRANSITION — shared-element continuous motion
// ──────────────────────────────────────────────────────────
const notes = [
  { id:'n1', title:'On quiet tools',       excerpt:'A good tool disappears into your hand…', thumb:'linear-gradient(135deg,#858EFF,#3D49F5)' },
  { id:'n2', title:'Warmth as a strategy', excerpt:'The interfaces we return to have one thing…', thumb:'linear-gradient(135deg,#FFD3A8,#FF8A3D)' },
  { id:'n3', title:'Seven sundays',        excerpt:'The ritual of a weekly letter, to ourselves…', thumb:'linear-gradient(135deg,#DCEFE1,#4F9868)' },
];

function PageTransition() {
  const [selected, setSelected] = React.useState(null);
  const open = notes.find(n => n.id === selected);

  return (
    <div className="mp-pt-stage">
      <motion.div className="mp-pt-list" layout transition={SPRING.gentle}>
        <div className="eye">notes · personal</div>
        <h2>Recent</h2>
        {notes.map(n => (
          <motion.div
            key={n.id}
            layoutId={'note-card-'+n.id}
            onClick={() => setSelected(n.id)}
            className="mp-pt-item"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={SPRING.gentle}
          >
            <motion.div layoutId={'note-thumb-'+n.id} className="mp-pt-thumb" style={{background: n.thumb}}/>
            <div>
              <motion.div layoutId={'note-title-'+n.id} className="ttl">{n.title}</motion.div>
              <div className="excerpt">{n.excerpt}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="detail"
            layoutId={'note-card-'+open.id}
            className="mp-pt-detail"
            transition={SPRING.panel}
          >
            <button className="back" onClick={() => setSelected(null)}>← Back</button>
            <motion.div layoutId={'note-thumb-'+open.id} className="big-thumb" style={{background: open.thumb}}/>
            <motion.h1 layoutId={'note-title-'+open.id}>{open.title}</motion.h1>
            <motion.p initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{delay:0.15, duration:0.35}}>
              A good tool disappears into your hand. You stop noticing the pen; the thought passes through it to the page. The things we keep closest feel obvious — as if they'd always been there.
            </motion.p>
            <motion.p initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{delay:0.2, duration:0.35}}>
              Software rarely gets to be quiet. It interrupts. It notifies. It insists on being seen. The rest is noise.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 4. HOVER LIFT — subtle depth response for detail-oriented users
// ──────────────────────────────────────────────────────────
function HoverLift() {
  const items = [
    { t:'Kitchen paint',  s:'warm white · matte', tint:'var(--apricot-500)' },
    { t:'Sunday letter',  s:'weekly ritual',      tint:'var(--accent-primary)' },
    { t:'Lisbon plan',    s:'Jul 12 → 26',         tint:'var(--sage-500)' },
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
      {items.map((it, i) => (
        <motion.div key={i}
          className="mp-hover-card"
          whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(24,22,36,0.10), 0 1px 2px rgba(24,22,36,0.04)' }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING.stiff}
        >
          <div style={{width:26,height:26,borderRadius:7,background:it.tint,marginBottom:10,opacity:0.85}}/>
          <h4>{it.t}</h4>
          <p>{it.s}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Root
// ──────────────────────────────────────────────────────────
function App() {
  return (
    <div className="mp-stage">
      <div className="mp-hdr">
        <div className="eye">atlas · motion prototype</div>
        <h1>Motion is the product.</h1>
        <p>Real spring physics — drag and release to feel the mass. Every interaction here uses a tuned spring: no tweened easing, no linear rails. Pull the sheet down. Tap a note.</p>
      </div>

      <div className="mp-grid">
        <div className="mp-col">
          <div className="mp-cell tall">
            <h3>Card drag — physics</h3>
            <div className="sub">Pick up a card, drag between columns. Release and it lands with spring overshoot.</div>
            <DragBoard/>
            <div className="spec">
              <span><b>stiffness</b> 220</span>
              <span><b>damping</b> 26</span>
              <span><b>mass</b> 1</span>
              <span><b>rotate on lift</b> 1.5°</span>
              <span><b>scale on lift</b> 1.04</span>
            </div>
          </div>

          <div className="mp-cell short">
            <h3>Hover lift</h3>
            <div className="sub">Subtle 3px rise + shadow deepening on hover. 98% on press.</div>
            <HoverLift/>
            <div className="spec">
              <span><b>stiffness</b> 500</span>
              <span><b>damping</b> 30</span>
              <span><b>lift</b> 3px</span>
            </div>
          </div>
        </div>

        <div className="mp-col">
          <div className="mp-cell tall">
            <h3>Quick capture — gesture</h3>
            <div className="sub">Sheet arrives spring-up. Pull the handle down past 120px or flick (velocity &gt; 500) to dismiss. Tap + to re-summon.</div>
            <QuickCapture/>
            <div className="spec">
              <span><b>panel stiffness</b> 260</span>
              <span><b>damping</b> 30</span>
              <span><b>dismiss threshold</b> 120px / 500px·s⁻¹</span>
            </div>
          </div>

          <div className="mp-cell short">
            <h3>Page transition — shared element</h3>
            <div className="sub">Click a note: the thumb and title morph in place. No cut, no fade-to-black.</div>
            <PageTransition/>
            <div className="spec">
              <span><b>layoutId</b> thumb + title</span>
              <span><b>spring</b> 260/30</span>
              <span><b>body fade-in</b> 150ms delay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
