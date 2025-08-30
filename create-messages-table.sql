-- Create messages table and related functionality
-- Run this in Supabase SQL Editor

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

-- Messages table for conversations between matched users
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL, -- We'll use match_id as conversation_id
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure users can't message themselves
    CONSTRAINT no_self_message CHECK (sender_id != recipient_id)
);

-- Conversations view (virtual table based on matches)
CREATE OR REPLACE VIEW conversations AS
SELECT 
    m.id as conversation_id,
    m.user_a,
    m.user_b,
    m.created_at as match_created_at,
    COALESCE(last_msg.last_message_at, m.created_at) as last_activity,
    last_msg.last_message_content,
    last_msg.last_sender_id,
    unread.unread_count
FROM matches m
LEFT JOIN (
    -- Get the last message for each conversation
    SELECT 
        conversation_id,
        content as last_message_content,
        sender_id as last_sender_id,
        created_at as last_message_at,
        ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
    FROM messages
) last_msg ON last_msg.conversation_id = m.id AND last_msg.rn = 1
LEFT JOIN (
    -- Count unread messages per conversation per user
    SELECT 
        conversation_id,
        recipient_id,
        COUNT(*) as unread_count
    FROM messages 
    WHERE is_read = false
    GROUP BY conversation_id, recipient_id
) unread ON unread.conversation_id = m.id;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own message read status" ON messages;

-- Messages RLS policies
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    sender_id = auth.uid() AND
    -- Ensure both users are in a match together
    EXISTS (
      SELECT 1 FROM matches 
      WHERE (user_a = sender_id AND user_b = recipient_id) 
         OR (user_a = recipient_id AND user_b = sender_id)
    )
  );

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (sender_id = auth.uid() OR recipient_id = auth.uid())
  );

CREATE POLICY "Users can update message read status" ON messages
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    recipient_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    recipient_id = auth.uid()
  );

-- Grant access to the conversations view
GRANT SELECT ON conversations TO authenticated;

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Get all conversations for a user
/*
SELECT * FROM conversations 
WHERE user_a = auth.uid() OR user_b = auth.uid()
ORDER BY last_activity DESC;
*/

-- Get messages in a conversation
/*
SELECT * FROM messages 
WHERE conversation_id = 'your-match-id'
ORDER BY created_at ASC;
*/

-- Send a message
/*
INSERT INTO messages (conversation_id, sender_id, recipient_id, content)
VALUES ('match-id', auth.uid(), 'recipient-id', 'Hello!');
*/

-- Mark messages as read
/*
UPDATE messages 
SET is_read = true 
WHERE conversation_id = 'match-id' AND recipient_id = auth.uid();
*/
