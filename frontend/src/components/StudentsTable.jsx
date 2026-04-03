import React from 'react';
import { Plus, Edit2, Trash2, Eye, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API_BASE = 'https://tle-eleminators-backend.vercel.app/';

const StudentsTable = ({ students, onAdd, onEdit, onDelete, onViewDetails }) => {
  const { isDark } = useTheme();

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Codeforces Handle', 'Current Rating', 'Max Rating', 'Last Updated'],
      ...students.map(student => [
        student.name,
        student.email,
        student.phone,
        student.codeforces_handle,
        student.current_rating,
        student.max_rating,
        new Date(student.last_updated).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Students ({students.length})
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onAdd}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              {["Name", "Email", "Phone", "CF Handle", "Current Rating", "Max Rating", "Last Updated", "Actions"].map(header => (
                <th
                  key={header}
                  className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {students.map((student) => (
              <tr key={student._id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{student.name}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{student.email}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{student.phone}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{student.codeforces_handle}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{student.current_rating}</span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{student.max_rating}</span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{new Date(student.last_updated).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button onClick={() => onViewDetails(student)} className="text-blue-600 hover:text-blue-900 p-1" title="View Details">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => onEdit(student)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        await axios.delete(`${API_BASE}/api/students/${student._id}`);
                        onDelete(student._id);
                      }}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;
