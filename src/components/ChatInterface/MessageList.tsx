import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { Message as MessageType } from '../../types';
import { Message } from './Message';

interface MessageListProps {
  messages: MessageType[];
}

const MessageListContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
`;

const EmptyStateMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.medium};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const MessagesEndDiv = styled.div`
  height: 1px;
  width: 100%;
`;

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages }, ref) => {
    return (
      <MessageListContainer>
        {messages.length === 0 ? (
          <EmptyStateMessage>
            <p>No messages yet. Start chatting!</p>
            <p>Select text on the page and ask a question about it.</p>
          </EmptyStateMessage>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isUser={message.role === 'user'}
            />
          ))
        )}
        <MessagesEndDiv ref={ref} />
      </MessageListContainer>
    );
  }
); 