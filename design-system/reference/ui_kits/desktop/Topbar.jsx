// Topbar — translucent blurred chrome with breadcrumbs and quick actions
const Topbar = ({ title, crumbs = [], theme, setTheme, rtl, setRtl, onCmd }) => {
  const { Search, Sun, Moon, RTL, Plus, Sparkle } = window.Icons;
  return (
    <header className="topbar">
      <div className="tb-left">
        <div className="traffic">
          <span style={{background:'#E26A57'}}/>
          <span style={{background:'#E5A94A'}}/>
          <span style={{background:'#62C254'}}/>
        </div>
        <div className="crumbs">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              <span className={i === crumbs.length - 1 ? 'crumb cur' : 'crumb'}>{c}</span>
              {i < crumbs.length - 1 && <span className="sep">/</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <button className="cmd-trigger" onClick={onCmd}>
        <Search size={14}/>
        <span>Search or jump to…</span>
        <span className="spacer"/>
        <span className="kbd">⌘K</span>
      </button>

      <div className="tb-right">
        <button className="icon-btn" title="Toggle RTL" onClick={() => setRtl(v => !v)} style={{opacity: rtl ? 1 : 0.55}}>
          <RTL size={16}/>
        </button>
        <button className="icon-btn" title="Toggle theme" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
        </button>
        <button className="pill-btn" onClick={onCmd}>
          <Sparkle size={14}/><span>Ask</span>
        </button>
        <div className="av">S</div>
      </div>
    </header>
  );
};

window.Topbar = Topbar;
