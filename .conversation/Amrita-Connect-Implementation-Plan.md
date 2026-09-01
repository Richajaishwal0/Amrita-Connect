# Amrita Connect — Phased Implementation Plan

## Product goal

Build a professional university networking platform for the Amrita ecosystem—not a social-media feed. The first release should make it easy for a member to:

1. Register and create a trusted profile.
2. Discover people by campus, role, skills, interests, and research areas.
3. Find mentors, teammates, researchers, and opportunities.
4. Send and manage structured requests.
5. Communicate with approved connections.

The application should be built as a durable project with a responsive React web client, an Express REST API, MongoDB persistence, JWT-based authentication, and Socket.IO for real-time messaging.

---

## Recommended release strategy

### Release 1 — Trusted network MVP

Focus on the smallest coherent product loop:

- Authentication and protected routes
- User profiles with role-specific fields
- People search and filtering
- Mentorship requests
- Collaboration/team-finder posts and applications
- Opportunities and events browsing
- Basic notifications
- Admin moderation basics

### Release 2 — Network depth

- Research collaboration hub
- Campus Buddy
- Saved opportunities
- Event registration
- Richer dashboards and recommendations
- Conversation history and online presence

### Release 3 — Production polish

- Cloudinary image uploads
- Real-time messaging hardening
- Reporting and moderation workflows
- Analytics
- Performance, accessibility, security, and deployment readiness

This sequencing avoids building isolated screens with placeholder actions. Every phase ends with a usable vertical slice.

---

## Phase 0 — Product decisions and project setup

### Objective

Turn the brief into a stable project contract before implementation begins.

### Decisions to lock

- Campus list and department list
- Supported roles: `student`, `alumni`, `faculty`, `researcher`, `admin`
- Whether “senior” is represented as an alumni subtype or a separate role
- Email verification policy and allowed university email domains
- User verification states: pending, verified, rejected, suspended
- Whether users can message anyone or only users with an accepted relationship
- Initial moderation and reporting rules

### Deliverables

- Project workspace using Build mode
- React/Vite client and Express server
- Shared environment configuration
- `.env.example`
- Health-check endpoint and basic client shell
- ESLint/formatting conventions
- API error response contract

### Exit gate

The client starts, the server starts, `/api/health` responds, and the client can display server health without exposing secrets.

---

## Phase 1 — Data model and backend foundation

### Objective

Establish clean persistence and API conventions before adding feature complexity.

### Core models

- `User`
- `MentorshipRequest`
- `Collaboration`
- `CollaborationRequest`
- `ResearchOpportunity`
- `ResearchApplication`
- `Opportunity`
- `Event`
- `EventRegistration`
- `Conversation`
- `Message`
- `Notification`
- `CampusBuddyRequest`

### Shared model requirements

- Mongoose timestamps
- ObjectId references rather than large nested documents
- Indexes for email, campus, role, department, skills, interests, and searchable status fields
- Consistent status enums
- Pagination-ready query patterns
- Safe serialization that never returns password hashes or sensitive tokens

### Backend structure

```text
server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── sockets/
├── utils/
├── app.js
└── server.js
```

### Exit gate

MongoDB connection handling, request validation, 404 handling, centralized errors, and pagination work through a documented API pattern.

---

## Phase 2 — Authentication and authorization

### Objective

Create the trusted entry point for the network.

### Client features

- Landing page
- Registration
- Login
- Logout
- Session restoration
- Protected route wrapper
- Role-aware navigation
- Clear loading and invalid-credential states

### Registration fields

- Full name
- Email
- Password
- Role
- Campus
- Department
- Graduation year

### Backend features

- bcrypt password hashing
- JWT access-token flow
- Authentication middleware
- Role authorization middleware
- Duplicate-email handling
- Invalid-ID and validation handling
- Suspended/unverified account restrictions

### Security baseline

