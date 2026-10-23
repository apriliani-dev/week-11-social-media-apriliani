import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface Author {
  id: number;
  name: string;
  username: string;
  avatarUrl: string | null;
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

function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [profileUser, setProfileUser] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get(`/api/users/${username}/posts`);
        let postsData = response.data;
        if (postsData?.data?.posts) postsData = postsData.data.posts;
        else if (postsData?.data) postsData = postsData.data;

        if (Array.isArray(postsData) && postsData.length > 0) {
          setPosts(postsData);
          setProfileUser(postsData[0].author);
        }
      } catch {
        console.error('Error fetching posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [username]);

  const handleLikePost = async (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 } : p));
    try { await api.post(`/api/posts/${postId}/like`); }
    catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount + 1 : p.likeCount - 1 } : p));
    }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/api/follow/${username}`);
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
    } catch {
      console.error('Error following user');
      alert('Gagal follow/unfollow user');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!profileUser) return <div className="min-h-screen flex items-center justify-center">User tidak ditemukan</div>;

  const isOwnProfile = currentUser?.username === profileUser.username;

   return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800">← Kembali</button>
          <h1 className="text-xl font-bold">Profile</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profileUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profileUser.name}</h2>
                <p className="text-gray-600">@{profileUser.username}</p>
              </div>
            </div>
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-md font-medium ${
                  isFollowing
                    ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-sm text-gray-600">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{followerCount}</p>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Posts</h3>
        {posts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center"><p className="text-gray-600">Belum ada posting</p></div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-lg shadow">
                {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full rounded-lg mb-3 max-h-96 object-cover" />}
                <p className="text-gray-800 mb-3">{post.caption}</p>
                <div className="flex gap-6 text-sm">
                  <button onClick={() => handleLikePost(post.id)} className={`flex items-center gap-1 ${post.likedByMe ? 'text-red-600 font-semibold' : 'text-gray-600 hover:text-red-600'}`}>
                    <span>{post.likedByMe ? '❤️' : '🤍'}</span>
                    <span>{post.likeCount || 0} Likes</span>
                  </button>
                  <span className="text-gray-600">💬 {post.commentCount || 0} Comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage; 