;; Guestbook Smart Contract
(define-constant ERR_MESSAGE_NOT_FOUND (err u1))
(define-constant ERR_ALREADY_LIKED (err u2))
(define-constant ERR_CONTENT_TOO_LONG (err u3))
(define-constant MAX_MESSAGE_LENGTH u280)
(define-data-var last-message-id uint u0)
(define-map messages
  { message-id: uint }
  {
    author: principal,
    content: (string-utf8 280),
    timestamp: uint,
    likes: uint
  }
)
(define-map user-likes
  { user: principal, message-id: uint }
  { liked: bool }
)
(define-read-only (get-last-message-id)
  (var-get last-message-id)
)
(define-read-only (get-message (message-id uint))
  (map-get? messages { message-id: message-id })
)
(define-read-only (has-user-liked (user principal) (message-id uint))
  (default-to
    { liked: false }
    (map-get? user-likes { user: user, message-id: message-id })
  )
)
(define-public (post-message (content (string-utf8 280)))
  (let
    (
      (new-message-id (+ (var-get last-message-id) u1))
      (author tx-sender)
      (timestamp (+ block-height u1))
    )
    (var-set last-message-id new-message-id)
    (map-set messages
      { message-id: new-message-id }
      {
        author: author,
        content: content,
        timestamp: timestamp,
        likes: u0
      }
    )
    (ok new-message-id)
  )
)
(define-public (like-message (message-id uint))
  (let
    (
      (message (get-message message-id))
      (user tx-sender)
      (user-like-status (has-user-liked user message-id))
    )
    (asserts! (is-some message) ERR_MESSAGE_NOT_FOUND)
    (asserts! (not (get liked user-like-status)) ERR_ALREADY_LIKED)
    (let
      (
        (message-data (unwrap! message ERR_MESSAGE_NOT_FOUND))
        (current-likes (get likes message-data))
      )
      (map-set messages
        { message-id: message-id }
        (merge message-data { likes: (+ current-likes u1) })
      )
      (map-set user-likes
        { user: user, message-id: message-id }
        { liked: true }
      )
      (ok true)
    )
  )
)