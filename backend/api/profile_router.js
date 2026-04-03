import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import {Student} from '../db/index.js';
import { fetchCodeforcesUserData } from './utils/fetch_data.js';
import axios from "axios";
import {
  getCoachInsights,
  getRecommendedProblems,
} from './utils/ai_services.js'


const apiRouter = express.Router();
apiRouter.use(express.json());

let problemPoolCache = null;

export const getProblemPool = async () => {
  try {

    if (problemPoolCache) {
      return problemPoolCache;
    }

    const res = await fetch("https://codeforces.com/api/problemset.problems");

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const problems = await res.json();

    problemPoolCache = problems;

    // refresh cache every 1 hour
    setTimeout(() => {
      problemPoolCache = null;
    }, 3600000);

    return problems;

  } catch (error) {

    console.error("Failed to fetch Codeforces problem pool:", error.message);

    throw new Error("Problem pool fetch failed");
  }
};

apiRouter.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    if(!students){
      return res.status(404).json({ error: 'No students found' });
    }
    res.json({success: true, data: students});
  } catch (error) {
    res.status(500).json({success: false, error: 'Failed to fetch students' });
  }
});
apiRouter.post('/students', async (req, res) => {
  try {
    const codeforces_handle = req.body.codeforces_handle;
    if (!req.body.name || !req.body.codeforces_handle) {
      return res.status(400).json({success: false, error: 'Name and Codeforces handle are required' });
    }
    const obj = await fetchCodeforcesUserData(codeforces_handle);
    if (!obj.exists) {
      return res.status(404).json({success: false, error: 'Codeforces user not found' });
    }
    if (await Student.findOne({ codeforces_handle })) {
      return res.status(400).json({success: false, error: 'Student with this Codeforces handle already exists' });
    }
    // Create and save the student
    const student = new Student({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        codeforces_handle: codeforces_handle,
        current_rating: obj.currentRating,
        max_rating: obj.maxRating,
        ratingHistory: obj.ratingHistory,
        submissions: obj.submissions,
        last_updated: new Date(),
        email_reminders_sent: 0,
        email_reminders_disabled: false,
        created_at: new Date(),
        updated_at: new Date()
    });
    await student.save();
    res.status(201).json({success: true, data: student});
  } catch (error) {
    res.status(400).json({success: false, error: 'Failed to create student' });
  }
});
apiRouter.put('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) {
      return res.status(404).json({success: false, error: 'Student not found' });
    }
    student.last_updated = new Date();
    res.json(student);
  } catch (error) {
    res.status(400).json({success: false, error: 'Failed to update student' });
  }
}
);
apiRouter.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({success: false, error: 'Student not found' });
    }
    console.log(`Deleted student with ID: ${req.params.id}`);
    res.json({success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({success: false, error: 'Failed to delete student' });
  }
});
apiRouter.get('/students/:handle', async (req, res) => {
  try {
    const student = await Student.findOne({codeforces_handle: req.params.handle});

    if (!student) {
      return res.status(404).json({success: false, error: 'Student not found in database' });
    }
    res.json({message: 'Student data fetched successfully', data: student});
  } catch (error) {
    res.status(500).json({success: false, error: 'Failed to fetch student' });
  }
});


// Coach Insights
apiRouter.get("/ai/coach/:handle", async (req, res) => {
  console.log("Insights route hit", req.params.handle);
  try {
    const student = await Student.findOne({
      codeforces_handle: req.params.handle,
    });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const insights = await getCoachInsights(student);
    res.json({ success: true, insights });
  } catch (err) {
    console.error("Coach AI error:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// Problem Recommender
apiRouter.get("/ai/recommend/:handle", async (req, res) => {
  
  try {
    const student = await Student.findOne({
      codeforces_handle: req.params.handle,
    });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const problemPool = await getProblemPool();
    const recommendations = await getRecommendedProblems(student, problemPool);
    res.json({ success: true, recommendations });
  } catch (err) {
    console.error("Recommender AI error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});
apiRouter.get("/ai/list-models", async (req, res) => {
  console.log("KEY LOADED:", process.env.GEMINI_API_KEY?.slice(0, 10));
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );
  const data = await response.json();
  res.json(data);
});
apiRouter.get('/health', (req, res) => {
  res.send('Hello from the backend API!');
});

export default apiRouter;