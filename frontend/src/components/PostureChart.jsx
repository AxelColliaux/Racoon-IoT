import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MAX_POINTS = 60;

export function PostureChart({ history }) {
  const data = history.slice(-MAX_POINTS).map((p, i) => ({
    index: i,
    forward: p.tiltForward ?? 0,
    lateral: p.tiltLateral ?? 0,
  }));

  if (data.length < 2) {
    return (
      <div className="posture-chart">
        <h3>Évolution des angles</h3>
        <p className="chart-placeholder">Données insuffisantes pour le graphique</p>
      </div>
    );
  }

  return (
    <div className="posture-chart">
      <h3>Évolution des angles (°)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" hide />
          <YAxis domain={[-50, 50]} />
          <Tooltip formatter={(v) => v?.toFixed(1)} />
          <Line type="monotone" dataKey="forward" stroke="#2563eb" name="Incl. avant" dot={false} />
          <Line type="monotone" dataKey="lateral" stroke="#16a34a" name="Latérale" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
