# Enterprise Chat Redesign Guidelines

## Component Architecture

- `src/components/chat/ChatAreaOptimized.tsx`
: Orchestrates chat shell (header, thread, composer), modal state, socket presence/typing hooks.
- `src/components/chat/ChatHeader.tsx`
: Conversation identity, status chip, high-frequency actions (assign, close, starred, more).
- `src/components/chat/VirtualizedMessageList.tsx`
: Virtualized thread renderer with date separators, sender grouping, keyboard navigation, lazy-load control row, and thread reply affordance.
- `src/components/chat/Message.tsx`
: Atomic message rendering for content, status, reactions, reply preview, actions, and sender avatar chip.
- `src/components/chat/MessageInputWrapper.tsx`
: Composer controller (attachments, recording, file preview modal, slash-command dispatch, typing emit).
- `src/components/chat/MessageInput.tsx`
: Composer UI with rich multiline entry, emoji quick picker, slash command menu, and keyboard shortcuts.

## Layout Structure

- Header zone
: Sticky `ChatHeader` with conversation metadata and action controls.
- Thread zone
: `VirtualizedMessageList` in `role="log"` region with grouped sender blocks and compact row spacing for high density.
- Composer zone
: Sticky bottom `MessageInput` and optional reply strip/recording controls.

## UX Standards Applied

- Grouped messages by sender and time window to reduce repetitive chrome.
- Explicit timestamps and sender identifiers for scanning long threads.
- Hover actions via message menu, plus inline thread reply count CTA.
- Keyboard patterns:
  - `Enter` send
  - `Shift+Enter` newline
  - `ArrowUp/ArrowDown` focus navigation in thread
  - `R` quick reply on focused message
  - `Esc` closes floating composer menus
- Accessibility:
  - `role="log"` for message stream
  - ARIA labels on header/actions/composer controls
  - semantic header region for conversation metadata

## Theming And Visual Language

- Enterprise token set in `src/app/globals.css`:
  - `--chat-bg`
  - `--chat-panel`
  - `--chat-border`
  - `--chat-text`
  - `--chat-muted`
  - `--chat-accent`
- Typographic system upgraded to IBM Plex Sans/Mono for clearer professional UI texture.
- Subtle gradients and panel blur preserve readability while reducing flatness.

## Performance Model

- Virtualization with `react-window` for long history scalability.
- Message row sizing includes media/replies/reactions to reduce overlap and reflow.
- Lazy-load affordance row for older messages.
- Existing optimistic send/update path in chat page remains compatible.

## Slash Command Behavior

- `/template` opens templates panel.
- `/note <text>` sends an internal-note styled outgoing message payload.
- Additional assisted commands in composer palette:
  - `/assign`
  - `/close`
  - `/tag`

## Future Extensions

- Add dedicated thread side panel (`ThreadPane`) for true Slack-like nested reply streams.
- Replace quick emoji panel with searchable emoji dataset.
- Add command execution pipeline for `/assign`, `/close`, `/tag` to call backend APIs directly.
- Add viewport-top auto lazy loading trigger in virtual list for seamless infinite history.
