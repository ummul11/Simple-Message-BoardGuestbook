;; Tipping Smart Contract
;; This contract allows users to send STX tips to message authors

(define-constant ERR_INSUFFICIENT_BALANCE (err u1))
(define-constant ERR_INVALID_AMOUNT (err u2))
(define-constant ERR_SELF_TIP (err u3))
(define-constant ERR_INVALID_RECIPIENT (err u4))

;; Define data maps to track tips
(define-map tip-history
  { tip-id: uint }
  {
    sender: principal,
    recipient: principal,
    amount: uint,
    message-id: uint,
    timestamp: uint
  }
)

(define-map user-tips-received
  { user: principal }
  { total-amount: uint }
)

(define-map user-tips-sent
  { user: principal }
  { total-amount: uint }
)

;; Data variable to track tip IDs
(define-data-var last-tip-id uint u0)

;; Read-only functions
(define-read-only (get-tip (tip-id uint))
  (map-get? tip-history { tip-id: tip-id })
)

(define-read-only (get-user-tips-received (user principal))
  (default-to
    { total-amount: u0 }
    (map-get? user-tips-received { user: user })
  )
)

(define-read-only (get-user-tips-sent (user principal))
  (default-to
    { total-amount: u0 }
    (map-get? user-tips-sent { user: user })
  )
)

;; Public function to send a tip
(define-public (send-tip (recipient principal) (amount uint) (message-id uint))
  (let
    (
      (sender tx-sender)
      (new-tip-id (+ (var-get last-tip-id) u1))
      (current-balance (stx-get-balance sender))
    )
    
    ;; Validate the tip amount (minimum 1 micro-STX)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Ensure sender has sufficient balance
    (asserts! (>= current-balance amount) ERR_INSUFFICIENT_BALANCE)
    
    ;; Prevent self-tipping
    (asserts! (not (eq? sender recipient)) ERR_SELF_TIP)
    
    ;; Validate recipient address
    (asserts! (is-standard recipient) ERR_INVALID_RECIPIENT)
    
    ;; Update tip ID counter
    (var-set last-tip-id new-tip-id)
    
    ;; Record the tip
    (map-set tip-history
      { tip-id: new-tip-id }
      {
        sender: sender,
        recipient: recipient,
        amount: amount,
        message-id: message-id,
        timestamp: block-height
      }
    )
    
    ;; Update recipient's total tips received
    (let
      (
        (current-received (get-user-tips-received recipient))
      )
      (map-set user-tips-received
        { user: recipient }
        { total-amount: (+ (get total-amount current-received) amount) }
      )
    )
    
    ;; Update sender's total tips sent
    (let
      (
        (current-sent (get-user-tips-sent sender))
      )
      (map-set user-tips-sent
        { user: sender }
        { total-amount: (+ (get total-amount current-sent) amount) }
      )
    )
    
    ;; Transfer STX to recipient
    (stx-transfer? amount sender recipient)
  )
)

;; Public function to get tips for a specific message
(define-read-only (get-message-tips (message-id uint))
  (let
    (
      (last-id (var-get last-tip-id))
    )
    (if (= last-id u0)
      (list)
      (fold
        (lambda (tip-id tips)
          (let
            (
              (tip (get-tip tip-id))
            )
            (if (is-some tip)
              (let
                (
                  (tip-data (unwrap! tip ERR_INVALID_AMOUNT))
                )
                (if (= (get message-id tip-data) message-id)
                  (append tips (list tip-data))
                  tips
                )
              )
              tips
            )
          )
        )
        (list)
        (range u1 (+ last-id u1))
      )
    )
  )
) 