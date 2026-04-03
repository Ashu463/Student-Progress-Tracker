import axios from 'axios';

function generateHeatmapFromSubmissions(submissions, days = 365) {
  const heatmap = {};
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  submissions.forEach(sub => {
    if (sub.verdict !== 'OK') return;
    const subDate = new Date(sub.creationTimeSeconds * 1000);
    if (subDate.getTime() < cutoff) return;

    const dateStr = subDate.toISOString().split('T')[0];
    heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
  });

  return Object.entries(heatmap).map(([date, count]) => ({ date, count }));
}

const studentData = {
  async getContestHistory(cf_handle, days) {
    try {
      const response = await axios.get(`http://localhost:3000/api/students/${cf_handle}`);
      console.log('Response from API:', response.data);
      const ratingHistory = response.data.data.ratingHistory;
      const now = Date.now();
      const cutoff = now - days * 24 * 60 * 60 * 1000;

      const filtered = ratingHistory.filter(entry => {
        const contestTime = entry.ratingUpdateTimeSeconds * 1000;
        return contestTime >= cutoff;
      });


      return filtered.map((entry, index) => ({
        id: index + 1,
        contest_name: entry.contestName,
        date: new Date(entry.ratingUpdateTimeSeconds * 1000).toISOString(),
        rank: entry.rank,
        rating_change: entry.newRating - entry.oldRating,
        problems_unsolved: Math.floor(Math.random() * 4),
        old_rating: entry.oldRating,
        new_rating: entry.newRating
      }));
    } catch (error) {
      console.error('Failed to fetch contest history:', error);
      return [];
    }
  },

  async getProblemStats(cf_handle, days) {
    try {
      const response = await axios.get(`http://localhost:3000/api/students/${cf_handle}`);
      const ratingHistory = response.data.data.ratingHistory;
      const submissions = response.data.data.submissions;

      const now = Date.now();
      const cutoff = now - days * 24 * 60 * 60 * 1000;

      const filtered = ratingHistory.filter(entry => {
        const contestTime = entry.ratingUpdateTimeSeconds * 1000;
        return contestTime >= cutoff;
      });

      const ratingBuckets = {
        "800-900": 0,
        "900-1000": 0,
        "1000-1100": 0,
        "1100-1200": 0,
        "1200-1300": 0,
        "1300-1400": 0
      };

      let totalProblems = 0;
      let totalRating = 0;
      let mostDifficult = 0;

      for (const entry of filtered) {
        const rating = entry.newRating;
        totalProblems++;
        totalRating += rating;
        mostDifficult = Math.max(mostDifficult, rating);

        if (rating >= 800 && rating < 900) ratingBuckets["800-900"]++;
        else if (rating >= 900 && rating < 1000) ratingBuckets["900-1000"]++;
        else if (rating >= 1000 && rating < 1100) ratingBuckets["1000-1100"]++;
        else if (rating >= 1100 && rating < 1200) ratingBuckets["1100-1200"]++;
        else if (rating >= 1200 && rating < 1300) ratingBuckets["1200-1300"]++;
        else if (rating >= 1300 && rating < 1400) ratingBuckets["1300-1400"]++;
      }

      const averageRating = totalProblems > 0 ? Math.round(totalRating / totalProblems) : 0;
      const averagePerDay = +(totalProblems / days).toFixed(1);

      return {
        most_difficult_rating: mostDifficult,
        total_problems: totalProblems,
        average_rating: averageRating,
        average_per_day: averagePerDay,
        rating_buckets: ratingBuckets,
        heatmap_data: generateHeatmapFromSubmissions(submissions, days)
      };

    } catch (error) {
      console.error('Failed to fetch problem stats:', error);
      return {
        most_difficult_rating: 0,
        total_problems: 0,
        average_rating: 0,
        average_per_day: 0,
        rating_buckets: {},
        heatmap_data: []
      };
    }
  }
};

export default studentData;
