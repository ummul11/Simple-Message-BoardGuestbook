;; Leaderboard Smart Contract
;; This contract implements rankings across multiple dimensions for the guestbook
;; Tracks user statistics and maintains leaderboards for different metrics

;; ============================================================================
;; ERROR CODES
;; ============================================================================

(define-constant ERR_USER_NOT_FOUND (err u1))
(define-constant ERR_INVALID_DIMENSION (err u2))
(define-constant ERR_INVALID_AMOUNT (err u3))
(define-constant ERR_UNAUTHORIZED (err u4))
(define-constant ERR_RANK_NOT_FOUND (err u5))
(define-constant ERR_NEGATIVE_AMOUNT (err u6))

;; ============================================================================
;; CONSTANTS
;; ============================================================================

(define-constant DIMENSION_MESSAGES "messages")
(define-constant DIMENSION_LIKES "likes")
(define-constant DIMENSION_TIPS "tips")
(define-constant DIMENSION_BADGES "badges")
(define-constant MAX_LEADERBOARD_SIZE u100)
(define-constant CONTRACT_OWNER tx-sender)

;; ============================================================================
;; DATA STRUCTURES
;; ============================================================================

;; Map to store user statistics across all dimensions
;; Key: user principal
;; Value: counts for messages posted, likes received, tips sent, and badges earned
(define-map user-stats
  { user: principal }
  {
    messages-posted: uint,
    total-likes-received: uint,
    total-tips-sent: uint,
    total-badges: uint
  }
)

;; Map to store leaderboard entries for each dimension
;; Key: rank (1-100) and dimension (messages, likes, tips, badges)
;; Value: user principal and their score for that dimension
(define-map leaderboard-entries
  { rank: uint, dimension: (string-ascii 10) }
  {
    user: principal,
    score: uint
  }
)

;; Map to track user rankings for quick lookup
;; Key: user principal and dimension
;; Value: the user's current rank (1-100, or 0 if not ranked)
(define-map user-rankings
  { user: principal, dimension: (string-ascii 10) }
  { rank: uint }
)

;; Data variable to track the last update block height
(define-data-var last-update-block uint u0)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Get the statistics for a specific user
;; @param user: The principal of the user
;; @returns: User statistics with default values if not found
(define-read-only (get-user-stats (user principal))
  (default-to
    {
      messages-posted: u0,
      total-likes-received: u0,
      total-tips-sent: u0,
      total-badges: u0
    }
    (map-get? user-stats { user: user })
  )
)

;; Get a specific leaderboard entry by rank and dimension
;; @param rank: The rank position (1-100)
;; @param dimension: The dimension to query (messages, likes, tips, badges)
;; @returns: Optional leaderboard entry or none if not found
(define-read-only (get-leaderboard-entry (rank uint) (dimension (string-ascii 10)))
  (map-get? leaderboard-entries { rank: rank, dimension: dimension })
)

;; Get a user's rank in a specific dimension
;; @param user: The principal of the user
;; @param dimension: The dimension to query (messages, likes, tips, badges)
;; @returns: User's rank (0 if not ranked)
(define-read-only (get-user-rank (user principal) (dimension (string-ascii 10)))
  (default-to
    { rank: u0 }
    (map-get? user-rankings { user: user, dimension: dimension })
  )
)

