// Settings — considered as a main surface
const Settings = () => {
  const { Sun, Moon, Globe, Check } = window.Icons;
  const Row = ({ title, desc, children }) => (
    <div className="st-row">
      <div>
        <div className="st-title">{title}</div>
        <div className="st-desc">{desc}</div>
      </div>
      <div>{children}</div>
    </div>
  );
  return (
    <div className="settings">
      <div className="settings-head">
        <div className="eyebrow">preferences</div>
        <h1 className="board-title">Settings</h1>
      </div>

      <div className="st-section">
        <div className="st-section-t">Appearance</div>
        <Row title="Theme" desc="System follows your OS. Dark is first-class here.">
          <div className="seg wide">
            <span>System</span><span className="seg-cur">Light</span><span>Dark</span>
          </div>
        </Row>
        <Row title="Accent" desc="Used for selection, focus rings, and links.">
          <div className="color-row">
            {['#4B5BE8','#5E8A6B','#C85A3D','#C8881E','#7E7B6E'].map((c,i) => (
              <span key={c} className={'color-dot' + (i === 0 ? ' active' : '')} style={{background: c}}>
                {i === 0 && <Check size={12}/>}
              </span>
            ))}
          </div>
        </Row>
        <Row title="Density" desc="Spacious by default; compact for power use.">
          <div className="seg"><span className="seg-cur">Spacious</span><span>Compact</span></div>
        </Row>
      </div>

      <div className="st-section">
        <div className="st-section-t">Language & region</div>
        <Row title="Interface" desc="Atlas supports English and Hebrew with full RTL.">
          <div className="seg"><span className="seg-cur">English</span><span>עברית</span></div>
        </Row>
        <Row title="Daily review" desc="A quiet prompt to clear your inbox.">
          <div className="toggle on"><span/></div>
        </Row>
      </div>

      <div className="st-section">
        <div className="st-section-t">Workspace</div>
        <Row title="Members" desc="Shared between two people. No one else, ever.">
          <div className="members">
            <div className="av" style={{background:'#C85A3D'}}>S</div>
            <div className="av" style={{background:'#4B5BE8'}}>Y</div>
          </div>
        </Row>
        <Row title="Backups" desc="Encrypted snapshot every night at 3:00 am.">
          <span className="t-kbd">Last backup 3:02 am</span>
        </Row>
      </div>
    </div>
  );
};

window.Settings = Settings;
