import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import styled from '@emotion/styled';

interface Message {
  id: string;
  text: string | { response: string } | any;
  timestamp: number;
  isAI?: boolean;
}

interface ChatInitResponse {
  id: string;
}

interface ChatResponse {
  messages: Message[];
}

interface AIResponse {
  response: string;
}

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff0f5;
  font-family: 'Arial', sans-serif;
`;

const ChatContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MessageBubble = styled.div<{ isAI?: boolean }>`
  background-color: ${props => props.isAI ? '#ffd1dc' : '#ffb6c1'};
  padding: 10px 15px;
  border-radius: 15px;
  max-width: 70%;
  align-self: ${props => props.isAI ? 'flex-end' : 'flex-start'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MessageContent = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
`;

const LoadingDots = styled.div`
  @keyframes pulse {
    0% { opacity: 0.2; }
    50% { opacity: 1; }
    100% { opacity: 0.2; }
  }
  animation: pulse 1.5s ease-in-out infinite;
  display: inline-block;
  width: 1em;
  text-align: left;
`;

const InputContainer = styled.div`
  padding: 20px;
  background-color: #fff;
  border-top: 1px solid #ffb6c1;
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 2px solid #ffb6c1;
  border-radius: 20px;
  outline: none;
  font-size: 16px;
  
  &:focus {
    border-color: #ff69b4;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #ff1493;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 10px;
  background-color: #fff;
  color: #ff69b4;
  font-size: 14px;
`;

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatStateId, setChatStateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize chat state
    fetch('/chat/init', { method: 'POST' })
      .then(res => res.json() as Promise<ChatInitResponse>)
      .then(data => {
        setChatStateId(data.id);
        return fetch(`/chat/${data.id}`);
      })
      .then(res => res.json() as Promise<ChatResponse>)
      .then(data => setMessages(data.messages))
      .catch(console.error);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatStateId) return;

    try {
      setIsLoading(true);
      const userMessage: Message = {
        id: crypto.randomUUID(),
        text: newMessage,
        timestamp: Date.now(),
        isAI: false
      };
      
      // Add user message immediately
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      console.log('Sending message:', newMessage);
      const response = await fetch(`/chat/${chatStateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage }),
      });
      const data = await response.json() as { messages: Message[] };
      console.log('Raw response data:', data);
      
      if (data.messages && Array.isArray(data.messages)) {
        // Only add the AI message (skip the user message since we already added it)
        const aiMessage = data.messages[1];
        if (aiMessage) {
          setMessages(prev => [...prev, aiMessage]);
        }
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!chatStateId) return;

    try {
      await fetch(`/chat/${chatStateId}`, { method: 'DELETE' });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <AppContainer>
      <ChatContainer>
        {messages.map(message => {
          let content: string;
          if (typeof message.text === 'string') {
            content = message.text;
          } else if (message.text && typeof message.text === 'object') {
            const obj = message.text as any;
            if (obj.response) {
              content = obj.response;
            } else if (obj.text) {
              content = obj.text;
            } else if (obj.message) {
              content = obj.message;
            } else {
              content = JSON.stringify(obj);
            }
          } else {
            content = String(message.text);
          }
          
          return (
            <MessageBubble key={message.id} isAI={message.isAI}>
              <MessageContent>{content}</MessageContent>
            </MessageBubble>
          );
        })}
        {isLoading && (
          <MessageBubble isAI>
            <MessageContent>
              <LoadingDots>...</LoadingDots>
            </MessageContent>
          </MessageBubble>
        )}
      </ChatContainer>
      <InputContainer>
        <Input
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <Button onClick={sendMessage} disabled={isLoading}>Send</Button>
        <Button onClick={clearChat} disabled={isLoading}>Clear</Button>
      </InputContainer>
      <Footer>
        made with <span style={{ color: '#ff1493' }}>❤ in HI 🌺 && SF🌉 w/ Cloudflare AutoRAG && Durable Objects. Code on GitHub here</span>
      </Footer>
    </AppContainer>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} 