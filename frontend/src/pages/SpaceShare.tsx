import React, { useEffect, useState } from 'react';
import { useParams , useNavigate} from 'react-router-dom';
import api from '../api/api';

interface SpaceInfo {
    id: string;
    name: string;
    passwordNeeded: boolean;
}

function SpaceSharePage() {
    const navigate = useNavigate();
    const { shareSecret } = useParams();
    const [spaceInfo, setSpaceInfo] = useState<SpaceInfo | null>(null);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      api.get(`/shares/space/verify?shareSecret=${shareSecret}`)
        .then((res) => {
          setSpaceInfo(res.data);
          setNeedsPassword(res.data.passwordNeeded);
        })
        .catch(() => setError('Invalid or expired space share link.'))
        .finally(() => setIsLoading(false));
    }, [shareSecret]);
  
    if (isLoading) return <div>Loading…</div>;
    if (error) return <div>{error}</div>;
    if (!spaceInfo) {
        navigate('/login');
        return null;
    }
    // If no password needed, show space content
    if (!needsPassword) {
      return (
        <div>
          <h1>Welcome to {spaceInfo.name}</h1>
          {/* Possibly show a list of files, or redirect to some "space" page */}
          <button onClick={() => accessSpace(spaceInfo)}>Open Space</button>
        </div>
      );
    }
  
    // Otherwise, prompt for password
    return (
      <div>
        <h2>This space is password-protected</h2>
        <input 
          type="password" 
          placeholder="Enter space password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={() => handleProtectedAccess(spaceInfo.id, password)}>
          Access
        </button>
      </div>
    );
  }
  
  async function accessSpace(spaceInfo) {
    try {
      const response = await api.get(`/shares/space/${spaceInfo.id}/access`);
      // Maybe show list of files in the space
    } catch (err) {
      alert('Failed to open space.');
    }
  }
  
  async function handleProtectedAccess(spaceId, password) {
    try {
      const response = await api.post(`/shares/space/${spaceId}/access`, {
        password,
      });
      // Show the space's contents
    } catch (err) {
      alert('Invalid password.');
    }
  }
  
    export default SpaceSharePage;