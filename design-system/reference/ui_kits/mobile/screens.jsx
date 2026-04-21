// Atlas mobile screens — Inbox, QuickCapture, Note, Board
const MIcons = {
  mic:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10a7 7 0 0 1-14 0M12 19v4"/></svg>,
  image: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>,
  file:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  plus:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>,
  arrowUp: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
};

// ───── Shared tab bar ─────
const TabBar = ({ cur }) => (
  <div className="m-tabbar">
    {['inbox','board','notes','graph'].map(t => (
      <div key={t} className={'m-tab' + (t === cur ? ' cur' : '')}>
        <div className="m-tab-dot"/>
        <div className="m-tab-l">{t}</div>
      </div>
    ))}
  </div>
);

// ───── Inbox feed ─────
const MInbox = () => {
  const items = [
    { ic:'text',  t:'8:14 am',  body:'Idea: a weekly letter we send each other on sundays, just to ourselves.' },
    { ic:'voice', t:'7:52 am',  body:'"…paint should lean warmer, it will glow in the afternoon…"', meta:'0:34' },
    { ic:'link',  t:'yesterday',body:'Why we walk', meta:'The Atlantic · 9 min' },
    { ic:'image', t:'yesterday',body:'porch-light-options.jpg', cover:'linear-gradient(135deg,#E4E1D8,#A8A496)' },
    { ic:'text',  t:'Mon',      body:'Book flights for my mother\'s birthday.' },
    { ic:'text',  t:'Mon',      body:'Check Sintra reservation system for July.' },
  ];
  return (
    <div className="m-screen m-inbox">
      <div className="m-hero">
        <div className="m-eye">today · inbox</div>
        <h1 className="m-title">Brain dump</h1>
        <div className="m-sub">Seven things to organize.</div>
      </div>
      <div className="m-feed">
        {items.map((it,i) => (
          <div key={i} className="m-feed-item">
            <div className={'m-ic m-ic-' + it.ic}>
              {it.ic === 'voice' ? MIcons.mic : it.ic === 'link' ? MIcons.globe : it.ic === 'image' ? MIcons.image : <span/>}
            </div>
            <div className="m-feed-body">
              <div className="m-feed-t">{it.t}</div>
              {it.cover && <div className="m-feed-cover" style={{background: it.cover}}/>}
              <div className="m-feed-text">{it.body}</div>
              {it.meta && <div className="m-feed-meta">{it.meta}</div>}
            </div>
          </div>
        ))}
      </div>
      <button className="m-fab">{MIcons.plus}</button>
      <TabBar cur="inbox"/>
    </div>
  );
};

// ───── Quick capture bottom sheet ─────
const MCapture = () => (
  <div className="m-screen m-capture">
    <div className="m-capture-scrim"/>
    <div className="m-sheet">
      <div className="m-sheet-grab"/>
      <div className="m-eye" style={{marginBottom:6}}>quick capture</div>
      <div className="m-capture-txt">A weekly letter we send each other on sundays — just the two of us, no one else reading.</div>
      <div className="m-wave">
        {Array.from({length:34}).map((_,i) => <span key={i} style={{animationDelay:(i*45)+'ms'}}/>)}
        <div className="m-wave-t">0:12</div>
      </div>
      <div className="m-capture-row">
        <button className="m-k rec">{MIcons.mic}</button>
        <button className="m-k">{MIcons.image}</button>
        <button className="m-k">{MIcons.file}</button>
        <button className="m-k">{MIcons.globe}</button>
        <div style={{flex:1}}/>
        <button className="m-send">{MIcons.arrowUp}</button>
      </div>
    </div>
  </div>
);

// ───── Note reader (RTL Hebrew) ─────
const MNote = () => (
  <div className="m-screen m-note" dir="rtl">
    <div className="m-note-meta">אישי · עודכן לפני 14 דקות</div>
    <h1 className="m-note-title">על כלים שקטים</h1>
    <p className="m-note-lead">כלי טוב נעלם לתוך היד שלך. אתה מפסיק להבחין בעט; המחשבה עוברת דרכו אל הדף.</p>
    <p className="m-note-p">הדברים הטובים ביותר שאנו מחזיקים בהם מרגישים ברורים מאליהם. יש עט מסוים שאני כותב איתו כבר ארבע שנים — לאמי שחור מט, כמעט חסר משקל.</p>
    <h2 className="m-note-h2">מה הופך תוכנה לשקטה</h2>
    <p className="m-note-p">תוכנה רק לעיתים רחוקות זוכה להיות שקטה. היא מפריעה. היא מתריעה. היא מתעקשת להיראות. השאר הוא רעש.</p>
    <blockquote className="m-note-quote">הכלי המושלם הוא זה ששוכחים שמשתמשים בו.</blockquote>
    <TabBar cur="notes"/>
  </div>
);

// ───── Board view ─────
const MBoard = () => {
  const cols = [
    { title: 'To do', tone: 'muted', cards: [
      { t:'Choose paint for kitchen', s:'Warm neutrals · this week', tag:{l:'paint', c:'neutral'} },
      { t:'Book florist for Sunday',  s:'Mon',  tag:{l:'wedding', c:'indigo'} },
    ]},
    { title: 'In progress', tone: 'indigo', cards: [
      { t:'Plan Lisbon itinerary', s:'Jul 12–26 · 4 links', tag:{l:'travel', c:'sage'} },
      { t:'Draft guest list', s:'Fri', cover:'linear-gradient(135deg,#B9C1FB,#6B78EF)' },
    ]},
  ];
  return (
    <div className="m-screen m-board">
      <div className="m-hero">
        <div className="m-eye">project</div>
        <h1 className="m-title">Home renovation</h1>
        <div className="m-seg"><span className="cur">Board</span><span>List</span><span>Timeline</span></div>
      </div>
      <div className="m-cols">
        {cols.map((col,ci) => (
          <div key={ci} className="m-col">
            <div className="m-col-h"><span className={'m-dot m-dot-'+col.tone}/><span>{col.title}</span><span className="m-count">{col.cards.length}</span></div>
            {col.cards.map((c,i) => (
              <div key={i} className="m-card">
                {c.tag && <div className={'m-tag m-tag-'+c.tag.c}>{c.tag.l}</div>}
                <div className="m-card-t">{c.t}</div>
                {c.cover && <div className="m-card-cover" style={{background:c.cover}}/>}
                <div className="m-card-s">{c.s}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <TabBar cur="board"/>
    </div>
  );
};

// ───── Root: four phone frames ─────
const W = 302, H = 656;
const MobileApp = () => (
  <div className="stage">
    <div className="phone">
      <window.IOSDevice width={W} height={H}>
        <MInbox/>
      </window.IOSDevice>
      <div className="cap">Inbox</div>
    </div>
    <div className="phone">
      <window.IOSDevice width={W} height={H}>
        <MCapture/>
      </window.IOSDevice>
      <div className="cap">Quick capture · voice</div>
    </div>
    <div className="phone">
      <window.IOSDevice width={W} height={H} dark={true}>
        <MNote/>
      </window.IOSDevice>
      <div className="cap">Note reader · Hebrew · dark</div>
    </div>
    <div className="phone">
      <window.IOSDevice width={W} height={H}>
        <MBoard/>
      </window.IOSDevice>
      <div className="cap">Board</div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<MobileApp/>);
