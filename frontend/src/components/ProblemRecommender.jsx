import { useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://tle-eleminators-backend.vercel.app";

const difficultyColor = (rating) => {
  if (rating < 1200) return "text-gray-400";
  if (rating < 1600) return "text-green-400";
  if (rating < 2000) return "text-blue-400";
  if (rating < 2400) return "text-yellow-400";
  return "text-red-400";
};

export default function ProblemRecommender({ handle }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    if (!handle) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/ai/recommend/${handle}`
      );

      setProblems(res.data.recommendations || []);
      setFetched(true);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white text-lg font-semibold">
            🎯 Recommended Problems
          </h3>
          <p className="text-gray-400 text-sm">
            Handpicked by AI based on your weak areas
          </p>
        </div>

        {!fetched ? (
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {loading ? "Finding..." : "Get Problems"}
          </button>
        ) : (
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            {loading ? "..." : "↻ Refresh"}
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && fetched && problems.length > 0 && (
        <div className="space-y-3">
          {problems.map((p, i) => {
            const url = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;

            return (
              <div
                key={i}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-purple-500 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white font-medium hover:text-purple-400 transition"
                      >
                        {p.name}
                      </a>

                      <span
                        className={`text-sm font-semibold ${difficultyColor(
                          p.rating
                        )}`}
                      >
                        {p.rating}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {(p.tags || []).map((tag, j) => (
                        <span
                          key={j}
                          className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p className="text-gray-400 text-sm italic">
                      💡 {p.reason}
                    </p>
                  </div>

                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm whitespace-nowrap"
                  >
                    Solve →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && fetched && problems.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">
          No recommendations available.
        </p>
      )}

      {!loading && !fetched && (
        <p className="text-gray-500 text-sm text-center py-6">
          Click "Get Problems" to receive your personalized problem set.
        </p>
      )}
    </div>
  );
}