import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import studentData from '../api/student_data';
import RatingChart from '../components/RatingChart';
import ProblemStats from '../components/ProblemStats';
import { Mail, Clock } from 'lucide-react';
import CoachInsights from "../components/CoachInsights";
import ProblemRecommender from "../components/ProblemRecommender";

import axios from 'axios';

const API_BASE = 'https://tle-eleminators-backend.vercel.app/';

const Profile = () => {
  const { isDark } = useTheme();
  const { handle } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('contests');
  const [contestFilter, setContestFilter] = useState(30);
  const [problemFilter, setProblemFilter] = useState(30);
  const [contests, setContests] = useState([]);
  const [problemStats, setProblemStats] = useState(null);
  const [loading, setLoading] = useState(true);
// console.log('Profile component rendered with handle:', handle);
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        if (!handle) {
          console.error('No handle provided in URL parameters');
          return;
        }
        console.log('Fetching student data for handle:', handle);
        const res = await axios.get(`${API_BASE}/api/students/${handle}`);

        const data = res.data.data;
        setStudent(data);
      } catch (e) {
        console.error('Failed to load student', e);
      }
    };
    fetchStudent();
  }, []);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    Promise.all([
      studentData.getContestHistory(student.codeforces_handle, contestFilter),
      studentData.getProblemStats(student.codeforces_handle, problemFilter)
    ])
      .then(([contestData, statsData]) => {
        setContests(contestData);
        setProblemStats(statsData);
      })
      .finally(() => setLoading(false));
  }, [student, contestFilter, problemFilter]);

  if (!student || loading) {
    return <div className="flex items-center justify-center h-64 text-lg">Loading student data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            ← Back to Students
          </button>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{student.name}</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {student.codeforces_handle} • Current: {student.current_rating} • Max: {student.max_rating}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Reminders sent: {student.email_reminders_sent}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Updated: {new Date(student.last_updated).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('contests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contests'
              ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Contest History
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'problems'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Problem Solving
          </button>
        </nav>
      </div>

      {activeTab === 'contests' && (
        <>
          <div className="flex items-center space-x-4">
            <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Filter by:</label>
            <select
              value={contestFilter}
              onChange={(e) => setContestFilter(Number(e.target.value))}
              className={`px-3 py-1 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </div>
          <RatingChart contests={contests} />
        </>
      )}

      {activeTab === 'problems' && (
        <>
          <div className="flex items-center space-x-4">
            <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Filter by:</label>
            <select
              value={problemFilter}
              onChange={(e) => setProblemFilter(Number(e.target.value))}
              className={`px-3 py-1 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          {problemStats && <ProblemStats stats={problemStats} />}
        </>
      )}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Contests
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Contest
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Rank
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Rating Change
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Unsolved
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {contests.map((contest) => (
                    <tr key={contest.id}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {contest.contest_name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {new Date(contest.date).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        #{contest.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          contest.rating_change >= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {contest.rating_change >= 0 ? '+' : ''}{contest.rating_change}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {contest.problems_unsolved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <CoachInsights handle={student.codeforces_handle} />
          <ProblemRecommender handle={student.codeforces_handle} />
    </div>
  );
};

export default Profile;
