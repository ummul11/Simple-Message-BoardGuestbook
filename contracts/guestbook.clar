;; Guestbook Smart Contract
;; This contract allows users to post messages and like other messages

(define-constant ERR_MESSAGE_NOT_FOUND (err u1))
(define-constant ERR_ALREADY_LIKED (err u2))
(define-constant ERR_LIKE_FAILED (err u3))
(define-constant ERR_PARENT_NOT_FOUND (err u4))

;; Define data variables
(define-data-var last-message-id uint u0)

;; Define data maps
(define-map messages
  { message-id: uint }
  {
    author: principal,
    content: (string-utf8 280),
    timestamp: uint,
    likes: uint,
    parent-id: (optional uint)
  }
)

(define-map user-likes
  { user: principal, message-id: uint }
  { liked: bool }
)

;; Read-only functions
(define-read-only (get-message (message-id uint))
  (map-get? messages { message-id: message-id })
)

(define-read-only (get-last-message-id)
  (var-get last-message-id)
)

(define-read-only (has-user-liked (user principal) (message-id uint))
  (default-to
    { liked: false }
    (map-get? user-likes { user: user, message-id: message-id })
  )
)

;; Public functions
(define-public (post-message (content (string-utf8 280)))
  (let
    (
      (new-id (+ (var-get last-message-id) u1))
      (sender tx-sender)
    )
    ;; Update the last message ID
    (var-set last-message-id new-id)
    
    ;; Store the new message
    (map-set messages
      { message-id: new-id }
      {
        author: sender,
        content: content,
        timestamp: block-height,
        likes: u0,
        parent-id: none
      }
    )
    
    ;; Return the new message ID
    (ok new-id)
  )
)

(define-public (reply-to-message (content (string-utf8 280)) (parent-id uint))
  (let
    (
      (new-id (+ (var-get last-message-id) u1))
      (sender tx-sender)
      (parent-message (get-message parent-id))
    )
    ;; Check if the parent message exists
    (asserts! (is-some parent-message) ERR_PARENT_NOT_FOUND)
    
    ;; Update the last message ID
    (var-set last-message-id new-id)
    
    ;; Store the new message
    (map-set messages
      { message-id: new-id }
      {
        author: sender,
        content: content,
        timestamp: block-height,
        likes: u0,
        parent-id: (some parent-id)
      }
    )
    
    ;; Return the new message ID
    (ok new-id)
  )
)

(define-public (like-message (message-id uint))
  (let
    (
      (sender tx-sender)
      (existing-message (get-message message-id))
      (user-like (has-user-liked sender message-id))
    )
    
    ;; Check if the message exists
    (asserts! (is-some existing-message) ERR_MESSAGE_NOT_FOUND)
    
    ;; Check if the user has already liked this message
    (asserts! (not (get liked user-like)) ERR_ALREADY_LIKED)
    
    ;; Update the like count
    (match existing-message
      message
      (begin
        ;; Mark that the user has liked this message
        (map-set user-likes
          { user: sender, message-id: message-id }
          { liked: true }
        )
        
        ;; Increment the like count
        (map-set messages
          { message-id: message-id }
          (merge message { likes: (+ (get likes message) u1) })
        )
        
        (ok true)
      )
      ERR_LIKE_FAILED
    )
  )
)