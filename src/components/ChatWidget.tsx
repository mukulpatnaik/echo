import React, { useState, useEffect, useRef } from 'react';

const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Expand widget when messages are added, collapse when cleared
    setIsExpanded(messages.length > 0);
  }, [messages.length]);

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

  const clearMessages = () => {
    setMessages([]);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Here you would typically start/stop actual recording
    console.log(isRecording ? 'Stopping recording...' : 'Starting recording...');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '720px',
      maxWidth: '90vw',
      height: isExpanded ? 'auto' : 'auto',
      maxHeight: isExpanded ? '500px' : 'auto',
      backgroundColor: 'rgba(30, 30, 30, 0.6)',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      pointerEvents: 'auto',
      zIndex: 2147483647,
      opacity: 1,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Header - Only show when expanded */}
      {isExpanded && (
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>Echo</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={clearMessages}
              title="Clear messages"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '12px',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.6)',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }}
            >Clear Chat</button>
            <button 
              onClick={closeWidget}
              title="Close widget"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.5)',
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
                e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.15)';
                e.currentTarget.style.color = 'rgba(255, 59, 48, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }}
            >✕</button>
          </div>
        </div>
      )}

      {/* Messages - Only show when there are messages */}
      {isExpanded && (
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minHeight: '200px',
          maxHeight: '350px',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{
                alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                padding: '12px 18px',
                borderRadius: '18px',
                background: msg.isUser 
                  ? 'rgba(0, 122, 255, 0.5)' 
                  : 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                animation: `messageSlide ${msg.isUser ? 'Right' : 'Left'} 0.3s ease-out`
              }}
            >
              <span style={{ fontWeight: '600', marginRight: '8px' }}>
                {msg.isUser ? 'You:' : 'Echo:'}
              </span>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input - Always visible */}
      <div style={{
        display: 'flex',
        padding: '15px',
        borderTop: isExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.015)',
        alignItems: 'center'
      }}>
        {/* Close button when collapsed */}
        {!isExpanded && (
          <button 
            onClick={closeWidget}
            title="Close widget"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              flexShrink: 0
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
        )}
        {/* Mic Button / Waveform */}
        <button
          onClick={toggleRecording}
          title={isRecording ? "Stop recording" : "Start recording"}
          style={{
            background: isRecording ? 'rgba(255, 59, 48, 0.1)' : 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!isRecording) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRecording) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }
          }}
        >
          {isRecording ? (
            // Animated Waveform
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              height: '20px'
            }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    backgroundColor: 'rgba(255, 59, 48, 0.8)',
                    borderRadius: '2px',
                    animation: `waveform ${0.6 + i * 0.1}s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          ) : (
            // Mic Icon
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
        <input
          type="text"
          placeholder={isExpanded ? "Type your message..." : "Start a conversation..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '25px',
            fontSize: '14px',
            outline: 'none',
            background: 'rgba(255, 255, 255, 0.03)',
            color: 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.4)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          }}
        />
        <button 
          onClick={sendMessage}
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 122, 255, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 122, 255, 0.2)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 122, 255, 0.7)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 122, 255, 0.8)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >Send</button>
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes messageSlideLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes messageSlideRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes waveform {
          0%, 100% {
            height: 8px;
          }
          50% {
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;