import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API_BASE = 'https://tle-eleminators-backend.vercel.app';

console.log(API_BASE, ' is the base url')
const StudentForm = ({ student, onSubmit, onCancel }) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    codeforces_handle: student?.codeforces_handle || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!student) {
        try{
            await axios.post(`${API_BASE}/api/students`, formData);
            alert('Student added successfully');

        }catch (error) {
            alert('Error fetching Codeforces user data: ' + error.message);
            }
      } else {
        try{
            await axios.put(`${API_BASE}/api/students/${student._id}`, formData);
            alert('Student updated successfully');

        }catch (error) {
            alert('Error fetching Codeforces user data: ' + error.message);
        }
      }
      onSubmit(formData);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {['name', 'email', 'phone', 'codeforces_handle'].map((field) => (
        <div key={field}>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            {field.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
          </label>
          <input
            type={field === 'email' ? 'email' : 'text'}
            name={field}
            value={formData[field]}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
          />
        </div>
      ))}

      <div className="flex space-x-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          {student ? 'Update' : 'Add'} Student
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
