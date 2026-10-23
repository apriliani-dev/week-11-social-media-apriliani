import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

     console.log('Full response:', JSON.stringify(response.data, null, 2));

// Handle berbagai format response API
const data = response.data;
let user, token;

// Coba berbagai kemungkinan format
if (data.token && data.user) {
  token = data.token;
  user = data.user;
} else if (data.data?.token && data.data?.user) {
  token = data.data.token;
  user = data.data.user;
} else if (data.accessToken && data.user) {
  token = data.accessToken;
  user = data.user;
} else if (data.data?.accessToken && data.data?.user) {
  token = data.data.accessToken;
  user = data.data.user;
} else {
  // Fallback
  token = data.token || data.accessToken || data.data?.token || data.data?.accessToken || '';
  user = data.user || data.data?.user || data;
}

console.log('Extracted - User:', user);
console.log('Extracted - Token:', token);

if (token) {
  login(user, token);
  navigate('/');
} else {
  setError('Login berhasil tapi token tidak ditemukan.');
}

      navigate('/');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Login gagal.');
      } else {
        setError('Login gagal. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Login Sociality</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Belum punya akun?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;