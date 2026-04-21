// Knowledge graph — stylized, not a real force layout
const Graph = () => {
  // Positioned nodes — hand-placed to read well
  const nodes = [
    { id: 'quiet', x: 460, y: 260, r: 32, label: 'On quiet tools', hub: true },
    { id: 'paint', x: 260, y: 180, r: 18, label: 'Paint palette' },
    { id: 'week',  x: 640, y: 170, r: 22, label: 'Weekly review' },
    { id: 'lamy',  x: 340, y: 370, r: 14, label: 'Lamy' },
    { id: 'reno',  x: 200, y: 300, r: 24, label: 'Home reno', proj: true },
    { id: 'lisb',  x: 720, y: 320, r: 24, label: 'Lisbon', proj: true },
    { id: 'wed',   x: 560, y: 420, r: 22, label: 'Wedding', proj: true },
    { id: 'books', x: 700, y: 100, r: 16, label: 'Books 2026' },
    { id: 'rev',   x: 860, y: 220, r: 14, label: 'Monthly' },
    { id: 'walk',  x: 420, y: 120, r: 12, label: 'Why we walk' },
    { id: 'type',  x: 520, y: 540, r: 14, label: 'On type' },
    { id: 'food',  x: 830, y: 400, r: 12, label: 'Tapas list' },
  ];
  const edges = [
    ['quiet','paint'],['quiet','week'],['quiet','lamy'],['quiet','type'],['quiet','walk'],
    ['reno','paint'],['reno','quiet'],
    ['lisb','week'],['lisb','food'],
    ['wed','week'],['week','rev'],['week','books'],
    ['books','quiet'],
  ];
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <div className="graph-root">
      <div className="graph-head">
        <div>
          <div className="eyebrow">knowledge · 128 notes</div>
          <h1 className="board-title">Graph</h1>
        </div>
        <div className="graph-ctrls">
          <button className="seg"><span className="seg-cur">All</span><span>Project</span><span>Recent</span></button>
        </div>
      </div>
      <div className="graph-canvas">
        <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" className="graph-svg">
          <defs>
            <radialGradient id="hub" cx="38%" cy="32%" r="72%">
              <stop offset="0%" stopColor="#B9C1FB"/>
              <stop offset="55%" stopColor="#6B78EF"/>
              <stop offset="100%" stopColor="#3B48C9"/>
            </radialGradient>
          </defs>
          {edges.map(([a,b], i) => {
            const A = byId[a], B = byId[b];
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="graph-edge"/>;
          })}
          {nodes.map(n => (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              <circle r={n.r} className={'graph-node' + (n.hub ? ' hub' : n.proj ? ' proj' : '')} fill={n.hub ? 'url(#hub)' : undefined}/>
              <text y={n.r + 16} className="graph-label" textAnchor="middle">{n.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

window.Graph = Graph;
