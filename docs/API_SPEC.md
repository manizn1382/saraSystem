# SaraSystem API Catalog and Specification

Last reviewed: 2026-07-11  
Scope: complete API inventory for the current SaraSystem repository, including implemented Django routes, front-end expected routes, and required planned routes for the full dormitory management system.

## Status Legend

| Status | Meaning |
| --- | --- |
| Implemented | Route, view, serializer, or SimpleJWT view exists in this repository. |
| Implemented with caveat | Route exists, but the current code has a known path, permission, response, or contract issue. |
| Front-end contract | The HTML/JavaScript calls or expects the endpoint, but no matching Django implementation exists in this repository. |
| Planned | Needed for the complete system based on SaraSystem requirements, but not implemented and not currently wired everywhere in the front end. |
| Alias | Compatibility path normalized by `assets/js/api.js`; not implemented by the back end unless explicitly listed elsewhere. |

## Service Boundaries

| Service | Current local base | Current route family | Notes |
| --- | --- | --- | --- |
| Account service | `http://127.0.0.1:8001` | `/api/v1/...` | Handles users, JWT login/refresh, roles, permissions, user-role, role-permission. |
| Dormitory service | `http://127.0.0.1:8000` | `/api/dormitory/`, `/api/rooms/`, `/api/beds/` | Handles dormitories, rooms, beds. |
| Application API | same origin `/api` or gateway | `/api/...` | Planned unified API surface for accommodation, assignments, payments, maintenance, announcements, reports, public data. |

Current front-end routing in `assets/js/api.js` sends account paths to the account service, dormitory/room/bed paths to the dormitory service, and all other `/api/...` paths to the configured general API base.

## Global API Conventions

### Transport

- Protocol: HTTPS in production.
- Format: JSON request and response bodies unless the endpoint explicitly accepts `multipart/form-data`.
- Charset: UTF-8.
- Headers:
  - `Accept: application/json`
  - `Content-Type: application/json` for JSON bodies
  - `Authorization: Bearer <access_token>` for protected endpoints

### Authentication

JWT authentication is expected for all non-public endpoints.

Anonymous endpoints:

- `POST /api/v1/users/create`
- `POST /api/v1/users/login`
- `POST /api/v1/users/token/refresh`
- `POST /api/v1/users/password/reset/username`
- `GET /api/public/stats/`
- `GET /api/announcements/public/`

All other endpoints should require a valid access token unless explicitly documented otherwise.

### JWT Claims Expected by Front End

The current account service adds these custom claims to the access token:

```json
{
  "user_id": 1,
  "username": "student001",
  "email": "student@example.com",
  "roles": ["student"],
  "permissions": ["accommodation.request.view"],
  "is_staff": false,
  "is_superuser": false,
  "first_name": "Sara",
  "last_name": "Ahmadi",
  "is_active": true,
  "profile": {
    "nationalId": 1234567890,
    "studentId": 402123456,
    "gender": "f",
    "isVerified": false,
    "phone": "09123456789",
    "profileImage": ""
  }
}
```

### Standard List Shape

Current implemented endpoints sometimes return bare arrays and sometimes return custom envelopes. New endpoints should support this paginated shape:

```json
{
  "count": 120,
  "next": "https://api.example.com/api/resource/?page=3",
  "previous": "https://api.example.com/api/resource/?page=1",
  "page": 2,
  "page_size": 20,
  "results": []
}
```

The front end already tolerates bare arrays, `{ "data": [] }`, `{ "items": [] }`, and paginated `{ "results": [] }`.

### Standard Success Envelope

New write endpoints should use:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

Current implemented endpoints vary between `success`, `status`, `message`, direct arrays, and direct serializer objects. This catalog records current behavior where known.

### Standard Error Envelope

Recommended:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "field_name": ["This field is required."]
  }
}
```

Accepted by current front end:

- `detail`
- `message`
- `error`
- `errors`
- `field_errors`
- field-level keys directly on the response body

### Common HTTP Status Codes

| Code | Use |
| --- | --- |
| `200 OK` | Successful read, update, delete action with response body. |
| `201 Created` | Successful create. |
| `204 No Content` | Successful delete when no response body is needed. |
| `400 Bad Request` | Invalid request shape or invalid action state. |
| `401 Unauthorized` | Missing, expired, or invalid token. |
| `403 Forbidden` | Authenticated user lacks required role or permission. |
| `404 Not Found` | Resource does not exist or is not visible to the user. |
| `409 Conflict` | Business conflict, such as already occupied bed or duplicate active assignment. |
| `422 Unprocessable Entity` | Semantically invalid data when syntax is valid. |
| `429 Too Many Requests` | Rate limit. |
| `500 Server Error` | Unexpected server failure. |

## Shared Status Values

| Domain | Values |
| --- | --- |
| Account | `active`, `inactive`, `not_verified` |
| User `is_active` | `true`, `false` |
| Gender | `m`, `f` |
| Dormitory gender | `m`, `f` |
| Dormitory type | `b`, `g` |
| Room status | `available`, `full`, `maintenance`, `closed`; front-end also uses `active`, `inactive` |
| Bed status | `available`, `occupied`, `reserved`, `maintenance` |
| Accommodation request status | `pending`, `approved`, `rejected`, `assigned`, `cancelled` |
| Bed assignment status | `active`, `inactive`, `ended`, `cancelled` |
| Payment status | `unpaid`, `pending`, `paid`, `overdue`, `cancelled` |
| Maintenance status | `pending`, `assigned`, `progress`, `in_progress`, `resolved`, `rejected`, `cancelled` |
| Maintenance priority | `low`, `medium`, `high`, `urgent` |
| Announcement state | `active`, `inactive`, `read`, `unread` |

## Implemented Account Service APIs

Important caveat: `account_service/account_service/urls.py` mounts child URL modules without trailing slashes, while child routes start with `/`. The intended paths below match the front-end normalizer. If Django returns 404, remove leading slashes from child `path()` routes or add trailing slashes consistently.

### `POST /api/v1/users/create`

Status: Implemented  
Auth: anonymous  
View: `UserCreateView`  
Purpose: create a Django `User` plus `userProfile`.

Request:

```json
{
  "username": "student001",
  "email": "student@example.com",
  "password": "strong-password",
  "confirm_password": "strong-password",
  "first_name": "Sara",
  "last_name": "Ahmadi",
  "profile": {
    "nationalId": 1234567890,
    "studentId": 402123456,
    "phone": "09123456789",
    "gender": "f",
    "profileImage": ""
  }
}
```

Response `201`:

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "student001",
    "email": "student@example.com",
    "first_name": "Sara",
    "last_name": "Ahmadi"
  }
}
```