- Secrets only in environment variables
- No password or token logging
- Consistent unauthorized vs forbidden responses
- CORS restricted to the client origin
- Input validation on every write endpoint

### Exit gate

Users can register, log in, refresh the app without losing session state, access protected routes, and receive correct role-based access decisions.

---

## Phase 3 — Profiles and people discovery

### Objective

Make the network searchable and useful before adding requests.

### Profile features

- Basic profile editing
- Profile photo URL/public ID fields
- Skills and interests
- “I can help with”
- “I am looking for”
- Student projects, hackathons, certifications
- Alumni company, job role, experience, career journey, interview experience
- Faculty/researcher department, research areas, publications, projects
- Public profile detail page

### Discovery features

- Server-side search
- Filters for name, role, campus, department, skills, company, research area, graduation year, and interests
- Sorting
- Pagination
- Empty, loading, and error states
- Reusable profile cards

### Exit gate

A user can complete a profile and find relevant people through backend-filtered searches such as “Machine Learning seniors.”

---

## Phase 4 — Mentorship vertical slice

### Objective

Deliver the first complete relationship workflow.

### Student workflow

1. Discover a mentor.
2. Open the mentor profile.
3. Submit a request with a message, reason, and discussion topic.
4. Track pending, accepted, and rejected requests.

### Mentor workflow

- View received requests
- Open request details
- Accept or reject
- View accepted mentees

### Supporting behavior

- Prevent duplicate active requests
- Enforce valid requester/mentor roles
- Create notifications on request and decision
- Restrict state transitions to valid transitions

### Exit gate

Two test accounts can complete the full request lifecycle, with persisted status and notifications.

---

## Phase 5 — Collaboration and team finder

### Objective

Help users form project teams without turning the product into a social feed.

### Features

- Professional card/list layout
- Create, edit, archive, and view collaboration posts
- Required skills, team size, deadline, category, description, and current members
- Apply/request to join
- Creator applicant management
- Accept/reject applicants
- Team membership limits
- Duplicate-application prevention
- Notifications for application state changes

### Exit gate

A creator can publish a collaboration, receive applications, manage applicants, and maintain a team whose size and status remain consistent after refresh.

---

## Phase 6 — Opportunities and events

### Objective

Provide a reliable utility layer for career and campus activity.

### Opportunities

- Browse, search, and filter
- Categories: internships, jobs, research, hackathons, competitions, scholarships, workshops, projects
- Eligibility, skills, deadline, organization, application link
- Save/unsave
- Admin management

### Events

- Upcoming event list
- Date, time, campus, venue/online, organizer, capacity, registration link
- Register/cancel registration
- Capacity enforcement
- Admin create/edit/delete

### Exit gate

Users can find and save opportunities, register for events, and see accurate deadlines and registration states.

---

## Phase 7 — Research collaboration hub

### Objective

Give faculty, researchers, and students a structured research workflow.

### Features

- Research opportunity creation
- Domain, research areas, required skills, duration, mentor, participant limit, deadline
- Search and filtering
- Student applications
- Faculty/researcher applicant review
- Accepted research teams
- Application-status notifications

### Exit gate

A researcher can publish an opportunity, review applicants, accept a bounded team, and manage application states.

---

## Phase 8 — Campus Buddy

### Objective

Support students visiting another Amrita campus.

### Features

- Destination campus and visit dates
- Help category: navigation, accommodation, transport, food, events, academics, local help
- Description and request status
- Destination-campus matching
- Offer assistance
- Request owner and helper views
- Notifications for offers and status changes

### Exit gate

A visiting student can submit a request and an eligible member from the destination campus can offer assistance and update the request state.

---

## Phase 9 — Messaging and notifications

### Objective

Make accepted relationships actionable while keeping communication controlled.

### Messaging

- Authenticated conversations
- Conversation list
- Message history
- Real-time send/receive with Socket.IO
- Timestamps
- Online/offline presence
- Reconnect and socket-error states
- Server-side authorization for conversation access

