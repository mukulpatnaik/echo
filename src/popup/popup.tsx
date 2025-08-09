import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from '../components/ChatWidget';
import '../styles/popup.css';
import '../styles/ChatWidget.css';

// Simple wrapper component for the popup
const PopupApp: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ChatWidget />
    </div>
  );
};

// Initialize the popup when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<PopupApp />);
  }
});