Validation notes:

- `password` and `confirm_password` must match.
- Profile object is required by the current serializer.
- Current serializer stores `nationalId` and `studentId` as integers.

### `POST /api/v1/users/login`

Status: Implemented  
Auth: anonymous  
View: `UserLoginView`  
Purpose: authenticate and issue JWT refresh/access tokens.

Request:

```json
{
  "username": "student001",
  "password": "strong-password"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "tokens": {
    "refresh": "<refresh-token>",
    "access": "<access-token>"
  }
}
```

Errors:

- `401` invalid username/password.
- `403` disabled account.

### `POST /api/v1/users/token/refresh`

Status: Implemented  
Auth: anonymous with valid refresh token in body  
View: SimpleJWT `TokenRefreshView`  
Purpose: issue a new access token.

Request:

```json
{
  "refresh": "<refresh-token>"
}
```

Expected response:

```json
{
  "access": "<new-access-token>"
}
```

The front end also sends `refresh_token` for tolerance, but SimpleJWT requires `refresh`.

### `GET /api/v1/users/current`

Status: Implemented  
Auth: authenticated  
View: `UserDetailView`  

Current response `200`:

```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "student001",
    "email": "student@example.com",
    "first_name": "Sara",
    "last_name": "Ahmadi",
    "is_active": true,
    "roles": ["student"],
    "permissions": ["accommodation.request.view"],
    "profile": {
      "nationalId": 1234567890,
      "studentId": 402123456,
      "phone": "09123456789",
      "gender": "f",
      "profileImage": "",
      "isVerified": false
    }
  }
}
```

### `PATCH /api/v1/users/password/change`

Status: Implemented  
Auth: authenticated  
View: `ChangePasswordView`  
Purpose: change password for current user.

Request:

```json
{
  "current_password": "old-password",
  "new_password": "new-password",
  "confirm_password": "new-password"
}
```

Response:

```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "user_id": 1,
    "username": "student001"
  }
}
```

Validation notes:

- `new_password` and `confirm_password` must match.
- `current_password` is optional in serializer but should be required in production.

### `PUT /api/v1/users/editProfile`

Status: Implemented  
Auth: authenticated  
View: `EditProfileView`  
Purpose: update current user's profile and basic user fields.

Request:

```json
{
  "email": "new@example.com",
  "first_name": "Sara",
  "last_name": "Ahmadi",
  "profile": {
    "nationalId": 1234567890,
    "studentId": 402123456,
    "phone": "09123456789",
    "gender": "f",
    "profileImage": "profiles/sara.jpg"
  }
}
```

Response:

```json
{
  "success": true,
  "message": "profile updated successfully"
}
```

### `GET /api/v1/users/list`

Status: Implemented  
Auth: admin (`IsAuthenticated`, `IsAdminUser`)  
View: `ListUserView`  
Purpose: list users with profile, roles, and permissions.

Query params:

| Param | Type | Description |
| --- | --- | --- |
| `username` | string | Case-insensitive username filter. |
| `email` | string | Case-insensitive email filter. |
| `is_active` | boolean string | Active/inactive filter. |
| `studentId` | integer | Exact profile student ID. |
| `nationalId` | integer | Exact profile national ID. |

Response item:

```json
{
  "id": 1,
  "username": "student001",
  "email": "student@example.com",
  "first_name": "Sara",
  "last_name": "Ahmadi",
  "is_active": true,
  "profile": {
    "nationalId": 1234567890,
    "studentId": 402123456,
    "phone": "09123456789",
    "gender": "f",
    "profileImage": ""
  },
  "roles": ["student"],
  "permissions": ["View Accommodation"]
}
```

### `DELETE /api/v1/users/delete/{id}`

Status: Implemented  
Auth: admin  
View: `UserDeleteView`  
Purpose: delete user by ID.

Front-end base constant: `/api/v1/users/delete`, called as `/api/v1/users/delete/{id}`.

Response:

```json
{
  "success": true,
  "message": "user deleted successfully",
  "deleted_by": {
    "id": 10,
    "username": "admin001"
  }
}
```

### `PATCH /api/v1/users/status/change`

Status: Implemented  
Auth: admin  
View: `ChangeStatusView`  
Purpose: activate or deactivate user.

Request:

```json
{
  "id": 1,
  "is_active": false
}
```

Response:

```json
{
  "success": true,
  "message": "user status changed successfully",
  "changed_by": {
    "id": 10,
    "username": "admin001"
  }
}
```

### `PUT /api/v1/users/adminUpdate`

Status: Implemented  
Auth: admin  
View: `AdminEditView`  
Purpose: admin update of another user's profile/basic fields.

Request:

```json
{
  "id": 1,
  "email": "student@example.com",
  "first_name": "Sara",
  "last_name": "Ahmadi",
  "profile": {
    "nationalId": 1234567890,
    "studentId": 402123456,
    "phone": "09123456789",
    "gender": "f",
    "profileImage": ""
  }
}
```

Response:

```json
{
  "success": true,
  "message": "user profile updated successfully",
  "update_By": {
    "user_id": 10,
    "username": "admin001"
  }
}
```

### `POST /api/v1/role/create`

Status: Implemented  
Auth: admin  
View: `RoleCreateView`  
Purpose: create role.

Request:

```json
{
  "name": "student",
  "description": "Student user"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Role created successfully",
  "role": {
    "id": 1,
    "name": "student",
    "description": "Student user"
  }
}
```

### `GET /api/v1/role/list`

Status: Implemented  
Auth: admin  
View: `RoleListView`  
Purpose: list roles.

Response item:

```json
{
  "id": 1,
  "name": "student",
  "description": "Student user"
}
```

### `PATCH /api/v1/role/update/{id}`

Status: Implemented  
Auth: admin  
View: `UpdateRoleView`  
Purpose: update role name and/or description.

Front-end base constant: `/api/v1/role/update`, called as `/api/v1/role/update/{id}`.

Request:

```json
{
  "name": "dormitory_admin",
  "description": "Dormitory supervisor"
}
```

Response:

```json
{
  "success": true,
  "message": "role updated successfully",
  "updated_fields": ["name", "description"],
  "role": {
    "id": 2,
    "name": "dormitory_admin",
    "description": "Dormitory supervisor"
  }
}
```

