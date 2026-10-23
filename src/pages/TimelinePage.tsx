import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface Author {
  id: number;
  name: string;
  username: string;
  avatarUrl: string | null;
}

interface Comment {
  id: number;
  text: string;
  author: Author;
  createdAt: string;
}

interface Post {
  id: number;
  caption: string;
  imageUrl: string | null;
  author: Author;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

function TimelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [commentsData, setCommentsData] = useState<Record<number, Comment[]>>({});
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<Array<{id: number; name: string; username: string; avatarUrl: string | null}>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    try {
      const response = await api.get('/api/posts');
      let postsData = response.data;
      if (postsData?.data?.posts) postsData = postsData.data.posts;
      else if (postsData?.data) postsData = postsData.data;
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
  }, [navigate, fetchPosts]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('Max 5MB!'); return; }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) { alert('Pilih gambar!'); return; }
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (newPost.trim()) formData.append('caption', newPost);
      await api.post('/api/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewPost(''); setSelectedImage(null); setImagePreview('');
      fetchPosts();
    } catch (err) { console.error(err); alert('Gagal membuat post'); }
  };

  const handleLikePost = async (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 } : p));
    try { await api.post(`/api/posts/${postId}/like`); }
    catch (err) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount + 1 : p.likeCount - 1 } : p));
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Yakin hapus post ini?')) return;
    try { await api.delete(`/api/posts/${postId}`); fetchPosts(); }
    catch (err) { console.error(err); alert('Gagal hapus post'); }
  };

  const fetchComments = async (postId: number) => {
    try {
      const response = await api.get(`/api/posts/${postId}/comments`);
      let comments = response.data;
      if (comments?.data?.comments) comments = comments.data.comments;
      else if (comments?.data) comments = comments.data;
      if (Array.isArray(comments)) setCommentsData(prev => ({ ...prev, [postId]: comments }));
    } catch (err) { console.error(err); }
  };

  const handleToggleComments = async (postId: number) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!showComments[postId] && !commentsData[postId]) await fetchComments(postId);
  };

  const handleAddComment = async (postId: number) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    try {
      await api.post(`/api/posts/${postId}/comments`, { text });
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      await fetchComments(postId);
    } catch (err) { console.error(err); alert('Gagal tambah komentar'); }
  };
    const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }
    setSearching(true);
    try {
      const response = await api.get(`/api/users/search?q=${searchQuery}`);
      let users = response.data;
      if (users?.data?.users) users = users.data.users;
      else if (users?.data) users = users.data;
      setSearchResults(Array.isArray(users) ? users : []);
      setShowSearchResults(true);
    } catch {
      console.error('Error searching users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

    return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
  <div className="max-w-2xl mx-auto px-4 py-4">
    <div className="flex justify-between items-center mb-3">
      <h1 className="text-2xl font-bold">Sociality</h1>
      <div className="flex items-center gap-4">
        <span className="text-gray-700">Halo, {user?.name || 'User'}!</span>
        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Logout</button>
      </div>
    </div>
    <div className="flex gap-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Cari user by username..."
        className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSearch}
        disabled={searching}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400"
      >
        {searching ? 'Mencari...' : 'Cari'}
      </button>
      {showSearchResults && (
        <button
          onClick={() => setShowSearchResults(false)}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400"
        >
          Tutup
        </button>
      )}
    </div>
  </div>
</header>

      <main className="max-w-2xl mx-auto px-4 py-6">
                {showSearchResults && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-3">Hasil Pencarian: "{searchQuery}"</h2>
            {searchResults.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Tidak ada user ditemukan</p>
            ) : (
              <div className="space-y-2">
  {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => navigate(`/profile/${result.username}`)}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {(result.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{result.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">@{result.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Apa yang kamu pikirkan?" className="w-full p-3 border border-gray-300 rounded-md" rows={3} />
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Gambar (JPG/PNG/WEBP, max 5MB)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="w-full text-sm" />
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 max-h-48 rounded-lg object-cover" />}
            </div>
            <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Posting</button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center"><p className="text-gray-600">Belum ada posting.</p></div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">{(post.author?.name || 'U').charAt(0).toUpperCase()}</div>
                    <div className="ml-3">
                      <p className="font-semibold cursor-pointer hover:text-blue-600" onClick={() => navigate(`/profile/${post.author?.username}`)}>{post.author?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/profile/${post.author?.username}`)}>@{post.author?.username || 'user'}</p>
                    </div>
                  </div>
                  {post.author?.username === user?.username && (
                    <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Hapus</button>
                  )}
                </div>
                {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full rounded-lg mb-3 max-h-96 object-cover" />}
                <p className="text-gray-800 mb-3">{post.caption}</p>
                <div className="flex gap-6 text-sm">
                  <button onClick={() => handleLikePost(post.id)} className={`flex items-center gap-1 ${post.likedByMe ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-red-600'}`}>
                    <span>{post.likedByMe ? '❤️' : '🤍'}</span>
                    <span>{post.likeCount || 0} Likes</span>
                  </button>
                  <button onClick={() => handleToggleComments(post.id)} className="text-gray-600 flex items-center gap-1 hover:text-blue-600">
                    💬 {post.commentCount || 0} Comments
                  </button>
                </div>
                {showComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      {commentsData[post.id]?.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-2 rounded">
                          <p className="font-semibold cursor-pointer hover:text-blue-600" onClick={() => navigate(`/profile/${post.author?.username}`)}>{post.author?.name || 'Unknown'}</p>
<p className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/profile/${post.author?.username}`)}>@{post.author?.username || 'user'}</p>
                        </div>
                      ))}
                      {(!commentsData[post.id] || commentsData[post.id].length === 0) && (
                        <p className="text-sm text-gray-500 text-center">Belum ada komentar</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={commentTexts[post.id] || ''} onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))} placeholder="Tulis komentar..." className="flex-1 p-2 border border-gray-300 rounded-md text-sm" onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)} />
                      <button onClick={() => handleAddComment(post.id)} className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">Kirim</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default TimelinePage;