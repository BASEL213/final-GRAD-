import React from 'react';

const TestComponent = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: 'blue' }}>Test Component Working!</h1>
      <p>This is a simple test to verify React rendering.</p>
      <div style={{ backgroundColor: 'lightgray', padding: '10px', margin: '10px' }}>
        <p>If you can see this, React is working correctly.</p>
      </div>
    </div>
  );
};

export default TestComponent;