### `DELETE /api/v1/role/delete/{id}`

Status: Implemented  
Auth: admin  
View: `RoleDeleteView`  
Purpose: delete role by ID.

Front-end base constant: `/api/v1/role/delete`, called as `/api/v1/role/delete/{id}`.

Response:

```json
{
  "success": true,
  "message": "role deleted successfully",
  "deleted_by": {
    "id": 10,
    "username": "admin001"
  }
}
```

### `POST /api/v1/permission/create`

Status: Implemented  
Auth: admin  
View: `PermissionCreateView`  
Purpose: create permission.

Request:

```json
{
  "name": "View accommodation requests",
  "code": "accommodation.request.view",
  "description": "Can view accommodation requests"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "permission created successfully",
  "permission": {
    "id": 1,
    "code": "accommodation.request.view",
    "name": "View accommodation requests",
    "description": "Can view accommodation requests"
  }
}
```

### `GET /api/v1/permission/list`

Status: Implemented  
Auth: admin  
View: `PermissionListView`  
Purpose: list permissions.

Response item:

```json
{
  "id": 1,
  "name": "View accommodation requests",
  "code": "accommodation.request.view",
  "description": "Can view accommodation requests"
}
```

### `POST /api/v1/userRole/create`

Status: Implemented  
Auth: admin  
View: `UserRoleCreateView`  
Purpose: assign role to user.

Request:

```json
{
  "user": 1,
  "role": 2
}
```

Response `201`:

```json
{
  "success": true,
  "message": "userRole created successfully",
  "userRole": {
    "userName": "student001",
    "roleName": "student"
  }
}
```

### `POST /api/v1/rolePermission/create`

Status: Implemented  
Auth: admin  
View: `RolePermissionCreateView`  
Purpose: attach permission to role.

Request:

```json
{
  "role": 2,
  "permission": 1
}
```

Response `201`:

```json
{
  "success": true,
  "message": "rolePermission created successfully",
  "rolePermission": {
    "permissionName": "View accommodation requests",
    "roleName": "student"
  }
}
```

## Implemented Dormitory Service APIs

### `GET /api/dormitory/listAll/`

Status: Implemented  
Auth: authenticated admin (`JWTStatelessUserAuthentication`, `IsAdminUser`)  
View: `DormitoryListView`  
Purpose: list dormitories.

Response item:

```json
{
  "id": 1,
  "name": "Dormitory 1",
  "address": "Main campus",
  "totalRoom": 42,
  "gender": "f",
  "occupancy_percentage": 75.0,
  "available_capacity": 12,
  "currentOccupancy": 30
}
```

Implementation note: `available_capacity` is currently `totalRoom - currentOccupancy`, so it acts like available rooms or capacity units depending on how `currentOccupancy` is maintained.

### `GET /api/dormitory/withRooms/`

Status: Implemented  
Auth: authenticated  
View: `DormitoryWithRoomsView`  
Purpose: list dormitories with nested room dropdown data.

Response item:

```json
{
  "id": 1,
  "name": "Dormitory 1",
  "rooms": [
    {
      "id": 10,
      "roomNumber": 201,
      "capacity": 4
    }
  ]
}
```

### `POST /api/dormitory/createDorm/`

Status: Implemented  
Auth: authenticated; code requires `request.user.is_staff`  
View: `DormCreateView`  
Purpose: create dormitory.

Request:

```json
{
  "name": "Dormitory 1",
  "address": "Main campus",
  "totalRoom": 42,
  "gender": "f",
  "currentOccupancy": 0
}
```

Response `201`:

```json
{
  "status": "success",
  "message": "Dorm created successfully",
  "data": {
    "id": 1,
    "name": "Dormitory 1",
    "address": "Main campus",
    "totalRoom": 42,
    "gender": "f",
    "occupancy_percentage": 0,
    "available_capacity": 42,
    "currentOccupancy": 0
  }
}
```

### `PUT /api/dormitory/updateDorm/{id}`

Status: Implemented  
Auth: authenticated; code requires `request.user.is_staff`  
View: `DormUpdateView`  
Purpose: replace dormitory fields.

Body: same writable fields as create.

### `PATCH /api/dormitory/updateDorm/{id}`

Status: Implemented  
Auth: authenticated; code requires `request.user.is_staff`  
View: `DormUpdateView`  
Purpose: partially update dormitory fields.

Body example:

```json
{
  "address": "New campus address"
}
```

### `GET /api/rooms/listAllRoom/`

Status: Implemented  
Auth: authenticated  
View: `RoomListView`  
Purpose: list rooms.

Query params:

| Param | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by room status. |
| `dormId` | integer | Filter by dormitory ID. |

Response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 10,
      "roomNumber": 201,
      "dormitory": 1,
      "floorNumber": 2,
      "capacity": 4,
      "status": "available",
      "currentOccupancy": 2
    }
  ]
}
```

### `GET /api/rooms/listAllRoomBeds/{room_id}`

Status: Implemented  
Auth: authenticated  
View: `RoomBedsListView`  
Purpose: list beds for one room.

Response item:

```json
{
  "id": 100,
  "bedNumber": "1",
  "status": "available",
  "room": 10
}
```

### `POST /api/rooms/createRoom/`

Status: Implemented
View: `RoomCreateView`  
Purpose: create room.

Request:

```json
{
  "roomNumber": 201,
  "dormitory": 1,
  "floorNumber": 2,
  "capacity": 4,
  "status": "available",
  "currentOccupancy": 0
}
```

Response `201` currently returns `success: false` even on success:

```json
{
  "success": false,
  "message": "room created successfully",
  "data": {}
}
```

Fix recommendation: return `success: true`.

### `DELETE /api/rooms/deleteRoom/{id}`

Status: Implemented  
Auth: authenticated; code requires `request.user.is_staff`  
View: `RoomDeleteView`  
Purpose: delete room.

Response:

```json
{
  "message": "Room 201 in Dormitory 1 deleted successfully"
}
```

### `PUT /api/rooms/updateRoom/{id}`

Status: Implemented 
View: `RoomUpdateView`  
Purpose: replace room fields.

Fix recommendation: add JWT authentication and `IsAuthenticated`.

### `PATCH /api/rooms/updateRoom/{id}`

Status: Implemented
View: `RoomUpdateView`  
Purpose: partially update room fields.

### `GET /api/beds/listAll/`

Status: Implemented  
Auth: authenticated  
View: `BedListView`  
Purpose: list beds.

Response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 100,
      "bedNumber": "1",
      "status": "available",
      "room": 10
    }
  ]
}
```

