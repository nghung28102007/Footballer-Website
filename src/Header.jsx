import React from 'react';
import { useAuth } from './AuthContext';

const headerStyle = {
  padding: '20px 40px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'rgba(30,60,114,0.8)',
  backdropFilter: 'blur(10px)',
};

const userBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const avatarStyle = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #00bcd4',
  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
};

const nameStyle = {
  color: 'white',
  fontWeight: 600,
  fontSize: 16,
  maxWidth: 180,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const logoutBtnStyle = {
  padding: '8px 18px',
  border: 'none',
  borderRadius: 20,
  background: 'linear-gradient(90deg, #00bcd4, #2a5298)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
  marginLeft: 8,
  transition: 'background 0.2s',
};

export default function Header() {
  const { currentUser, signOut } = useAuth();

  return (
    <header style={headerStyle}>
      <div style={{ fontWeight: 'bold', fontSize: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span role="img" aria-label="football">⚽</span> FootballPro
      </div>
      {currentUser && (
        <div style={userBoxStyle}>
          <img
            src={currentUser.photoURL || '/default-avatar.png'}
            alt="avatar"
            style={avatarStyle}
            onError={e => { e.target.src = '/default-avatar.png'; }}
          />
          <span style={nameStyle}>
            {currentUser.displayName || currentUser.email}
          </span>
          <button style={logoutBtnStyle} onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
} 