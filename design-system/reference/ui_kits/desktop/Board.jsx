// Board — Kanban with drag-to-reorder between columns
const Board = () => {
  const { Card } = window;
  const { Plus, More, Filter } = window.Icons;
  const [cols, setCols] = React.useState(() => ({
    todo: {
      title: 'To do',
      tone: 'muted',
      cards: [
        { id: 1, title: 'Choose paint for kitchen', body: 'Warm neutrals. Test swatches on north wall.', tag: {label: 'paint', tone: 'neutral'}, date: 'This week', links: 2, avatars:[{l:'S',c:'#C85A3D'}] },
        { id: 2, title: 'Book florist for Sunday', tag: {label: 'wedding', tone: 'indigo'}, date: 'Mon', avatars:[{l:'Y',c:'#4B5BE8'}] },
        { id: 3, title: 'Replace porch light', body: 'Brass, warm-white LED.', date: 'Sat' },
      ],
    },
    doing: {
      title: 'In progress',
      tone: 'indigo',
      cards: [
        { id: 4, title: 'Plan Lisbon itinerary', body: 'Sintra on day 3. Reserve tapas spot.', tag: {label: 'travel', tone: 'sage'}, date: 'Jul 12–26', links: 4, avatars:[{l:'S',c:'#C85A3D'},{l:'Y',c:'#4B5BE8'}] },
        { id: 5, title: 'Draft guest list', cover: 'linear-gradient(135deg,#B9C1FB,#6B78EF)', date: 'Fri', links: 1 },
      ],
    },
    review: {
      title: 'Review',
      tone: 'amber',
      cards: [
        { id: 6, title: 'Choose wedding photographer', body: 'Three candidates. Decide by Friday.', tag: {label: 'decision', tone: 'amber'}, date: 'Fri', avatars:[{l:'S',c:'#C85A3D'}] },
      ],
    },
    done: {
      title: 'Done',
      tone: 'sage',
      cards: [
        { id: 7, title: 'Finalize vacation dates', tag: {label: 'travel', tone: 'sage'}, date: '2d ago', links: 2 },
        { id: 8, title: 'Order bookshelf', date: 'Mon' },
      ],
    },
  }));
  const [drag, setDrag] = React.useState(null);
  const [hover, setHover] = React.useState(null);

  const onDrop = (colKey) => {
    if (!drag) return;
    setCols(prev => {
      const next = { ...prev };
      // find + remove
      for (const k of Object.keys(next)) {
        next[k] = { ...next[k], cards: next[k].cards.filter(c => c.id !== drag.id) };
      }
      next[colKey] = { ...next[colKey], cards: [drag, ...next[colKey].cards] };
      return next;
    });
    setDrag(null); setHover(null);
  };

  return (
    <div className="board">
      <div className="board-head">
        <div>
          <div className="eyebrow">Project</div>
          <h1 className="board-title">Home renovation</h1>
        </div>
        <div className="board-actions">
          <button className="seg">
            <span className="seg-cur">Board</span><span>List</span><span>Timeline</span>
          </button>
          <button className="icon-btn"><Filter size={16}/></button>
          <button className="pill-btn primary"><Plus size={14}/> New card</button>
        </div>
      </div>

      <div className="columns">
        {Object.entries(cols).map(([key, col]) => (
          <div
            key={key}
            className={'col' + (hover === key ? ' drop' : '')}
            onDragOver={(e) => { e.preventDefault(); setHover(key); }}
            onDragLeave={() => setHover(h => h === key ? null : h)}
            onDrop={() => onDrop(key)}
          >
            <div className="col-head">
              <span className={'dot dot-' + col.tone}/>
              <span className="col-title">{col.title}</span>
              <span className="col-count">{col.cards.length}</span>
              <span className="spacer"/>
              <button className="icon-btn xs"><Plus size={14}/></button>
            </div>
            <div className="col-body">
              {col.cards.map(c => (
                <Card
                  key={c.id}
                  card={c}
                  dragging={drag?.id === c.id}
                  onDragStart={setDrag}
                  onDragEnd={() => setDrag(null)}
                />
              ))}
              <button className="col-add"><Plus size={13}/> Add card</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.Board = Board;
