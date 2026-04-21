// Atlas Desktop — app shell
const { useState, useEffect } = React;

const App = () => {
  const [view, setView] = useState('board');
  const [theme, setTheme] = useState('light');
  const [rtl, setRtl] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [qc, setQc] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  }, [theme, rtl]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setCmd(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault(); setQc(true);
      }
      if (e.key === 'Escape') { setCmd(false); setQc(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const crumbs = {
    board:    ['Shira & Yoni', 'Boards', 'Home renovation'],
    notes:    ['Shira & Yoni', 'Notes', 'On quiet tools'],
    inbox:    ['Shira & Yoni', 'Inbox'],
    graph:    ['Shira & Yoni', 'Graph'],
    settings: ['Shira & Yoni', 'Settings'],
  }[view];

  const Content = () => {
    if (view === 'board')    return <window.Board/>;
    if (view === 'notes')    return <window.NoteEditor/>;
    if (view === 'inbox')    return <window.Inbox/>;
    if (view === 'graph')    return <window.Graph/>;
    if (view === 'settings') return <window.Settings/>;
    return null;
  };

  return (
    <div className="app">
      <window.Sidebar view={view} setView={setView} rtl={rtl}/>
      <div className="main">
        <window.Topbar
          crumbs={crumbs}
          theme={theme} setTheme={setTheme}
          rtl={rtl} setRtl={setRtl}
          onCmd={() => setCmd(true)}
        />
        <main key={view} className="view">
          <Content/>
        </main>
      </div>
      {cmd && <window.CommandPalette onClose={() => setCmd(false)}/>}
      {qc &&  <window.QuickCapture  onClose={() => setQc(false)}/>}

      <button className="fab" onClick={() => setQc(true)} title="Quick capture (⌘N)">
        <window.Icons.Plus size={20}/>
      </button>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
