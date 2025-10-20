;; Message Moderation Smart Contract
;; This contract implements a community reporting and moderation system for the guestbook
;; Users can report inappropriate messages, and moderators can take action on reports

;; ============================================================================
;; ERROR CODES
;; ============================================================================

(define-constant ERR_REPORT_NOT_FOUND (err u1))
(define-constant ERR_ACTION_NOT_FOUND (err u2))
(define-constant ERR_INVALID_REASON (err u3))
(define-constant ERR_NOT_MODERATOR (err u4))
(define-constant ERR_INVALID_ACTION (err u5))
(define-constant ERR_ALREADY_REPORTED (err u6))
(define-constant ERR_INVALID_STATUS (err u7))
(define-constant ERR_UNAUTHORIZED (err u8))
(define-constant ERR_USER_NOT_FOUND (err u9))

;; ============================================================================
;; CONSTANTS
;; ============================================================================

(define-constant MAX_REASON_LENGTH u280)
(define-constant REPORT_STATUS_PENDING "pending")
(define-constant REPORT_STATUS_APPROVED "approved")
(define-constant REPORT_STATUS_REJECTED "rejected")
(define-constant MODERATION_ACTION_WARN "warn")
(define-constant MODERATION_ACTION_BAN "ban")
(define-constant MODERATION_ACTION_DISMISS "dismiss")
(define-constant CONTRACT_OWNER tx-sender)

;; ============================================================================
;; DATA STRUCTURES
;; ============================================================================

;; Map to store all reports submitted by users
;; Key: report-id (uint)
;; Value: report details including reporter, message-id, reason, timestamp, and status
(define-map reports
  { report-id: uint }
  {
    reporter: principal,
    message-id: uint,
    reason: (string-utf8 280),
    timestamp: uint,
    status: (string-ascii 10)
  }
)

;; Map to track if a user has already reported a specific message
;; This prevents duplicate reports from the same user for the same message
(define-map user-message-reports
  { user: principal, message-id: uint }
  { reported: bool }
)

;; Map to store moderation actions taken on reports
;; Key: action-id (uint)
;; Value: action details including moderator, report-id, action type, and timestamp
(define-map moderation-actions
  { action-id: uint }
  {
    moderator: principal,
    report-id: uint,
    action: (string-ascii 10),
    timestamp: uint
  }
)

;; Map to track user reputation scores and warning counts
;; Key: user principal
;; Value: reputation score (can be negative) and warning count
(define-map user-reputation
  { user: principal }
  {
    reputation-score: int,
    warnings: uint,
    is-banned: bool
  }
)

;; Map to track which users are moderators
;; Key: user principal
;; Value: boolean indicating if user is a moderator
(define-map moderators
  { user: principal }
  { is-moderator: bool }
)

;; Data variable to track the last report ID (auto-increment)
(define-data-var last-report-id uint u0)

;; Data variable to track the last moderation action ID (auto-increment)
(define-data-var last-action-id uint u0)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Get the details of a specific report by ID
;; @param report-id: The ID of the report to retrieve
;; @returns: Optional report details or none if not found
(define-read-only (get-report (report-id uint))
  (map-get? reports { report-id: report-id })
)

;; Get the reputation information for a specific user
;; @param user: The principal of the user
;; @returns: User reputation details with default values if not found
(define-read-only (get-user-reputation (user principal))
  (default-to
    { reputation-score: 0, warnings: u0, is-banned: false }
    (map-get? user-reputation { user: user })
  )
)

;; Get the details of a specific moderation action by ID
;; @param action-id: The ID of the moderation action to retrieve
;; @returns: Optional moderation action details or none if not found
(define-read-only (get-moderation-action (action-id uint))
  (map-get? moderation-actions { action-id: action-id })
)

;; Check if a user is a moderator
;; @param user: The principal of the user to check
;; @returns: Boolean indicating if user is a moderator
(define-read-only (is-moderator (user principal))
  (default-to
    { is-moderator: false }
    (map-get? moderators { user: user })
  )
)

;; Get the last report ID (total number of reports)
;; @returns: The ID of the most recent report
(define-read-only (get-last-report-id)
  (var-get last-report-id)
)

;; Get the last moderation action ID
;; @returns: The ID of the most recent moderation action
(define-read-only (get-last-action-id)
  (var-get last-action-id)
)

;; Check if a user has already reported a specific message
;; @param user: The principal of the user
;; @param message-id: The ID of the message
;; @returns: Boolean indicating if user has reported this message
(define-read-only (has-user-reported-message (user principal) (message-id uint))
  (default-to
    { reported: false }
    (map-get? user-message-reports { user: user, message-id: message-id })
  )
)

;; ============================================================================
;; PUBLIC FUNCTIONS
;; ============================================================================