### `GET /api/beds/listAll/{status}`

Status: Implemented  
Auth: authenticated  
View: `BedListView`  
Purpose: list beds filtered by status.

Path values:

- `available`
- `occupied`
- `reserved`
- `maintenance`

### `POST /api/beds/createBed/`

Status: Implemented  
Auth: authenticated; code requires `request.user.is_staff`  
View: `BedCreateView`  
Purpose: create bed.

Request:

```json
{
  "bedNumber": "1",
  "status": "available",
  "room": 10
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Bed created successfully",
  "data": {
    "id": 100,
    "bedNumber": "1",
    "status": "available",
    "room": 10
  }
}
```

### `GET /api/beds/getBedById/{id}`

Status: Implemented  
Auth: authenticated  
View: `BedDetailView`  
Purpose: retrieve one bed.

Response:

```json
{
  "id": 100,
  "bedNumber": "1",
  "status": "available",
  "room": 10
}
```

### `PUT /api/beds/updateBed/{id}`

Status: Implemented   
View: `BedUpdateView`  
Purpose: replace bed fields.

### `PATCH /api/beds/updateBed/{id}`

Status: Implemented  
View: `BedUpdateView`  
Purpose: partially update bed fields.

## Front-End Alias Paths

These paths are normalized in `assets/js/api.js` before being sent. They are aliases, not separate back-end implementations.

| Alias path | Normalized path |
| --- | --- |
| `/api/accounts/getToken/` | `/api/v1/users/login` |
| `/api/accounts/refreshToken/` | `/api/v1/users/token/refresh` |
| `/api/accounts/me/` | `/api/v1/users/current` |
| `/api/accounts/register/` | `/api/v1/users/create` |
| `/api/accounts/users/register/` | `/api/v1/users/create` |
| `GET /api/accounts/users/` | `/api/v1/users/list` |
| `POST /api/accounts/users/` | `/api/v1/users/create` |
| `/api/accounts/update-profile/` | `/api/v1/users/editProfile` |
| `/api/accounts/editProfile/` | `/api/v1/users/editProfile` |
| `/api/accounts/users/admin-update/` | `/api/v1/users/adminUpdate` |
| `/api/accounts/users/update/` | `/api/v1/users/adminUpdate` |
| `/api/accounts/adminUpdate/` | `/api/v1/users/adminUpdate` |
| `/api/accounts/change-password/` | `/api/v1/users/password/change` |
| `/api/accounts/changePassword/` | `/api/v1/users/password/change` |
| `/api/accounts/reset-password/` | `/api/v1/users/password/reset/username` |
| `/api/accounts/forgot-password/` | `/api/v1/users/password/reset/username` |
| `/api/accounts/password/reset/username/` | `/api/v1/users/password/reset/username` |
| `/api/v1/users/changePassword` | `/api/v1/users/password/change` |
| `GET /api/accounts/roles/` | `/api/v1/role/list` |
| `POST /api/accounts/roles/` | `/api/v1/role/create` |
| `GET /api/accounts/permissions/` | `/api/v1/permission/list` |
| `POST /api/accounts/permissions/` | `/api/v1/permission/create` |
| `/api/accounts/role-permissions/` | `/api/v1/rolePermission/create` |
| `/api/accounts/user-roles/` | `/api/v1/userRole/create` |

## Planned Account and RBAC APIs

These are required to make the account/RBAC module complete and easier to consume.

### `GET /api/v1/users/{id}`

Status: implemented
Auth: admin, or current user for own record  
Purpose: get one user with profile, roles, and permissions.

Response if request.id doesn't fit user id that requester wants to see:

```json
{
  "success": "False",
  "message": "only admins can see other users data"
}
"status":"403(forbidden)"
```

### `PUT /api/v1/users/editProfile`

Status: Implemented  
Auth: admin, or current user for limited own fields  
notice: if you want to send patch request, you can use put without occure problem.

request:

```json
{
  "user":{},
  "profile":{},
}
```

response in 200 scenario:

```json
{
  "success": "True",
  "message": "profile updated successfully"
}
```

### `POST /api/v1/users/logout`

Status: implemented
Auth: authenticated  
Purpose: optional refresh-token blacklist endpoint.

Request:

```json
{
  "refresh": "<refresh-token>"
}
```

### `POST /api/v1/users/password/reset/username`

Status: implemented 
Auth: anonymous  
Purpose: change a user's password by username only, without current password, reset token, email, SMS, or any external verification channel.

This endpoint is intentionally weak and should be treated as a prototype/version-limited fallback only. Anyone who knows a username can set a new password for that account. Do not use this flow in production without adding an additional verification factor or restricting it to an administrator-assisted workflow.

Request:

```json
{
  "username": "student001",
  "new_password": "new-password",
  "confirm_password": "new-password"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

Validation and handling notes:

- `username`, `new_password`, and `confirm_password` are required.
- `new_password` and `confirm_password` must match.
- The backend should apply the same password-strength rules used during registration.
- The backend should rate-limit this endpoint and log every attempt.
- The backend should invalidate existing refresh/access tokens for the user after a successful change, if token blacklisting/session invalidation is available.
- Because this flow allows account takeover by username, it should be removed or replaced once email/SMS/admin verification becomes viable.

### `GET /api/v1/userRole/list`

Status: Planned  
Auth: admin  
Purpose: list user-role assignments.

Query params: `user`, `role`, `page`, `page_size`.

### `DELETE /api/v1/userRole/delete/{id}`

Status: Planned  
Auth: admin  
Purpose: remove role from user.

### `GET /api/v1/rolePermission/list`

Status: Planned  
Auth: admin  
Purpose: list role-permission assignments.

Query params: `role`, `permission`, `page`, `page_size`.

### `DELETE /api/v1/rolePermission/delete/{id}`

Status: Planned  
Auth: admin  
Purpose: detach permission from role. The front-end checklist calls this out as missing.

### `PATCH /api/v1/permission/update/{id}`

Status: Planned  
Auth: admin  
Purpose: update permission metadata.

### `DELETE /api/v1/permission/delete/{id}`

Status: Planned  
Auth: admin  
Purpose: delete permission.

## Planned RESTful Dormitory API Aliases

The implemented dormitory routes use action-style names (`listAll`, `createDorm`, `updateRoom`). These RESTful aliases are recommended for the complete API while keeping existing endpoints as backward-compatible aliases.

### Dormitories

| Method | Path | Status | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/dormitories/` | Planned alias | List dormitories. |
| `POST` | `/api/dormitories/` | Planned alias | Create dormitory. |
| `GET` | `/api/dormitories/{id}/` | Planned | Retrieve dormitory. |
| `PUT` | `/api/dormitories/{id}/` | Planned alias | Replace dormitory. |
| `PATCH` | `/api/dormitories/{id}/` | Planned alias | Partial update dormitory. |
| `DELETE` | `/api/dormitories/{id}/` | Planned | Delete or deactivate dormitory. |
| `GET` | `/api/dormitories/{id}/rooms/` | Planned alias | List rooms in dormitory. |
| `GET` | `/api/dormitories/{id}/capacity/` | Planned | Dormitory capacity summary. |

