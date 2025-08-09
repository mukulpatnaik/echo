import React, { useState, useEffect, useRef } from 'react';

const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { text: trimmed, isUser: true }]);
    setInput('');
    // Echo bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { text: `You said: ${trimmed}`, isUser: false }]);
    }, 300);
  };

  const closeWidget = () => {
    // Send cleanup message to background script to properly clean up
    chrome.runtime.sendMessage({ action: 'cleanup' }, () => {
      console.log('[ChatWidget] Cleanup message sent to background');
    });
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '720px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: '500px',
      backgroundColor: 'rgba(30, 30, 30, 0.95)',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      pointerEvents: 'auto',
      zIndex: 2147483647,
      opacity: 1
    }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '18px', 
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '600'
        }}>Echo Chat</h3>
        <button 
          onClick={closeWidget}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.6)',
            padding: '0',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.2)';
            e.currentTarget.style.color = 'rgba(255, 59, 48, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >✕</button>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '200px',
        maxHeight: '350px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            Start a conversation...
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{
                alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                padding: '12px 18px',
                borderRadius: '18px',
                background: msg.isUser 
                  ? 'rgba(0, 122, 255, 0.8)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <span style={{ fontWeight: '600', marginRight: '8px' }}>
                {msg.isUser ? 'You:' : 'Echo:'}
              </span>
              {msg.text}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        padding: '15px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.03)'
      }}>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '25px',
            fontSize: '14px',
            outline: 'none',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.5)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        />
        <button 
          onClick={sendMessage}
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 122, 255, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 122, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 122, 255, 0.8)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >Send</button>
      </div>
    </div>
  );
};

export default ChatWidget;