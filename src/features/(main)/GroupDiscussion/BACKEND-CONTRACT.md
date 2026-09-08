# Group discussion integration

Implemented REST requests use the existing authenticated `/api` Axios client:

- `GET groups?page=1&limit=20`
- `POST groups` with `name`, `description`, `member_emails`, `member_user_ids`
- `GET groups/{id}`
- `POST groups/{id}/members` with `email`, `role: "member"`
- `DELETE groups/{id}/members/{userId}` (only explicit user IDs, never membership IDs)
- `GET groups/{id}/messages?page=1&limit=20`

List responses use `{ data: [], pagination: { page, limit }, total? }`.
The detail/create adapters currently expect `{ data: { id, name, description?, members? } }`.
Members accept `user_id` or nested `user.id`, with name/email on the member or nested user.
History accepts an ID, text in `content`/`text`/`message`, optional `group_id`,
`created_at`, and author names from `sender.name`, `user.name`, `sender_name`, or `user_name`.
These non-empty response shapes need confirmation from backend examples. Unexpected
required fields raise an explicit error rather than rendering fabricated records.

## WebSocket information still required

Only the endpoint `GET ws/chat` was supplied. An unauthenticated request returns
`{"error":"missing authentication token"}`. No public schema was available at the
checked documentation URLs. `service/chat-protocol.ts` deliberately returns `null`
until its adapter can be implemented from an actual contract.

Ask the backend for:

1. Browser authentication: cookie, query parameter, subprotocol, or initial message;
   exact name and timing. Browser WebSocket cannot set an arbitrary Authorization header.
2. Whether one connection handles all groups or requires a subscription/join event.
3. Exact outbound JSON for a text message and inbound message/error/ack examples.
4. Message IDs, sender IDs, group IDs, timestamps, content field names, size limits,
   heartbeat requirements, and delivery/retry semantics.
5. Non-empty group details and paginated message-history examples, including ordering.

Implement `ChatProtocol.url`, `encode`, and `decode`, plus `subscribe` if needed,
then return the adapter from `getChatProtocol`. `useGroupChat` owns socket cleanup,
status, explicit reconnection, group filtering, and history resync. History is polled
every 15 seconds as a fallback. Sending is disabled while the adapter is absent.
Socket writes must not be treated as persisted messages without acknowledgement.

## Sharing and accessibility

Sharing prepares a regular text message containing the saved `/ppt-canvas?documentId=...`
link after validating the document using `GET documents/{id}`. Receiving links provides
a local canvas link and an accessible text preview. Recipients still need document
access enforced by the backend. Sending the prepared message requires the chat contract.

Saved document maps are regenerated from their summaries. Manual node edits are not
persisted or synchronized by these endpoints. Snapshot attachments or simultaneous
editing require a separate backend storage/event contract.

Standard, Focus (larger text, hidden map preview), and Read aloud (explicit browser
speech controls) are personal preferences. They do not change room membership or
infer a participant's disability. Voice recording/transcription and join-by-code are
not presented as working features.