Recommended dormitory query params:

| Param | Description |
| --- | --- |
| `gender` | `m` or `f`. |
| `status` | If a future status field is added. |
| `q` | Name/address search. |
| `page`, `page_size` | Pagination. |

### Rooms

| Method | Path | Status | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/rooms/` | Planned alias | List rooms. |
| `POST` | `/api/rooms/` | Planned alias | Create room. |
| `GET` | `/api/rooms/{id}/` | Planned | Retrieve room. |
| `PUT` | `/api/rooms/{id}/` | Planned alias | Replace room. |
| `PATCH` | `/api/rooms/{id}/` | Planned alias | Partial update room. |
| `DELETE` | `/api/rooms/{id}/` | Planned alias | Delete room. |
| `GET` | `/api/rooms/{id}/beds/` | Planned alias | List beds in room. |

Recommended room query params:

| Param | Description |
| --- | --- |
| `dormitory_id` | Filter by dormitory. |
| `status` | Room status. |
| `floorNumber` or `floor_number` | Filter by floor. |
| `q` | Room number search. |

### Beds

| Method | Path | Status | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/beds/` | Planned alias | List beds. |
| `POST` | `/api/beds/` | Planned alias | Create bed. |
| `GET` | `/api/beds/{id}/` | Planned alias | Retrieve bed. |
| `PUT` | `/api/beds/{id}/` | Planned alias | Replace bed. |
| `PATCH` | `/api/beds/{id}/` | Planned alias | Partial update bed/status. |
| `DELETE` | `/api/beds/{id}/` | Planned | Delete bed. |

Recommended bed query params:

| Param | Description |
| --- | --- |
| `room_id` | Filter by room. |
| `dormitory_id` | Filter by dormitory through room. |
| `status` | Bed status. |
| `available_only` | Boolean helper for assignment screens. |

## Front-End Contract: Public APIs

### `GET /api/public/stats/`

Status: Front-end contract  
Auth: anonymous  
Used by: `frontend/index.html`  
Purpose: landing-page public metrics.

Response:

```json
{
  "dormitories_count": 5,
  "rooms_count": 220,
  "available_beds_count": 81,
  "maintenance_open_count": 12,
  "announcements_count": 3
}
```

### `GET /api/announcements/public/`

Status: Front-end contract  
Auth: anonymous  
Used by: `frontend/index.html`  
Purpose: public active announcements visible before login.

Query params: `limit`, `page`, `page_size`.

Response item:

```json
{
  "id": 21,
  "title": "Dormitory registration opened",
  "content": "Students can submit accommodation requests.",
  "created_at": "2026-07-10T12:00:00Z",
  "expires_at": null,
  "is_active": true
}
```

## Front-End Contract: Accommodation Request APIs

Entity: `AccommodationRequest`

Recommended fields:

```json
{
  "id": 101,
  "code": "REQ-101",
  "user": {
    "id": 11,
    "first_name": "Sara",
    "last_name": "Ahmadi",
    "student_id": "402123001"
  },
  "requested_dormitory": {
    "id": 1,
    "name": "Dormitory 1"
  },
  "requested_dormitory_id": 1,
  "preferred_room_type": "shared",
  "semester": "1404-1405-1",
  "status": "pending",
  "request_date": "2026-07-10",
  "description": "Student notes",
  "review_note": "",
  "rejection_reason": "",
  "created_at": "2026-07-10T12:00:00Z",
  "updated_at": "2026-07-10T12:00:00Z"
}
```

### `GET /api/accommodation-requests/`

Status: Front-end contract  
Auth: authenticated  
Roles: student sees own requests; dormitory admin sees assigned dormitory requests; system admin sees all.

Query params:

| Param | Description |
| --- | --- |
| `status` | `pending`, `approved`, `rejected`, `assigned`, `cancelled`. |
| `semester` | Semester/term filter. |
| `requested_dormitory_id` | Dormitory filter. |
| `user_id` | Student filter for admins. |
| `student_id` | Student-number filter for admins. |
| `q` | Search by code/student/name. |
| `page`, `page_size` | Pagination. |
| `ordering` | Example: `-request_date`, `status`. |

### `POST /api/accommodation-requests/`

Status: Front-end contract  
Auth: student/resident  
Used by: student dashboard accommodation form.

Request:

```json
{
  "requested_dormitory_id": 1,
  "preferred_room_type": "shared",
  "semester": "1404-1405-1",
  "request_date": "2026-07-10",
  "description": "I prefer a shared room near faculty."
}
```

Server rules:

- User should be taken from JWT, not trusted from body.
- New status should default to `pending`.
- Reject duplicate active pending/approved requests if policy allows only one per semester.

### `GET /api/accommodation-requests/{id}/`

Status: Planned  
Auth: owner, dormitory admin, or system admin  
Purpose: retrieve one request and review history.

### `PATCH /api/accommodation-requests/{id}/`

Status: Front-end contract  
Auth: owner for pending request edits/cancel; admin for controlled fields  
Used by: student edit/cancel actions.

Edit request:

```json
{
  "requested_dormitory_id": 1,
  "preferred_room_type": "double",
  "semester": "1404-1405-1",
  "request_date": "2026-07-10",
  "description": "Updated notes"
}
```

Cancel request:

```json
{
  "status": "cancelled"
}
```

Server rules:

- Student may edit or cancel only `pending` requests.
- Admin review should use the review endpoint below.

### `PATCH /api/accommodation-requests/review/`

Status: Front-end contract  
Auth: dormitory admin or system admin  
Used by: dormitory admin review modal.

Request:

