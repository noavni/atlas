// Quick capture overlay — triggered by ⌘N anywhere
const QuickCapture = ({ onClose }) => {
  const { Mic, Image, File, Globe, Return } = window.Icons;
  const [rec, setRec] = React.useState(false);
  return (
    <div className="qc-backdrop" onClick={onClose}>
      <div className="qc" onClick={(e) => e.stopPropagation()}>
        <div className="qc-head">
          <div className="eyebrow">quick capture</div>
          <span className="kbd">⌘N</span>
        </div>
        <textarea autoFocus className="qc-input" placeholder="Anything at all. It goes in the inbox." />
        <div className="qc-bar">
          <div className="qc-kinds">
            <button className={'icon-btn' + (rec ? ' rec' : '')} onClick={() => setRec(v => !v)} title="Record voice">
              <Mic size={18}/>
              {rec && <span className="rec-dot"/>}
            </button>
            <button className="icon-btn"><Image size={18}/></button>
            <button className="icon-btn"><File size={18}/></button>
            <button className="icon-btn"><Globe size={18}/></button>
          </div>
          <div className="qc-spacer"/>
          <button className="pill-btn primary">Save to inbox <span className="kbd inv">↵</span></button>
        </div>
        {rec && (
          <div className="qc-wave">
            {Array.from({length: 48}).map((_, i) => (
              <span key={i} style={{animationDelay: (i * 60) + 'ms'}}/>
            ))}
            <span className="qc-time">0:07</span>
          </div>
        )}
      </div>
    </div>
  );
};

window.QuickCapture = QuickCapture;
