import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentsTable from '../components/StudentsTable';
import Modal from '../components/Modal';
import StudentForm from '../components/StudentForm';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://tle-eleminators-backend.vercel.app/';
console.log(API_BASE, ' is the base url');

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/students`);
      if (!res.data || !Array.isArray(res.data.data)) {
        throw new Error('Invalid data format received from API');
      }
      setStudents(res.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = () => {
    setShowAddModal(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  const handleSubmit = () => {
    fetchStudents();
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = () => {
    fetchStudents();
  };

  const handleViewDetails = (student) => {
    console.log('Viewing details for student:', student);
    navigate(`/profile/${student.codeforces_handle}`);
  };

  return (
    <>
      <StudentsTable
        students={students}
        onAdd={handleAddStudent}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        onViewDetails={handleViewDetails}
      />

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Student"
      >
        <StudentForm
          onSubmit={handleSubmit}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingStudent(null);
        }}
        title="Edit Student"
      >
        <StudentForm
          student={editingStudent}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowEditModal(false);
            setEditingStudent(null);
          }}
        />
      </Modal>
    </>
  );
};

export default Dashboard;
