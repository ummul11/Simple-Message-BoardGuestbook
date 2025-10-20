;; User Badges Smart Contract
;; This contract implements an achievement and gamification layer for the guestbook
;; Users can earn badges based on their activity and contributions

;; ============================================================================
;; ERROR CODES
;; ============================================================================

(define-constant ERR_BADGE_NOT_FOUND (err u1))
(define-constant ERR_INVALID_BADGE_NAME (err u2))
(define-constant ERR_INVALID_DESCRIPTION (err u3))
(define-constant ERR_USER_NOT_FOUND (err u4))
(define-constant ERR_BADGE_ALREADY_EARNED (err u5))
(define-constant ERR_UNAUTHORIZED (err u6))
(define-constant ERR_INVALID_ICON (err u7))
(define-constant ERR_INVALID_CRITERIA (err u8))

;; ============================================================================
;; CONSTANTS
;; ============================================================================

(define-constant MAX_NAME_LENGTH u50)
(define-constant MAX_DESCRIPTION_LENGTH u280)
(define-constant MAX_ICON_LENGTH u100)
(define-constant MAX_CRITERIA_LENGTH u280)
(define-constant CONTRACT_OWNER tx-sender)

;; Pre-defined badge types for common achievements
(define-constant BADGE_FIRST_MESSAGE "first-message")
(define-constant BADGE_POPULAR_MESSAGE "popular-message")
(define-constant BADGE_HELPFUL_CONTRIBUTOR "helpful-contributor")
(define-constant BADGE_COMMUNITY_MODERATOR "community-moderator")
(define-constant BADGE_GENEROUS_TIPPER "generous-tipper")

;; ============================================================================
;; DATA STRUCTURES
;; ============================================================================

;; Map to store badge definitions
;; Key: badge-id (uint)
;; Value: badge metadata including name, description, icon, and criteria
(define-map badges
  { badge-id: uint }
  {
    name: (string-utf8 50),
    description: (string-utf8 280),
    icon: (string-utf8 100),
    criteria: (string-utf8 280),
    created-at: uint
  }
)

;; Map to track which badges a user has earned
;; Key: user principal and badge-id
;; Value: timestamp when badge was earned
(define-map user-badges
  { user: principal, badge-id: uint }
  { earned-at: uint }
)

;; Map to track total badge count for each user
;; Key: user principal
;; Value: total number of badges earned
(define-map badge-counts
  { user: principal }
  { total-badges: uint }
)

;; Data variable to track the last badge ID (auto-increment)
(define-data-var last-badge-id uint u0)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Get the details of a specific badge by ID
;; @param badge-id: The ID of the badge to retrieve
;; @returns: Optional badge details or none if not found
(define-read-only (get-badge (badge-id uint))
  (map-get? badges { badge-id: badge-id })
)

;; Check if a user has earned a specific badge
;; @param user: The principal of the user
;; @param badge-id: The ID of the badge to check
;; @returns: Optional timestamp of when badge was earned, or none
(define-read-only (has-badge (user principal) (badge-id uint))
  (map-get? user-badges { user: user, badge-id: badge-id })
)

;; Get the total number of badges earned by a user
;; @param user: The principal of the user
;; @returns: Total badge count with default of 0 if user not found
(define-read-only (get-user-badge-count (user principal))
  (default-to
    { total-badges: u0 }
    (map-get? badge-counts { user: user })
  )
)

;; Get the last badge ID (total number of badge types)
;; @returns: The ID of the most recently created badge type
(define-read-only (get-last-badge-id)
  (var-get last-badge-id)
)

;; ============================================================================
;; PUBLIC FUNCTIONS
;; ============================================================================

;; Create a new badge type (only contract owner can call this)
;; @param name: The name of the badge (max 50 characters)
;; @param description: Description of the badge (max 280 characters)
;; @param icon: Icon identifier or URL (max 100 characters)
;; @param criteria: Criteria for earning the badge (max 280 characters)
;; @returns: OK with the new badge ID or an error
(define-public (create-badge
  (name (string-utf8 50))
  (description (string-utf8 280))
  (icon (string-utf8 100))
  (criteria (string-utf8 280))
)
  (begin
    ;; Verify caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Validate inputs
    (asserts! (> (len name) u0) ERR_INVALID_BADGE_NAME)
    (asserts! (> (len description) u0) ERR_INVALID_DESCRIPTION)
    (asserts! (> (len icon) u0) ERR_INVALID_ICON)
    (asserts! (> (len criteria) u0) ERR_INVALID_CRITERIA)
    ;; Create new badge
    (let
      (
        (new-badge-id (+ (var-get last-badge-id) u1))
      )
      ;; Increment badge ID counter
      (var-set last-badge-id new-badge-id)
      ;; Store badge definition
      (map-set badges
        { badge-id: new-badge-id }
        {
          name: name,
          description: description,
          icon: icon,
          criteria: criteria,
          created-at: block-height
        }
      )
      (ok new-badge-id)
    )
  )
)

;; Award a badge to a user (only contract owner can call this)
;; @param user: The principal of the user to award the badge to
;; @param badge-id: The ID of the badge to award
;; @returns: OK or an error
(define-public (award-badge (user principal) (badge-id uint))
  (let
    (
      (badge (get-badge badge-id))
      (already-earned (has-badge user badge-id))
      (current-count (get-user-badge-count user))
    )
    ;; Verify caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Verify badge exists
    (asserts! (is-some badge) ERR_BADGE_NOT_FOUND)
    ;; Verify user hasn't already earned this badge
    (asserts! (is-none already-earned) ERR_BADGE_ALREADY_EARNED)
    ;; Award the badge
    (map-set user-badges
      { user: user, badge-id: badge-id }
      { earned-at: block-height }
    )
    ;; Update badge count
    (map-set badge-counts
      { user: user }
      { total-badges: (+ (get total-badges current-count) u1) }
    )
    (ok true)
  )
)

;; Revoke a badge from a user (only contract owner can call this)
;; @param user: The principal of the user to revoke the badge from
;; @param badge-id: The ID of the badge to revoke
;; @returns: OK or an error
(define-public (revoke-badge (user principal) (badge-id uint))
  (let
    (
      (badge (get-badge badge-id))
      (earned (has-badge user badge-id))
      (current-count (get-user-badge-count user))
    )
    ;; Verify caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Verify badge exists
    (asserts! (is-some badge) ERR_BADGE_NOT_FOUND)
    ;; Verify user has earned this badge
    (asserts! (is-some earned) ERR_BADGE_NOT_FOUND)
    ;; Revoke the badge by deleting the entry
    (map-delete user-badges { user: user, badge-id: badge-id })
    ;; Update badge count (decrease by 1, but ensure it doesn't go below 0)
    (let
      (
        (new-count (if (> (get total-badges current-count) u0)
          (- (get total-badges current-count) u1)
          u0
        ))
      )
      (map-set badge-counts
        { user: user }
        { total-badges: new-count }
      )
    )
    (ok true)
  )
)



