import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://tle-eleminators-backend.vercel.app"; // change if backend runs elsewhere

const priorityConfig = {
  high: { color: "text-red-400", bg: "bg-red-400/10", badge: "bg-red-500" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-400/10", badge: "bg-yellow-500" },
  low: { color: "text-green-400", bg: "bg-green-400/10", badge: "bg-green-500" },
};

export default function CoachInsights({ handle }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    if (!handle) return;

    setLoading(true);
    setError(null);

    try {
        console.log(`coach ingsight url is: ${BACKEND_URL}/api/students/ai/recommend/${handle}`)

      const res = await axios.get(
        `${BACKEND_URL}/api/ai/coach/${handle}`
      );

      setInsights(res.data.insights || []);
      setFetched(true);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError("Failed to generate insights. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white text-lg font-semibold">🧠 AI Coach Insights</h3>
          <p className="text-gray-400 text-sm">
            Personalized analysis of your performance
          </p>
        </div>

        {!fetched ? (
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {loading ? "Analyzing..." : "Get Insights"}
          </button>
        ) : (
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            {loading ? "..." : "↻ Refresh"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && fetched && insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((item, i) => {
            const config = priorityConfig[item.priority] || priorityConfig.low;

            return (
              <div
                key={i}
                className={`${config.bg} rounded-lg p-4 border border-gray-700`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full text-white ${config.badge}`}
                  >
                    {item.priority}
                  </span>
                  <span
                    className={`font-semibold text-sm ${config.color}`}
                  >
                    {item.title}
                  </span>
                </div>

                <p className="text-gray-300 text-sm">{item.insight}</p>
              </div>
            );
          })}
        </div>
      )}

      {!loading && fetched && insights.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">
          No insights generated yet.
        </p>
      )}

      {!loading && !fetched && (
        <p className="text-gray-500 text-sm text-center py-6">
          Click "Get Insights" to generate your personalized coaching report.
        </p>
      )}
    </div>
  );
}