;; Get the top N users for a specific dimension
;; @param dimension: The dimension to query (messages, likes, tips, badges)
;; @param limit: Maximum number of results to return (max 100)
;; @returns: Optional leaderboard entry for rank 1
(define-read-only (get-top-users (dimension (string-ascii 10)) (limit uint))
  ;; Validate dimension and limit, then return top entry
  (if
    (and
      (or
        (is-eq dimension DIMENSION_MESSAGES)
        (or
          (is-eq dimension DIMENSION_LIKES)
          (or
            (is-eq dimension DIMENSION_TIPS)
            (is-eq dimension DIMENSION_BADGES)
          )
        )
      )
      (<= limit MAX_LEADERBOARD_SIZE)
    )
    (get-leaderboard-entry u1 dimension)
    none
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS
;; ============================================================================

;; Update user statistics for a specific dimension
;; @param user: The principal of the user to update
;; @param dimension: The dimension to update (messages, likes, tips, badges)
;; @param amount: The amount to add to the statistic
;; @returns: OK or an error
(define-public (update-user-stats (user principal) (dimension (string-ascii 10)) (amount uint))
  (let
    (
      (current-stats (get-user-stats user))
    )
    ;; Verify caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Validate dimension
    (asserts!
      (or
        (is-eq dimension DIMENSION_MESSAGES)
        (or
          (is-eq dimension DIMENSION_LIKES)
          (or
            (is-eq dimension DIMENSION_TIPS)
            (is-eq dimension DIMENSION_BADGES)
          )
        )
      )
      ERR_INVALID_DIMENSION
    )
    ;; Validate amount is not negative
    (asserts! (>= amount u0) ERR_NEGATIVE_AMOUNT)
    ;; Update statistics based on dimension
    (if (is-eq dimension DIMENSION_MESSAGES)
      (map-set user-stats
        { user: user }
        (merge current-stats { messages-posted: (+ (get messages-posted current-stats) amount) })
      )
      (if (is-eq dimension DIMENSION_LIKES)
        (map-set user-stats
          { user: user }
          (merge current-stats { total-likes-received: (+ (get total-likes-received current-stats) amount) })
        )
        (if (is-eq dimension DIMENSION_TIPS)
          (map-set user-stats
            { user: user }
            (merge current-stats { total-tips-sent: (+ (get total-tips-sent current-stats) amount) })
          )
          (if (is-eq dimension DIMENSION_BADGES)
            (map-set user-stats
              { user: user }
              (merge current-stats { total-badges: (+ (get total-badges current-stats) amount) })
            )
            true
          )
        )
      )
    )
    (ok true)
  )
)

;; Recalculate leaderboard rankings for a specific dimension
;; This is a simplified version that updates a single rank entry
;; @param dimension: The dimension to recalculate (messages, likes, tips, badges)
;; @param rank: The rank position to update
;; @param user: The user to place at this rank
;; @param score: The score for this user
;; @returns: OK or an error
(define-public (update-leaderboard-entry
  (dimension (string-ascii 10))
  (rank uint)
  (user principal)
  (score uint)
)
  (begin
    ;; Verify caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Validate dimension
    (asserts!
      (or
        (is-eq dimension DIMENSION_MESSAGES)
        (or
          (is-eq dimension DIMENSION_LIKES)
          (or
            (is-eq dimension DIMENSION_TIPS)
            (is-eq dimension DIMENSION_BADGES)
          )
        )
      )
      ERR_INVALID_DIMENSION
    )
    ;; Validate rank is within bounds
    (asserts! (and (> rank u0) (<= rank MAX_LEADERBOARD_SIZE)) ERR_INVALID_AMOUNT)
    ;; Update leaderboard entry
    (map-set leaderboard-entries
      { rank: rank, dimension: dimension }
      { user: user, score: score }
    )
    ;; Update user ranking
    (map-set user-rankings
      { user: user, dimension: dimension }
      { rank: rank }
    )
    ;; Update last update block
    (var-set last-update-block block-height)
    (ok true)
  )
)

;; Get the last block height when leaderboard was updated
;; @returns: The block height of the last update
(define-read-only (get-last-update-block)
  (var-get last-update-block)
)

;; Increment a user's message count
;; @param user: The principal of the user
;; @returns: OK or an error
(define-public (increment-message-count (user principal))
  (update-user-stats user DIMENSION_MESSAGES u1)
)

;; Increment a user's likes received count
;; @param user: The principal of the user
;; @param amount: The number of likes to add
;; @returns: OK or an error
(define-public (increment-likes-received (user principal) (amount uint))
  (update-user-stats user DIMENSION_LIKES amount)
)

;; Increment a user's tips sent count
;; @param user: The principal of the user
;; @param amount: The amount of STX tipped (in micro-STX)
;; @returns: OK or an error
(define-public (increment-tips-sent (user principal) (amount uint))
  (update-user-stats user DIMENSION_TIPS amount)
)

;; Increment a user's badge count
;; @param user: The principal of the user
;; @returns: OK or an error
(define-public (increment-badge-count (user principal))
  (update-user-stats user DIMENSION_BADGES u1)
)

;; Clear a user's ranking for a specific dimension
;; @param user: The principal of the user
;; @param dimension: The dimension to clear
;; @returns: OK or an error
(define-public (clear-user-ranking (user principal) (dimension (string-ascii 10)))
  (begin
    ;; Verify caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Clear the ranking
    (map-delete user-rankings { user: user, dimension: dimension })
    (ok true)
  )
)

