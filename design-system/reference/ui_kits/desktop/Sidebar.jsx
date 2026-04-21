// Sidebar — collapsible nav with projects and notes
const Sidebar = ({ view, setView, rtl }) => {
  const { Board, Note, Inbox, Graph, Settings, Plus, Chevron, Folder } = window.Icons;
  const [projOpen, setProjOpen] = React.useState(true);
  const [notesOpen, setNotesOpen] = React.useState(true);

  const NavItem = ({ id, icon: I, label, badge }) => {
    const active = view === id;
    return (
      <button className={'nav-item' + (active ? ' active' : '')} onClick={() => setView(id)}>
        <I size={16} />
        <span>{label}</span>
        {badge != null && <span className="badge">{badge}</span>}
      </button>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="workspace">
          <div className="ws-mark"><img src="../../assets/logomark.svg" alt=""/></div>
          <div className="ws-meta">
            <div className="ws-name">Shira & Yoni</div>
            <div className="ws-sub">Private workspace</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavItem id="inbox" icon={Inbox} label="Inbox" badge={7} />
        <NavItem id="board" icon={Board} label="Boards" />
        <NavItem id="notes" icon={Note} label="Notes" />
        <NavItem id="graph" icon={Graph} label="Graph" />
      </nav>

      <div className="sidebar-section">
        <button className="section-head" onClick={() => setProjOpen(v => !v)}>
          <Chevron size={12} style={{ transform: projOpen ? 'rotate(0)' : (rtl ? 'rotate(90deg)' : 'rotate(-90deg)'), transition: 'transform 200ms var(--spring-gentle)' }}/>
          <span>Projects</span>
          <span className="spacer"/>
          <Plus size={14}/>
        </button>
        {projOpen && (
          <div className="section-body">
            {[
              { name: 'Home renovation', color: '#C85A3D' },
              { name: 'Trip to Lisbon', color: '#5E8A6B' },
              { name: 'Reading list 2026', color: '#4B5BE8' },
              { name: 'Garden', color: '#C8881E' },
            ].map(p => (
              <button key={p.name} className="nav-item sub" onClick={() => setView('board')}>
                <span className="proj-dot" style={{ background: p.color }}/>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <button className="section-head" onClick={() => setNotesOpen(v => !v)}>
          <Chevron size={12} style={{ transform: notesOpen ? 'rotate(0)' : (rtl ? 'rotate(90deg)' : 'rotate(-90deg)'), transition: 'transform 200ms var(--spring-gentle)' }}/>
          <span>Pinned notes</span>
          <span className="spacer"/>
        </button>
        {notesOpen && (
          <div className="section-body">
            {['On quiet tools', 'Paint palette', 'Weekly review', 'Books to buy'].map(n => (
              <button key={n} className="nav-item sub" onClick={() => setView('notes')}>
                <Folder size={14}/>
                <span>{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-foot">
        <NavItem id="settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
