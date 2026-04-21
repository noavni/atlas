// Kanban Card — resting, hover, dragging
const Card = ({ card, onDragStart, onDragEnd, dragging, ghost }) => {
  const { More, Link } = window.Icons;
  return (
    <div
      className={'kc' + (dragging ? ' dragging' : '') + (ghost ? ' ghost' : '')}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart?.(card); }}
      onDragEnd={() => onDragEnd?.()}
    >
      {card.tag && <div className={'kc-tag kc-tag-' + card.tag.tone}>{card.tag.label}</div>}
      <div className="kc-title">{card.title}</div>
      {card.body && <div className="kc-body">{card.body}</div>}
      {card.cover && <div className="kc-cover" style={{background: card.cover}}/>}
      <div className="kc-meta">
        <div className="kc-meta-l">
          {card.date && <span>{card.date}</span>}
          {card.links > 0 && <span className="kc-link"><Link size={11}/>{card.links}</span>}
        </div>
        <div className="kc-avs">
          {(card.avatars || []).map((a, i) => (
            <span key={i} className="av xs" style={{background: a.c}}>{a.l}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

window.Card = Card;
