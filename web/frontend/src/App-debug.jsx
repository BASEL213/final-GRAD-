import React from 'react';

function AppDebug() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#007bff', marginBottom: '20px' }}>
          🏛️ Government Housing Management System - Debug Mode
        </h1>
        
        <div style={{
          backgroundColor: '#d4edda',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h2>✅ Debug Application is Working!</h2>
          <p>If you can see this page, React is working correctly.</p>
          <p>The white screen issue is with the full application.</p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>🔍 System Status:</h3>
          <ul>
            <li>✅ React is working</li>
            <li>✅ Frontend server is running</li>
            <li>✅ Basic rendering is working</li>
            <li>⚠️ Issue is with the full application</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>🔧 Next Steps:</h3>
          <ol>
            <li>If this debug page works, React is fine</li>
            <li>The issue is with the full App.jsx</li>
            <li>Need to identify which component is causing the problem</li>
            <li>Will fix the specific component causing the white screen</li>
          </ol>
        </div>
        
        <button 
          onClick={() => {
            console.log('Debug button clicked - JavaScript is working');
            alert('JavaScript is working correctly!');
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test JavaScript
        </button>
        
        <button 
          onClick={() => {
            try {
              localStorage.setItem('test', 'working');
              const result = localStorage.getItem('test');
              alert('LocalStorage is working: ' + result);
            } catch (error) {
              alert('LocalStorage error: ' + error.message);
            }
          }}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test LocalStorage
        </button>
      </div>
    </div>
  );
}

export default AppDebug;
