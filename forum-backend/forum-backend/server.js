const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/forum');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const userSchema = new mongoose.Schema({ username: String, password: String });
const postSchema = new mongoose.Schema({
  author: String,
  content: String,
  images: [String],
  videos: [String],
  likes: [String],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now }
});
const commentSchema = new mongoose.Schema({
  postId: mongoose.Schema.Types.ObjectId,
  author: String,
  content: String,
  images: [String],
  videos: [String],
  likes: [String],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);

const SECRET =  process.env.JWT_SECRET || 'forumsecret';

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'Username exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash });
  await user.save();
  res.json({ message: 'Registered successfully' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ username }, SECRET);
  res.json({ token });
});

function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).end();
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(403).end();
  }
}

app.post('/posts', auth, upload.fields([{ name: 'images' }, { name: 'videos' }]), async (req, res) => {
  const { content } = req.body;
  const images = (req.files['images'] || []).map(f => f.path);
  const videos = (req.files['videos'] || []).map(f => f.path);
  const post = new Post({ author: req.user.username, content, images, videos, likes: [] });
  await post.save();
  res.json(post);
});

app.get('/posts', async (req, res) => {
  const posts = await Post.find().populate('comments').sort({ createdAt: -1 });
  res.json(posts);
});

app.post('/posts/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post.likes.includes(req.user.username)) post.likes.push(req.user.username);
  await post.save();
  res.json(post);
});

app.post('/posts/:id/comment', auth, upload.fields([{ name: 'images' }, { name: 'videos' }]), async (req, res) => {
  const { content } = req.body;
  const images = (req.files['images'] || []).map(f => f.path);
  const videos = (req.files['videos'] || []).map(f => f.path);
  const comment = new Comment({ postId: req.params.id, author: req.user.username, content, images, videos, likes: [] });
  await comment.save();
  await Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } });
  res.json(comment);
});

app.get('/posts/:id/likes', async (req, res) => {
  const post = await Post.findById(req.params.id);
  res.json(post.likes);
});

app.get('/posts/:id/comments', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('comments');
  res.json(post.comments);
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
