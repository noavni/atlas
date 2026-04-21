// Note editor — block-based, typography-forward
const NoteEditor = () => {
  const { Link, Plus } = window.Icons;
  return (
    <div className="note-root">
      <div className="note-meta">
        <div className="eyebrow">Personal · last edited 14 min ago</div>
      </div>
      <h1 className="note-title">On quiet tools</h1>
      <p className="note-lead">A tool should disappear into your hand. You stop noticing the pen; the thought travels through it.</p>

      <p className="note-p">
        The best things we own feel obvious. There's a particular pen I've been writing with for four years — a matte-black Lamy that weighs almost nothing. I don't think about it. It is just the means by which the page gets written.
      </p>

      <h2 className="note-h2">What makes software quiet</h2>
      <p className="note-p">
        Software rarely gets to be quiet. It interrupts. It notifies. It insists on being seen. <a className="note-link">Notion</a>, <a className="note-link">Obsidian</a>, <a className="note-link">Linear</a> — all beloved for the aspects of them that stay out of your way. The rest is noise.
      </p>

      <blockquote className="note-quote">
        The perfect tool is the one you forget you're using.
      </blockquote>

      <ul className="note-list">
        <li><span className="check done"/><span>Calm motion — nothing snaps.</span></li>
        <li><span className="check"/><span>Text that feels printed, not rendered.</span></li>
        <li><span className="check"/><span>Shortcuts you can feel through your fingers.</span></li>
      </ul>

      <p className="note-p">
        This is what I want Atlas to be. A workspace that reads like a book. A workspace that, at its best, you stop noticing.
      </p>

      <div className="note-backlinks">
        <div className="bl-head"><Link size={13}/> Linked from 3 notes</div>
        <div className="bl-item"><span className="bl-ttl">Weekly review · Apr 14</span><span className="bl-snip">…opened <mark>On quiet tools</mark> again today and added a thought about…</span></div>
        <div className="bl-item"><span className="bl-ttl">Paint palette</span><span className="bl-snip">…the same restraint as the Lamy in <mark>On quiet tools</mark>…</span></div>
      </div>

      <button className="block-add"><Plus size={14}/> Add block</button>
    </div>
  );
};

window.NoteEditor = NoteEditor;