```json
{
  "request_id": 101,
  "status": "approved",
  "review_note": "Approved for assignment."
}
```

Rejected request:

```json
{
  "request_id": 101,
  "status": "rejected",
  "review_note": "Incomplete documentation."
}
```

Response:

```json
{
  "success": true,
  "message": "Review decision saved.",
  "id": 101,
  "status": "approved",
  "review_note": "Approved for assignment."
}
```

Recommended REST alias: `PATCH /api/accommodation-requests/{id}/review/`.

### `GET /api/accommodation-requests/{id}/history/`

Status: Planned  
Auth: owner, dormitory admin, or system admin  
Purpose: show status/review/assignment history.

## Front-End Contract: Bed Assignment APIs

Entity: `BedAssignment`

Recommended fields:

```json
{
  "id": 501,
  "request_id": 101,
  "user": {
    "id": 13,
    "first_name": "Sara",
    "last_name": "Ahmadi"
  },
  "bed": {
    "id": 100,
    "bedNumber": "3",
    "room": {
      "id": 10,
      "roomNumber": 201,
      "dormitory": {
        "id": 1,
        "name": "Dormitory 1"
      }
    }
  },
  "user_id": 13,
  "bed_id": 100,
  "start_date": "2026-09-23",
  "end_date": null,
  "status": "active",
  "notes": "Current semester assignment"
}
```

### `GET /api/bed-assignments/`

Status: Front-end contract  
Auth: authenticated  
Roles: student sees own assignments; dormitory admin sees managed dormitories; system admin sees all.

Query params:

| Param | Description |
| --- | --- |
| `user_id` | Student/user filter. |
| `bed_id` | Bed filter. |
| `room_id` | Room filter. |
| `dormitory_id` | Dormitory filter. |
| `status` | `active`, `inactive`, `ended`, `cancelled`. |
| `active_only` | Boolean. |
| `page`, `page_size` | Pagination. |

### `POST /api/bed-assignments/`

Status: Front-end contract  
Auth: dormitory admin or system admin  
Used by: dormitory admin assignment modal.

Request:

```json
{
  "request_id": 101,
  "user_id": 13,
  "bed_id": 100,
  "start_date": "2026-09-23",
  "end_date": null,
  "status": "active",
  "notes": "Current semester assignment"
}
```

Server rules:

- Request must be `approved`.
- Bed must be `available`.
- User must not have another `active` assignment.
- Bed must not have another `active` assignment.
- On success, set request status to `assigned` and bed status to `occupied`.

Conflict response:

```json
{
  "success": false,
  "message": "Active assignment conflict.",
  "errors": {
    "bed_id": ["This bed already has an active assignment."]
  }
}
```

Use `409 Conflict`.

### `GET /api/bed-assignments/{id}/`

Status: Planned  
Auth: visible assignment only  
Purpose: retrieve assignment detail.

### `PATCH /api/bed-assignments/{id}/`

Status: Planned  
Auth: dormitory admin or system admin  
Purpose: end, cancel, or update assignment notes/date.

Request examples:

```json
{
  "status": "ended",
  "end_date": "2027-06-20",
  "notes": "Semester ended"
}
```

```json
{
  "status": "cancelled",
  "notes": "Assignment entered by mistake"
}
```

### `GET /api/bed-assignments/current/`

Status: Planned  
Auth: authenticated student/resident  
Purpose: retrieve current active assignment for the logged-in user.

## Front-End Contract: Payment APIs

Entity: `Payment`

Recommended fields:

```json
{
  "id": 1001,
  "user_id": 13,
  "assignment_id": 501,
  "payment_type": "semester_rent",
  "amount": 2500000,
  "currency": "IRR",
  "due_date": "2026-10-07",
  "paid_at": null,
  "transaction_ref": "",
  "status": "unpaid",
  "description": "First installment",
  "created_at": "2026-07-10T12:00:00Z",
  "updated_at": "2026-07-10T12:00:00Z"
}
```

### `GET /api/payments/`

Status: Front-end contract  
Auth: authenticated  
Roles: student sees own payments; admins see allowed scope.

Query params:

| Param | Description |
| --- | --- |
| `user_id` | User filter for admins. |
| `assignment_id` | Assignment filter. |
| `status` | `unpaid`, `pending`, `paid`, `overdue`, `cancelled`. |
| `due_before`, `due_after` | Due date range. |
| `q` | Search payment type/reference. |
| `page`, `page_size` | Pagination. |

### `POST /api/payments/`

Status: Planned  
Auth: system admin or dormitory admin with finance permission  
Purpose: create a payment/debt record.

Request:

```json
{
  "user_id": 13,
  "assignment_id": 501,
  "payment_type": "semester_rent",
  "amount": 2500000,
  "currency": "IRR",
  "due_date": "2026-10-07",
  "status": "unpaid",
  "description": "First installment"
}
```

### `GET /api/payments/{id}/`

Status: Planned  
Auth: owner or finance/admin role  
Purpose: payment detail.

### `PATCH /api/payments/{id}/`

Status: Planned  
Auth: finance/admin role  
Purpose: update status, due date, amount, transaction reference, description.

Request:

```json
{
  "status": "paid",
  "paid_at": "2026-10-01T09:30:00Z",
  "transaction_ref": "TRX-20261001-001"
}
```

### `POST /api/payments/{id}/mark-paid/`

Status: Planned  
Auth: finance/admin role  
Purpose: explicit action endpoint for marking paid.

Request:

```json
{
  "paid_at": "2026-10-01T09:30:00Z",
  "transaction_ref": "TRX-20261001-001",
  "note": "Manual verification"
}
```

### `POST /api/payments/{id}/mark-unpaid/`

Status: Planned  
Auth: finance/admin role  
Purpose: reverse or correct payment state.

### `POST /api/payments/{id}/start/`

Status: Planned future integration  
Auth: payment owner  
Purpose: optional future payment-gateway redirect creation.

Response:

```json
{
  "redirect_url": "https://gateway.example/pay/session",
  "transaction_ref": "TRX-20261001-001"
}
```

Front-end rule: do not implement real banking logic in the front end.

### `POST /api/payments/gateway/callback/`

Status: Planned future integration  
Auth: gateway/server-to-server signature, not user JWT  
Purpose: payment gateway callback. This is a back-end integration endpoint only.

## Front-End Contract: Maintenance Request APIs

Entity: `MaintenanceRequest`

Recommended fields:

```json
{
  "id": 401,
  "title": "Broken light",
  "description": "Main room light does not turn on.",
  "user_id": 13,
  "dormitory_id": 1,
  "room_id": 10,
  "bed_id": 100,
  "location": "Dormitory 1, room 201, bed 3",
  "priority": "medium",
  "status": "pending",
  "assigned_to": null,
  "resolution_note": "",
  "resolved_at": null,
  "created_at": "2026-07-10T12:00:00Z",
  "updated_at": "2026-07-10T12:00:00Z"
}
```

### `GET /api/maintenance-requests/`

Status: Front-end contract  
Auth: authenticated  
Roles: student sees own requests; support sees queue; dormitory admin sees managed dormitories; system admin sees all.

Query params:

| Param | Description |
| --- | --- |
| `priority` | `low`, `medium`, `high`, `urgent`. |
| `status` | `pending`, `assigned`, `progress`, `in_progress`, `resolved`, `rejected`, `cancelled`. |
| `dormitory_id` | Dormitory filter. |
| `room_id` | Room filter. |
| `assigned_to` | Staff user ID. |
| `assigned_to_me` | Boolean helper for support dashboard. |
| `created_before`, `created_after` | Date range. |
| `q` | Search title/description/location. |
| `page`, `page_size` | Pagination. |

### `POST /api/maintenance-requests/`

Status: Front-end contract  
Auth: student/resident or staff  
Used by: student maintenance form.

Request:

```json
{
  "title": "Broken light",
  "priority": "medium",
  "room_id": 10,
  "bed_id": 100,
  "description": "Main room light does not turn on."
}
```

Server rules:

- Reporter user should come from JWT.
- Default status should be `pending`.
- Location can be derived from room/bed but may also be stored as text.

### `GET /api/maintenance-requests/{id}/`

Status: Planned  
Auth: reporter, assigned support staff, dormitory admin, or system admin  
Purpose: detail including comments/history.

### `PATCH /api/maintenance-requests/{id}/`

Status: Planned  
Auth: reporter for limited pending edits/cancel; support/admin for status fields  
Purpose: update request.

### `PATCH /api/maintenance-requests/{id}/assign/`

Status: Planned  
Auth: support staff lead, dormitory admin, or system admin  
Purpose: assign request to support staff.

Request:

```json
{
  "assigned_to_id": 22,
  "note": "Assigned to electrical support."
}
```

### `PATCH /api/maintenance-requests/{id}/status/`

Status: Planned  
Auth: assigned support staff or admin  
Purpose: update work status.

Request:

```json
{
  "status": "resolved",
  "resolution_note": "Light fixture replaced.",
  "resolved_at": "2026-07-10T14:30:00Z"
}
```

### `POST /api/maintenance-requests/{id}/comments/`

Status: Planned  
Auth: visible request participants  
Purpose: add history/comment item.

Request:

```json
{
  "note": "Technician visited the room.",
  "status": "progress"
}
```

### `GET /api/maintenance-requests/{id}/history/`

Status: Planned  
Auth: visible request participants  
Purpose: list comments/status changes.

## Front-End Contract: Announcement APIs

Entity: `Announcement`

Recommended fields:

```json
{
  "id": 21,
  "title": "Payment schedule",
  "content": "Students should pay before the due date.",
  "target_role_id": "student",
  "target_dormitory_id": 1,
  "target_role": {
    "id": 1,
    "name": "student"
  },
  "target_dormitory": {
    "id": 1,
    "name": "Dormitory 1"
  },
  "expires_at": "2026-10-01T00:00:00Z",
  "is_active": true,
  "read": false,
  "created_by": 10,
  "created_at": "2026-07-10T12:00:00Z",
  "updated_at": "2026-07-10T12:00:00Z"
}
```

### `GET /api/announcements/`

Status: Front-end contract  
Auth: authenticated  
Roles: students see active targeted/public announcements; admins see manageable announcements.

Query params:

| Param | Description |
| --- | --- |
| `target_role_id` | Role target filter. |
| `target_dormitory_id` | Dormitory target filter. |
| `is_active` | Boolean. |
| `read` | Boolean for current user. |
| `include_expired` | Boolean for admins. |
| `q` | Search title/content. |
| `page`, `page_size` | Pagination. |

### `POST /api/announcements/`

Status: Front-end contract  
Auth: dormitory admin or system admin  
Used by: dormitory admin announcement modal.

Request:

```json
{
  "title": "Payment schedule",
  "content": "Students should pay before the due date.",
  "target_role_id": "student",
  "target_dormitory_id": 1,
  "expires_at": "2026-10-01",
  "is_active": true
}
```

Rules:

- Empty `target_role_id` and empty `target_dormitory_id` means public/authenticated-wide announcement.
- Dormitory admin may only target allowed dormitories.

### `GET /api/announcements/{id}/`

Status: Planned  
Auth: visible announcement or admin  
Purpose: announcement detail.

### `PATCH /api/announcements/{id}/`

Status: Planned  
Auth: creator/admin  
Purpose: edit content, target, expiration, or active flag.

### `DELETE /api/announcements/{id}/`

Status: Planned  
Auth: creator/admin  
Purpose: delete announcement or perform soft delete.

### `POST /api/announcements/{id}/read/`

Status: Front-end contract  
Auth: authenticated  
Used by: student mark-as-read action.

Request:

```json
{}
```

Response:

```json
{
  "success": true,
  "message": "Announcement marked as read.",
  "announcement_id": 21,
  "read_at": "2026-07-10T12:05:00Z"
}
```

### `GET /api/announcements/{id}/reads/`

Status: Planned  
Auth: announcement creator/admin  
Purpose: list `AnnouncementRead` records for reporting.

Response item:

```json
{
  "id": 1,
  "announcement_id": 21,
  "user": {
    "id": 13,
    "first_name": "Sara",
    "last_name": "Ahmadi"
  },
  "read_at": "2026-07-10T12:05:00Z"
}
```

## Planned Report APIs

These support the system admin/university manager dashboard and report cards.

### `GET /api/reports/dashboard/`

Status: Planned  
Auth: system admin/university manager  
Purpose: consolidated dashboard summary.

Response:

```json
{
  "users": {
    "total": 1200,
    "active": 1180,
    "inactive": 20,
    "unverified": 35
  },
  "accommodation_requests": {
    "pending": 42,
    "approved": 120,
    "rejected": 9,
    "assigned": 96
  },
  "capacity": {
    "dormitories": 5,
    "rooms": 220,
    "beds_total": 880,
    "beds_available": 81,
    "occupancy_percentage": 90.8
  },
  "payments": {
    "unpaid_count": 140,
    "overdue_count": 18,
    "unpaid_total": 350000000
  },
  "maintenance": {
    "open": 21,
    "urgent": 4,
    "resolved_this_month": 37
  },
  "announcements": {
    "active": 6,
    "unread_total": 430
  }
}
```

### `GET /api/reports/occupancy/`

Status: Planned  
Auth: system admin/university manager/dormitory admin scoped to dormitory  
Purpose: occupancy by dormitory, room, gender, date.

Query params: `dormitory_id`, `from`, `to`, `group_by`.

### `GET /api/reports/capacity/`

Status: Planned  
Auth: system admin/university manager/dormitory admin scoped to dormitory  
Purpose: free beds, occupied beds, reserved/maintenance beds.

### `GET /api/reports/accommodation-requests/`

Status: Planned  
Auth: system admin/university manager/dormitory admin scoped to dormitory  
Purpose: request status counts, approval/rejection rates, queue age.

### `GET /api/reports/payments/`

Status: Planned  
Auth: finance/system admin/university manager  
Purpose: payment totals, unpaid/overdue counts, paid history.

### `GET /api/reports/maintenance/`

Status: Planned  
Auth: support lead/system admin/university manager/dormitory admin scoped to dormitory  
Purpose: maintenance volume, priority, resolution time.

### `GET /api/reports/announcements/`

Status: Planned  
Auth: system admin/university manager/announcement creator  
Purpose: read/unread counts by announcement, role, dormitory.

### `GET /api/reports/activity/`

Status: Planned future  
Auth: system admin  
Purpose: user activity/audit log. Mentioned as future roadmap in project documentation.

## Planned External/Future Integration APIs

These are not front-end implementation tasks. They are documented only so backend boundaries are explicit.

### `POST /api/face/verify/`

Status: Planned future external integration  
Auth: authenticated or admin workflow depending on policy  
Purpose: optional future face verification service.

Request:

```json
{
  "user_id": 13,
  "image": "base64-or-upload-reference"
}
```

Response:

```json
{
  "verified": true,
  "confidence": 0.98,
  "provider_reference": "face-job-123"
}
```

Rule: do not implement AI face recognition in the front end.

### `GET /api/health/`

Status: Planned  
Auth: anonymous or internal only  
Purpose: health check for deployment/load balancer.

Response:

```json
{
  "status": "ok",
  "services": {
    "database": "ok",
    "account_service": "ok",
    "dormitory_service": "ok"
  }
}
```

## Permission Codes Recommended for RBAC

The front end already checks several permission names. The API should treat these as display/UI hints only; final authorization remains server-side.

| Permission code | Purpose |
| --- | --- |
| `users.manage` | Manage users. |
| `roles.manage` | Manage roles. |
| `permissions.manage` | Manage permissions. |
| `dormitories.manage` | Manage dormitories, rooms, beds. |
| `dormitory.capacity.view` | View capacity dashboard. |
| `accommodation.request.view` | Student view own accommodation requests. |
| `accommodation.request.create` | Student create accommodation request. |
| `accommodation.request.review` | Dormitory admin approve/reject requests. |
| `bed_assignment.view_own` | Student view own assignment. |
| `bed_assignment.create` | Admin assign bed. |
| `payments.manage` | Admin manage payment records. |
| `payment.view_own` | Student view own payments. |
| `maintenance.request.create` | Student create maintenance request. |
| `maintenance.request.view` | Admin/support view maintenance requests. |
| `maintenance.manage` | Support/admin update maintenance workflow. |
| `announcement.view` | User view announcements. |
| `announcement.create` | Admin create announcements. |
| `announcements.manage` | Admin manage announcements. |
| `reports.view` | Manager/admin view reports. |

## Role Names Recommended for API and JWT

| Role | Purpose |
| --- | --- |
| `student` | Student/resident self-service. |
| `resident` | Alias/extended role for housed student. |
| `dormitory_admin` | Dormitory supervisor/admin. |
| `dormitory_supervisor` | Alias accepted by front-end. |
| `supervisor` | Alias accepted by front-end. |
| `system_admin` | Full system administration. |
| `university_manager` | Manager reporting/oversight role. |
| `support_staff` | Maintenance support role. |
| `support` | Alias accepted by front-end. |
| `admin` | Generic Django staff/admin alias. |

## Known Gaps and Fixes

1. Account child URL routes use leading slash strings. Normalize URL patterns to avoid routing surprises.
2. `GET /api/v1/users/current` currently returns a token pair, not a user object. Either document that as token refresh or return current user data.
3. `RoomCreateView` returns `success: false` on successful create.
4. `RoomUpdateView` uses `AllowAny` while relying on `request.user.is_staff`; add JWT authentication and `IsAuthenticated`.
5. `BedUpdateView` returns `success: true` in a `403` response for non-admin updates.
6. There are no list/delete endpoints for `UserRole` and `RolePermission`.
7. There are no update/delete endpoints for `Permission`.
8. There is no implemented backend for username-only anonymous password reset.
9. There is no implemented backend for accommodation requests, bed assignments, payments, maintenance requests, announcements, announcement reads, public stats, public announcements, or reports.
10. Dormitory/room/bed endpoints use action-style names; RESTful aliases are recommended for long-term consistency.
11. Current serializers omit some model fields such as dormitory `dorm_type`, `description`, `createdAt`, `updatedAt`, room/bed `description`, and timestamps. Add them if the UI/reporting needs them.

## Minimum API Set Needed for Full Product

For a complete SaraSystem release, implement at least these endpoint families:

- Account/RBAC: all implemented endpoints plus missing current-user profile, username-only password reset for this version, user-role list/delete, role-permission list/delete, permission update/delete.
- Dormitory capacity: implemented dormitory/room/bed endpoints plus REST aliases, delete dormitory, bed delete, capacity summary.
- Accommodation: list, create, detail, update/cancel, review, history.
- Bed assignment: list, create, detail, update/end/cancel, current assignment.
- Payments: list, create, detail, update, mark paid/unpaid; optional future gateway start/callback.
- Maintenance: list, create, detail, update, assign, status update, comments/history.
- Announcements: list, create, detail, update, delete/deactivate, mark read, read tracking, public list.
- Reports: dashboard, occupancy, capacity, requests, payments, maintenance, announcements.
- Public: public stats and public announcements.
- Operations: health check.
