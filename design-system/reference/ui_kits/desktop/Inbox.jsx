// Inbox — brain dump feed
const Inbox = () => {
  const { Mic, Image, File, Globe, Sparkle, ArrowR, Plus } = window.Icons;
  const items = [
    { kind: 'text', t: '8:14 am', body: 'Idea: a weekly letter we send each other on sundays, just to ourselves.' },
    { kind: 'voice', t: '7:52 am', body: '0:34 · "…think the kitchen paint should lean warmer than the living room, it will glow in the afternoon light…"' },
    { kind: 'link', t: 'yesterday', body: 'nytimes.com · Why we walk', meta: 'The Atlantic · 9 min read' },
    { kind: 'image', t: 'yesterday', body: 'Porch-light-options.jpg', cover: 'linear-gradient(135deg,#E4E1D8,#A8A496)' },
    { kind: 'text', t: 'Mon', body: 'Book flights home for my mother\'s birthday. Before end of month.' },
    { kind: 'text', t: 'Mon', body: 'Lisbon: check if Sintra has a reservation system in July.' },
    { kind: 'file', t: 'Sun', body: 'Wedding-budget-v3.pdf', meta: '142 KB' },
  ];
  const kindIcon = (k) => ({text: Plus, voice: Mic, link: Globe, image: Image, file: File}[k]);
  return (
    <div className="inbox">
      <div className="inbox-head">
        <div>
          <div className="eyebrow">today · inbox</div>
          <h1 className="board-title">Brain dump</h1>
          <div className="inbox-sub">Seven things to organize. No hurry.</div>
        </div>
        <button className="pill-btn ghost"><Sparkle size={14}/> Auto-organize</button>
      </div>

      <div className="capture-bar">
        <input placeholder="What's on your mind…" />
        <div className="capture-actions">
          <button className="icon-btn" title="Record"><Mic size={16}/></button>
          <button className="icon-btn" title="Image"><Image size={16}/></button>
          <button className="icon-btn" title="File"><File size={16}/></button>
          <span className="kbd">⌘N</span>
        </div>
      </div>

      <div className="feed">
        {items.map((it, i) => {
          const K = kindIcon(it.kind);
          return (
            <div key={i} className={'feed-item kind-' + it.kind}>
              <div className={'feed-ic ic-' + it.kind}><K size={14}/></div>
              <div className="feed-body">
                <div className="feed-time">{it.t}</div>
                {it.cover && <div className="feed-cover" style={{background: it.cover}}/>}
                <div className="feed-text">{it.body}</div>
                {it.meta && <div className="feed-meta">{it.meta}</div>}
              </div>
              <div className="feed-act">
                <button className="chip">Note</button>
                <button className="chip">Task</button>
                <button className="chip ghost"><ArrowR size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.Inbox = Inbox;
