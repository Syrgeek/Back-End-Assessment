const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../NotesApi'); // Assuming your main server file is named server.js
const User = require('../models/User');
const Note = require('../models/Note');
require('dotenv').config();

let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await User.deleteMany({});
  await Note.deleteMany({});

  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'testuser@example.com', password: 'password123' });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testuser@example.com', password: 'password123' });

  token = loginRes.body.token;
});

describe('Notes API Endpoints', () => {
  let noteId;

  it('should create a new note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Note', content: 'This is a test note' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Note');
    noteId = res.body._id;
  });

  it('should retrieve all notes', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should retrieve a specific note by ID', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(noteId);
  });

  it('should update a note', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Note', content: 'Updated content' });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Note');
  });

  it('should delete a note', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
