import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API_BASE = 'https://tle-eleminators-backend.vercel.app/';

const Settings = () => {
  const { isDark } = useTheme();
  const [cronTime, setCronTime] = useState('02:00');
  const [cronFrequency, setCronFrequency] = useState('daily');
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    inactivityDays: 7
  });

  const handleSaveSettings = async () => {
    try {
      await axios.post(`${API_BASE}/api/settings/set`, {
        cronTime,
        cronFrequency,
        emailRemindersEnabled: emailSettings.enabled,
        inactivityDays: emailSettings.inactivityDays
      });
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings', error);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h2>

      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Data Sync Settings</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Sync Time</label>
            <input
              type="time"
              value={cronTime}
              onChange={(e) => setCronTime(e.target.value)}
              className={`px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Sync Frequency</label>
            <select
              value={cronFrequency}
              onChange={(e) => setCronFrequency(e.target.value)}
              className={`px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Reminder Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailEnabled"
              checked={emailSettings.enabled}
              onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="emailEnabled" className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Enable automatic email reminders
            </label>
          </div>
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Send reminder after (days of inactivity)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={emailSettings.inactivityDays}
              onChange={(e) => setEmailSettings({ ...emailSettings, inactivityDays: parseInt(e.target.value) })}
              className={`px-3 py-2 border rounded-md ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