### Notifications

- Mentorship request and decision
- Collaboration application and decision
- Research application status
- New message
- Event reminders
- Opportunity updates
- Read/unread state and timestamp

### Exit gate

Two authenticated users can exchange messages in real time, reload without losing history, and receive durable notification records.

---

## Phase 10 — Dashboards and admin panel

### Objective

Turn the individual modules into useful daily workspaces and a manageable platform.

### Member dashboards

Use role-specific modules:

- Students: mentors, collaborators, research, events, saved opportunities, requests, messages
- Alumni/seniors: mentorship requests, mentees, collaboration, recommended students, messages
- Faculty/researchers: research opportunities, applicants, teams, collaborations, messages

### Admin dashboard

- User search and detail view
- Verification
- Suspension and deletion
- Opportunity/event/research management
- Reported-content review
- Platform activity
- Counts by role and campus
- Active mentorships, collaborations, research opportunities, and events

### Exit gate

Admins can moderate the main platform entities, while non-admin users cannot access admin routes or APIs.

---

## Phase 11 — Cloudinary, quality, and production hardening

### Objective

Prepare the application for real users and maintainability.

### Hardening checklist

- Cloudinary signed or controlled uploads for profile images
- Store only URL/public ID in MongoDB
- Rate limiting on authentication and high-risk writes
- Strong password and payload validation
- Secure headers
- Audit logs for admin actions
- Consistent API response shapes
- Accessibility review: keyboard navigation, labels, contrast, focus states
- Responsive review across desktop, tablet, and mobile
- Error boundaries and resilient loading states
- Database indexes reviewed with representative queries
- Socket authorization and reconnect tests
- Production build from a clean environment

### Exit gate

The app installs and starts from a clean environment, core workflows remain functional on mobile, and secrets are not present in the client bundle or repository.

---

## Suggested route map

```text
/
/login
/register
/dashboard
/profile
/people
/people/:id
/mentorship
/mentorship/requests
/collaborations
/collaborations/:id
/research
/research/:id
/opportunities
/events
/campus-buddy
/messages
/notifications
/admin
/admin/users
/admin/events
/admin/opportunities
/admin/research
```

Every protected page should have a matching protected API policy. Admin pages should additionally require the `admin` role on the server, not just in the client router.

---

## API grouping

```text
/api/auth
/api/users
/api/mentorship
/api/collaborations
/api/research
/api/opportunities
/api/events
/api/campus-buddy
/api/messages
/api/notifications
/api/admin
```

Controllers should remain thin, with business rules in services and reusable validation in middleware/schema modules.

---

## Testing and verification gates

Testing should happen continuously rather than only at the end.

### Backend checks

- Auth success/failure cases
- Role restrictions
- Validation and duplicate prevention
- Pagination and filtering
- Relationship state transitions
- Capacity and team-size limits
- Admin-only operations

### Frontend checks

- Protected redirects
- Form validation
- Loading/empty/error states
- Responsive layouts
- Role-specific navigation
- Optimistic updates only where rollback is implemented

### End-to-end smoke flows

1. Register → log in → complete profile.
2. Search people → open profile → request mentorship.
3. Mentor accepts → both dashboards update.
4. Create collaboration → apply → accept applicant.
5. Browse opportunity → save it.
6. Browse event → register → cancel.
7. Open conversation → exchange messages.
8. Admin verifies a user and manages a listing.

---

## First implementation sprint

The first sprint should be deliberately narrow:

1. Create the project shell and server/client health check.
2. Add MongoDB configuration and the `User` model.
3. Implement registration, login, JWT middleware, and role guards.
4. Build protected layout, navigation, dashboard shell, and profile editing.
5. Seed only development fixtures behind an explicit development-only mechanism.
6. Verify the authentication and profile flow before starting discovery.

The next sprint should add people discovery and mentorship as the first complete platform loop.
