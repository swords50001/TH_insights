import React from 'react';

export function Profile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px', color: '#111827' }}>
        Profile
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px', 
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            Email
          </label>
          <div style={{ fontSize: '16px', color: '#111827' }}>
            {user.email || 'Not available'}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            Role
          </label>
          <div style={{ fontSize: '16px', color: '#111827' }}>
            {user.role || 'Not available'}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            Tenant
          </label>
          <div style={{ fontSize: '16px', color: '#111827' }}>
            {user.tenant_id || 'Not available'}
          </div>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Profile information is currently read-only. Contact your administrator to make changes.
          </p>
        </div>
      </div>
    </div>
  );
}