;; Submit a report for an inappropriate message
;; @param message-id: The ID of the message being reported
;; @param reason: The reason for reporting (max 280 characters)
;; @returns: OK with the new report ID or an error
(define-public (report-message (message-id uint) (reason (string-utf8 280)))
  (let
    (
      (reporter tx-sender)
      (new-report-id (+ (var-get last-report-id) u1))
      (has-reported (has-user-reported-message reporter message-id))
    )
    ;; Validate that reason is not empty
    (asserts! (> (len reason) u0) ERR_INVALID_REASON)
    ;; Prevent duplicate reports from same user for same message
    (asserts! (not (get reported has-reported)) ERR_ALREADY_REPORTED)
    ;; Increment report ID counter
    (var-set last-report-id new-report-id)
    ;; Store the report
    (map-set reports
      { report-id: new-report-id }
      {
        reporter: reporter,
        message-id: message-id,
        reason: reason,
        timestamp: block-height,
        status: REPORT_STATUS_PENDING
      }
    )
    ;; Mark that this user has reported this message
    (map-set user-message-reports
      { user: reporter, message-id: message-id }
      { reported: true }
    )
    (ok new-report-id)
  )
)

;; Take moderation action on a report (only moderators can call this)
;; @param report-id: The ID of the report to moderate
;; @param action: The action to take (warn, ban, or dismiss)
;; @returns: OK with the new action ID or an error
(define-public (moderate-report (report-id uint) (action (string-ascii 10)))
  (let
    (
      (moderator tx-sender)
      (report (get-report report-id))
      (new-action-id (+ (var-get last-action-id) u1))
      (is-mod (is-moderator moderator))
    )
    ;; Verify caller is a moderator
    (asserts! (get is-moderator is-mod) ERR_NOT_MODERATOR)
    ;; Verify report exists
    (asserts! (is-some report) ERR_REPORT_NOT_FOUND)
    ;; Validate action type
    (asserts!
      (or
        (is-eq action MODERATION_ACTION_WARN)
        (or
          (is-eq action MODERATION_ACTION_BAN)
          (is-eq action MODERATION_ACTION_DISMISS)
        )
      )
      ERR_INVALID_ACTION
    )
    ;; Unwrap report data
    (let
      (
        (report-data (unwrap! report ERR_REPORT_NOT_FOUND))
        (reported-user (get reporter report-data))
        (current-reputation (get-user-reputation reported-user))
      )
      ;; Increment action ID counter
      (var-set last-action-id new-action-id)
      ;; Store the moderation action
      (map-set moderation-actions
        { action-id: new-action-id }
        {
          moderator: moderator,
          report-id: report-id,
          action: action,
          timestamp: block-height
        }
      )
      ;; Update report status to approved
      (map-set reports
        { report-id: report-id }
        (merge report-data { status: REPORT_STATUS_APPROVED })
      )
      ;; Update user reputation based on action
      (if (is-eq action MODERATION_ACTION_WARN)
        (map-set user-reputation
          { user: reported-user }
          {
            reputation-score: (- (get reputation-score current-reputation) 10),
            warnings: (+ (get warnings current-reputation) u1),
            is-banned: (get is-banned current-reputation)
          }
        )
        (if (is-eq action MODERATION_ACTION_BAN)
          (map-set user-reputation
            { user: reported-user }
            {
              reputation-score: (- (get reputation-score current-reputation) 50),
              warnings: (get warnings current-reputation),
              is-banned: true
            }
          )
          true
        )
      )
      (ok new-action-id)
    )
  )
)

;; Add a user as a moderator (only contract owner can call this)
;; @param user: The principal of the user to add as moderator
;; @returns: OK or an error
(define-public (add-moderator (user principal))
  (begin
    ;; Verify caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Add user as moderator
    (map-set moderators
      { user: user }
      { is-moderator: true }
    )
    (ok true)
  )
)

;; Remove a user from moderator status (only contract owner can call this)
;; @param user: The principal of the user to remove as moderator
;; @returns: OK or an error
(define-public (remove-moderator (user principal))
  (begin
    ;; Verify caller is contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    ;; Remove user as moderator
    (map-set moderators
      { user: user }
      { is-moderator: false }
    )
    (ok true)
  )
)

;; Reject a report (only moderators can call this)
;; @param report-id: The ID of the report to reject
;; @returns: OK or an error
(define-public (reject-report (report-id uint))
  (let
    (
      (moderator tx-sender)
      (report (get-report report-id))
      (is-mod (is-moderator moderator))
    )
    ;; Verify caller is a moderator
    (asserts! (get is-moderator is-mod) ERR_NOT_MODERATOR)
    ;; Verify report exists
    (asserts! (is-some report) ERR_REPORT_NOT_FOUND)
    ;; Unwrap and update report status
    (let
      (
        (report-data (unwrap! report ERR_REPORT_NOT_FOUND))
      )
      (map-set reports
        { report-id: report-id }
        (merge report-data { status: REPORT_STATUS_REJECTED })
      )
      (ok true)
    )
  )
)

