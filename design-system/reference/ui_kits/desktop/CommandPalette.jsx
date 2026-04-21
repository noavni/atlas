// Command palette — Raycast-style fuzzy overlay
const CommandPalette = ({ onClose }) => {
  const { Search, Board, Note, Inbox, Graph, Sparkle, Return, ArrowR } = window.Icons;
  const [q, setQ] = React.useState('');
  const sections = [
    { title: 'Jump to', items: [
      { icon: Board, t: 'Home renovation', s: 'Board · 8 cards' },
      { icon: Note,  t: 'On quiet tools', s: 'Note · 3 backlinks' },
      { icon: Inbox, t: 'Brain dump',    s: 'Inbox · 7 items' },
      { icon: Graph, t: 'Knowledge graph', s: 'All 128 notes' },
    ]},
    { title: 'Actions', items: [
      { icon: Sparkle, t: 'Summarize this week', s: 'Ask · semantic' },
      { icon: Sparkle, t: 'Notes about paint', s: 'Ask · semantic' },
    ]},
    { title: 'Recent', items: [
      { icon: Note, t: 'Weekly review · Apr 14', s: 'Opened 2 hr ago' },
      { icon: Note, t: 'Paint palette', s: 'Opened yesterday' },
    ]},
  ];
  return (
    <div className="cp-backdrop" onClick={onClose}>
      <div className="cp" onClick={(e) => e.stopPropagation()}>
        <div className="cp-in">
          <Search size={18} />
          <input autoFocus placeholder="Search everything, or ask a question…" value={q} onChange={e => setQ(e.target.value)} />
          <span className="kbd">esc</span>
        </div>
        <div className="cp-body">
          {sections.map(s => (
            <div key={s.title} className="cp-sec">
              <div className="cp-sec-t">{s.title}</div>
              {s.items.map((it, i) => {
                const I = it.icon;
                const active = s === sections[0] && i === 0;
                return (
                  <div key={i} className={'cp-row' + (active ? ' active' : '')}>
                    <I size={16}/>
                    <div className="cp-row-t">{it.t}</div>
                    <div className="cp-row-s">{it.s}</div>
                    {active && <span className="kbd"><Return size={11}/></span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cp-foot">
          <span className="kbd">↑↓</span><span>navigate</span>
          <span className="kbd">↵</span><span>open</span>
          <span className="spacer"/>
          <span>Atlas</span>
        </div>
      </div>
    </div>
  );
};

window.CommandPalette = CommandPalette;
