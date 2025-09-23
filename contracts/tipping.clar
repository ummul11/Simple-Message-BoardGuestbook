;; Tipping Smart Contract
(define-constant ERR_INSUFFICIENT_BALANCE (err u1))
(define-constant ERR_INVALID_AMOUNT (err u2))
(define-constant ERR_SELF_TIP (err u3))
(define-constant ERR_INVALID_RECIPIENT (err u4))
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
(define-data-var last-tip-id uint u0)
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
(define-read-only (get-last-tip-id)
  (var-get last-tip-id)
)
(define-public (send-tip (recipient principal) (amount uint) (message-id uint))
  (let
    (
      (sender tx-sender)
      (new-tip-id (+ (var-get last-tip-id) u1))
      (current-balance (stx-get-balance sender))
    )
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (>= current-balance amount) ERR_INSUFFICIENT_BALANCE)
    (asserts! (not (is-eq sender recipient)) ERR_SELF_TIP)
    (var-set last-tip-id new-tip-id)
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
    (let
      (
        (current-received (get-user-tips-received recipient))
      )
      (map-set user-tips-received
        { user: recipient }
        { total-amount: (+ (get total-amount current-received) amount) }
      )
    )
    (let
      (
        (current-sent (get-user-tips-sent sender))
      )
      (map-set user-tips-sent
        { user: sender }
        { total-amount: (+ (get total-amount current-sent) amount) }
      )
    )
    (stx-transfer? amount sender recipient)
  )
)