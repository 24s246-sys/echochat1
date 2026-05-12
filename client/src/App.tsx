import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// API Base URL
const API_BASE = '/api';

// --- Components ---

// 1. Sidebar (Gallery List)
const Sidebar = () => {
  const [galleries, setGalleries] = useState<any[]>([]);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const res = await axios.get(`${API_BASE}/galleries`);
        setGalleries(res.data);
      } catch (err) {
        console.error('Failed to fetch galleries', err);
      }
    };
    fetchGalleries();
  }, []);

  return (
    <aside className="sidebar">
      <h3>주요 갤러리</h3>
      <ul>
        {galleries.map(g => (
          <li key={g.id}>
            <Link to={`/g/${g.slug}`}>{g.name}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

// 2. Gallery (Post List)
const Gallery = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const { slug = 'main' } = useParams();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/galleries/${slug}/posts`);
        setPosts(res.data);
      } catch (err) {
        console.error('Failed to fetch posts', err);
      }
    };
    fetchPosts();
  }, [slug]);

  return (
    <div className="main-content">
      <div className="gallery-header">
        <h2>{slug.toUpperCase()} 갤러리</h2>
        <Link to="/write" className="btn-write">글쓰기</Link>
      </div>
      <table className="post-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>번호</th>
            <th>제목</th>
            <th style={{ width: '120px' }}>글쓴이</th>
            <th style={{ width: '100px' }}>날짜</th>
            <th style={{ width: '60px' }}>조회</th>
            <th style={{ width: '60px' }}>추천</th>
          </tr>
        </thead>
        <tbody>
          {posts.length > 0 ? posts.map((post) => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td className="title">
                <Link to={`/post/${post.id}`}>
                  {post.title} {post.comment_count > 0 && <span className="comment-count">[{post.comment_count}]</span>}
                </Link>
              </td>
              <td className="author">{post.author_name}</td>
              <td className="date">{new Date(post.created_at).toLocaleDateString()}</td>
              <td>{post.views}</td>
              <td>{post.recommends}</td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="empty-msg">게시글이 없습니다.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// 3. Post Detail
const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentForm, setCommentForm] = useState({ author_name: '', password: '', content: '' });

  const fetchPost = async () => {
    try {
      const res = await axios.get(`${API_BASE}/posts/${id}`);
      setPost(res.data);
    } catch (err) {
      alert('게시글을 불러올 수 없습니다.');
      navigate('/');
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/posts/${id}/comments`);
      setComments(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const handleRecommend = async () => {
    try {
      await axios.post(`${API_BASE}/posts/${id}/recommend`);
      fetchPost();
    } catch (err) {
      alert('추천 실패');
    }
  };

  const handleDelete = async () => {
    const password = prompt('비밀번호를 입력하세요');
    if (!password) return;
    try {
      await axios.delete(`${API_BASE}/posts/${id}`, { data: { password } });
      alert('삭제되었습니다.');
      navigate('/');
    } catch (err) {
      alert('비밀번호가 틀렸거나 삭제에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/posts/${id}/comments`, commentForm);
      setCommentForm({ author_name: '', password: '', content: '' });
      fetchComments();
    } catch (err) {
      alert('댓글 작성 실패');
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    const password = prompt('댓글 비밀번호를 입력하세요');
    if (!password) return;
    try {
      await axios.delete(`${API_BASE}/comments/${commentId}`, { data: { password } });
      fetchComments();
    } catch (err) {
      alert('비밀번호가 틀렸거나 삭제에 실패했습니다.');
    }
  };

  if (!post) return <div className="main-content">로딩 중...</div>;

  return (
    <div className="main-content">
      <div className="post-view">
        <div className="post-view-header">
          <h3>{post.title}</h3>
          <div className="post-info">
            <span>{post.author_name}</span> | 
            <span>{new Date(post.created_at).toLocaleString()}</span> | 
            <span>조회 {post.views}</span> | 
            <span>추천 {post.recommends}</span>
          </div>
        </div>
        <div className="post-view-content">
          {post.content.split('\n').map((line: string, i: number) => <p key={i}>{line}</p>)}
        </div>
        <div className="post-view-footer">
          <button onClick={handleRecommend} className="btn-recommend">추천 {post.recommends}</button>
          <button onClick={handleDelete} className="btn-delete">삭제</button>
        </div>
      </div>

      <div className="comment-section">
        <h4>댓글 {comments.length}</h4>
        <ul className="comment-list">
          {comments.map(c => (
            <li key={c.id}>
              <div className="comment-info">
                <strong>{c.author_name}</strong>
                <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
                <button onClick={() => handleCommentDelete(c.id)} className="btn-comment-del">X</button>
              </div>
              <p>{c.content}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <div className="comment-form-top">
            <input 
              placeholder="닉네임" 
              value={commentForm.author_name}
              onChange={e => setCommentForm({...commentForm, author_name: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="비밀번호" 
              value={commentForm.password}
              onChange={e => setCommentForm({...commentForm, password: e.target.value})} 
              required 
            />
          </div>
          <div className="comment-form-bottom">
            <textarea 
              placeholder="댓글을 입력하세요" 
              value={commentForm.content}
              onChange={e => setCommentForm({...commentForm, content: e.target.value})} 
              required 
            />
            <button type="submit">등록</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. Write Post
const Write = () => {
  const [form, setForm] = useState({ title: '', content: '', author_name: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/posts`, {
        ...form,
        gallery_id: 1, // Default to Main Gallery
        author_ip: '127.0.0.1' 
      });
      navigate('/');
    } catch (err) {
      alert('글 작성 실패');
    }
  };

  return (
    <div className="main-content">
      <h2>게시글 작성</h2>
      <form onSubmit={handleSubmit} className="write-form">
        <div className="write-form-row">
          <input 
            placeholder="닉네임" 
            onChange={e => setForm({...form, author_name: e.target.value})} 
            required 
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            onChange={e => setForm({...form, password: e.target.value})} 
            required 
          />
        </div>
        <input 
          placeholder="제목을 입력하세요" 
          className="write-title"
          onChange={e => setForm({...form, title: e.target.value})} 
          required 
        />
        <textarea 
          placeholder="내용을 입력하세요" 
          className="write-content"
          onChange={e => setForm({...form, content: e.target.value})} 
          required 
        />
        <div className="write-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-cancel">취소</button>
          <button type="submit" className="btn-submit">등록</button>
        </div>
      </form>
    </div>
  );
};

// Main App Layout
function App() {
  return (
    <Router>
      <div className="container">
        <header className="header">
          <div className="header-inner">
            <h1><Link to="/">ECHOACHAT</Link></h1>
            <div className="header-links">로그인 | 회원가입 | 갤로그</div>
          </div>
        </header>
        
        <div className="content-wrapper">
          <Sidebar />
          <main className="main">
            <Routes>
              <Route path="/" element={<Gallery />} />
              <Route path="/g/:slug" element={<Gallery />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/write" element={<Write />} />
            </Routes>
          </main>
        </div>
        
        <footer className="footer">
          <p>© 2024 ECHOACHAT. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
