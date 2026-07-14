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
| Account service | `http://127.0.0.1:8001` | `/api/v1/...`, `/api/announcements/...` | Handles users, JWT login/refresh, roles, permissions, user-role, role-permission, and the current announcements app once mounted. |
| Dormitory service | `http://127.0.0.1:8000` | `/api/dormitory/`, `/api/rooms/`, `/api/beds/` | Handles dormitories, rooms, beds. |
| AI service | `http://127.0.0.1:5000` | `/register`, `/verify`, `/delete` | Flask face-image service. Front-end aliases use `/api/face/...` and route to this base. |
| Application API | same origin `/api` or gateway | `/api/...` | Planned unified API surface for accommodation, assignments, payments, maintenance, announcements, reports, public data. |

Current front-end routing in `assets/js/api.js` sends account paths to the account service, dormitory/room/bed/accommodation paths to the dormitory service, authenticated `/api/announcements/...` paths to the account service, AI face aliases to the AI service, and all other `/api/...` paths to the configured general API base. Anonymous public paths such as `/api/public/stats/` and `/api/announcements/public/` stay on the general API base.

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
- `PUT /api/v1/users/password/reset`
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

Frontend normalization: `assets/js/api-adapters.js` maps `totalRoom` to `total_rooms`, `currentOccupancy` to `occupied_beds`, `available_capacity` to `available_beds`, and `occupancy_percentage` to `occupancy` for the admin capacity cards.

### `GET /api/dormitory/withRooms/`

Status: Implemented  
Auth: authenticated  
View: `DormitoryWithRoomsView`  
Purpose: list dormitories with nested room dropdown data.

Frontend note: the student accommodation form uses this route for dormitory options because `/api/dormitory/listAll/` is admin-only in the current backend.

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

Frontend normalization: room responses carry `dormitory` as an ID. The dormitory-admin dashboard maps that ID to the loaded dormitory list for display as `dormitory_name`.

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

Response `201`:

```json
{
  "success": true,
  "message": "room created successfully",
  "data": {
    "id": 10,
    "roomNumber": 201,
    "dormitory": 1,
    "floorNumber": 2,
    "capacity": 4,
    "status": "available",
    "currentOccupancy": 0
  }
}
```

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
Query strings and hash fragments are preserved during normalization, so filtered requests such as `/api/accounts/users/?username=ali` still reach the account service as `/api/v1/users/list?username=ali`.

| Alias path | Normalized path |
| --- | --- |
| `/api/accounts/getToken/` | `/api/v1/users/login` |
| `/api/accounts/refreshToken/` | `/api/v1/users/token/refresh` |
| `/api/accounts/me/` | `/api/v1/users/current` |
| `/api/accounts/logout/` | `/api/v1/users/logout` |
| `/api/accounts/register/` | `/api/v1/users/create` |
| `/api/accounts/users/register/` | `/api/v1/users/create` |
| `GET /api/accounts/users/` | `/api/v1/users/list` |
| `POST /api/accounts/users/` | `/api/v1/users/create` |
| `GET /api/accounts/users/by-student-id/?student_id={studentId}` | `/api/v1/users/current/studentId?studentId={studentId}` |
| `GET /api/accounts/users/{id}/` | `/api/v1/users/current?userId={id}` |
| `PUT/PATCH /api/accounts/users/{id}/` | `/api/v1/users/adminUpdate` |
| `PATCH /api/accounts/users/{id}/status/` | `/api/v1/users/status/change` |
| `DELETE /api/accounts/users/{id}/` | `/api/v1/users/delete/{id}` |
| `/api/accounts/update-profile/` | `/api/v1/users/editProfile` |
| `/api/accounts/editProfile/` | `/api/v1/users/editProfile` |
| `/api/accounts/users/admin-update/` | `/api/v1/users/adminUpdate` |
| `/api/accounts/users/update/` | `/api/v1/users/adminUpdate` |
| `/api/accounts/adminUpdate/` | `/api/v1/users/adminUpdate` |
| `/api/accounts/change-password/` | `/api/v1/users/password/change` |
| `/api/accounts/changePassword/` | `/api/v1/users/password/change` |
| `/api/accounts/reset-password/` | `/api/v1/users/password/reset` |
| `/api/accounts/forgot-password/` | `/api/v1/users/password/reset` |
| `/api/accounts/password/reset/username/` | `/api/v1/users/password/reset` |
| `/api/v1/users/changePassword` | `/api/v1/users/password/change` |
| `GET /api/accounts/roles/` | `/api/v1/role/list` |
| `POST /api/accounts/roles/` | `/api/v1/role/create` |
| `PUT/PATCH /api/accounts/roles/{id}/` | `/api/v1/role/update/{id}` |
| `DELETE /api/accounts/roles/{id}/` | `/api/v1/role/delete/{id}` |
| `GET /api/accounts/permissions/` | `/api/v1/permission/list` |
| `POST /api/accounts/permissions/` | `/api/v1/permission/create` |
| `/api/accounts/role-permissions/` | `/api/v1/rolePermission/create` |
| `/api/accounts/user-roles/` | `/api/v1/userRole/create` |

For `PUT/PATCH /api/accounts/users/{id}/` and `PATCH /api/accounts/users/{id}/status/`, `assets/js/api.js` injects the path `{id}` into plain JSON request bodies because the current backend expects `id` in the body for `/api/v1/users/adminUpdate` and `/api/v1/users/status/change`. FormData and string bodies are not modified.

Frontend note: authentication, account profile, dormitory-admin role loading, and system-admin account/RBAC UI now use these `/api/accounts/...` aliases so account-service action-style URLs remain centralized in `assets/js/api.js`.

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

### `PUT /api/v1/users/password/reset`

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
  "message": "Password updated successfully."
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

## RESTful Dormitory API Aliases

The implemented dormitory routes use action-style names (`listAll`, `createDorm`, `updateRoom`). `assets/js/api.js` now normalizes the frontend aliases below to the implemented routes where possible.

### Dormitories

| Method | Path | Status | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/dormitories/` | Front-end alias | Normalizes to `GET /api/dormitory/listAll/`. |
| `POST` | `/api/dormitories/` | Front-end alias | Normalizes to `POST /api/dormitory/createDorm/`. |
| `GET` | `/api/dormitories/{id}/` | Planned | Retrieve dormitory. |
| `PUT` | `/api/dormitories/{id}/` | Front-end alias | Normalizes to `PUT /api/dormitory/updateDorm/{id}`. |
| `PATCH` | `/api/dormitories/{id}/` | Front-end alias | Normalizes to `PATCH /api/dormitory/updateDorm/{id}`. |
| `DELETE` | `/api/dormitories/{id}/` | Planned | Delete or deactivate dormitory. |
| `GET` | `/api/dormitories/with-rooms/` | Front-end alias | Normalizes to `GET /api/dormitory/withRooms/`. Used by student dormitory options. |
| `GET` | `/api/dormitories/{id}/rooms/` | Front-end alias | Normalizes to `GET /api/rooms/listAllRoom/?dormId={id}`. |
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
| `GET` | `/api/rooms/` | Front-end alias | Normalizes to `GET /api/rooms/listAllRoom/`. |
| `POST` | `/api/rooms/` | Front-end alias | Normalizes to `POST /api/rooms/createRoom/`. |
| `GET` | `/api/rooms/{id}/` | Planned | Retrieve room. |
| `PUT` | `/api/rooms/{id}/` | Front-end alias | Normalizes to `PUT /api/rooms/updateRoom/{id}`. |
| `PATCH` | `/api/rooms/{id}/` | Front-end alias | Normalizes to `PATCH /api/rooms/updateRoom/{id}`. |
| `DELETE` | `/api/rooms/{id}/` | Front-end alias | Normalizes to `DELETE /api/rooms/deleteRoom/{id}`. |
| `GET` | `/api/rooms/{id}/beds/` | Front-end alias | Normalizes to `GET /api/rooms/listAllRoomBeds/{id}`. |

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
| `GET` | `/api/beds/` | Front-end alias | Normalizes to `GET /api/beds/listAll/`. |
| `POST` | `/api/beds/` | Front-end alias | Normalizes to `POST /api/beds/createBed/`. |
| `GET` | `/api/beds/{id}/` | Front-end alias | Normalizes to `GET /api/beds/getBedById/{id}`. |
| `PUT` | `/api/beds/{id}/` | Front-end alias | Normalizes to `PUT /api/beds/updateBed/{id}`. |
| `PATCH` | `/api/beds/{id}/` | Front-end alias | Normalizes to `PATCH /api/beds/updateBed/{id}`. |
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

Current backend note: the account-service announcement app does not implement this anonymous public route. `assets/js/api.js` therefore keeps this path on the general API base instead of routing it to the account service.

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

Current backend note: `AccommodationList` serializes model fields directly, so rows may include `requested_dorm` as a numeric dormitory id rather than a nested `requested_dormitory` object or name. Front-end adapters resolve that id against the loaded dormitory list when possible and otherwise display `خوابگاه {id}`.

### `GET /api/accommodation-requests/`

Status: implemented

Backend path: `GET /api/accommodation/detail`

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

Status: implemented
Auth: student/resident  
Used by: student dashboard accommodation form.

Request:

```json
{
  "requested_dorm": 1,
  "preferred_room": "shared",
  "semester": "1404-1405-1",
  "req_date": "2026-07-10",
  "description": "I prefer a shared room near faculty."
}
```

Frontend note: the student form keeps UI state as `requested_dormitory_id`, `preferred_room_type`, and `request_date`, then submits the current backend serializer fields `requested_dorm`, `preferred_room`, and `req_date` through `assets/js/student-dashboard.js`.

Current backend note: `AccommodationCreateView` manually creates the model instance after validation but does not pass `description`, so submitted student notes may be stored as the model default until the backend includes `description=request.data.get("description")` or uses `serializer.save(...)`. The model also uses `OneToOneField` for `requested_dorm`, which can prevent more than one accommodation request from referencing the same dormitory; a `ForeignKey` better matches the product flow.

Server rules:

- User should be taken from JWT, not trusted from body.
- New status should default to `pending`.
- Reject duplicate active pending/approved requests if policy allows only one per semester.

### `GET /api/accommodation-requests/{id}/`

Status: front-end alias only

Auth: owner, dormitory admin, or system admin

Purpose: intended single-request detail route.

Current backend caveat: the implemented accommodation service exposes list/history routes and update-by-query-id. It does not currently expose a true `GET` detail route by request id.

### `PUT /api/accommodation-requests/{id}/`

Status: implemented
Auth: owner for pending request edits/cancel; admin for controlled fields  
Used by: student edit/cancel actions.

Edit request:

```json
{
  "requested_dorm": 1,
  "preferred_room": "double",
  "semester": "1404-1405-1",
  "req_date": "2026-07-10",
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

### `PUT /api/accommodation-requests/review/`

Status: implemented
Backend path: `PUT /api/accommodation/review?id={id}`
Auth: dormitory admin or system admin  
Used by: dormitory admin review modal.

Request:

```json
{
  "status": "approved",
  "review_note": "Approved for assignment."
}
```

Rejected request:

```json
{
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

Recommended REST alias: `PATCH /api/accommodation-requests/{id}/review/`. The front-end normalizer maps this to `PATCH /api/accommodation/review?id={id}`.

Current backend caveat: `UpdateReviewInfo.put` currently rejects records whose status is `pending`, which prevents the dormitory-admin approval/rejection workflow from reviewing pending requests. The condition should be adjusted so pending requests can transition to `approved` or `rejected`.

### `GET /api/accommodation-requests/history/`

Status: implemented alias

Backend path: `GET /api/accommodation/history`

Auth: owner, dormitory admin, or system admin

Purpose: show accommodation request history/list for a user or filtered scope.

Supported current backend query params:

| Param | Description |
| --- | --- |
| `status` | Exact status filter. |
| `semester` | Exact semester filter. |
| `requested_dorm` | Dormitory id filter used by the backend model field. |
| `user_id` | Account user id filter. |
| `studentId` | Student number lookup through account service `/api/v1/users/current/studentId`. |

Front-end notes:

- Student dashboard now calls `/api/accommodation-requests/history/?user_id={id}` for request history; `assets/js/api.js` normalizes it to the current backend `/api/accommodation/history` route.
- REST-style `/api/accommodation-requests/{id}/history/` is normalized by `assets/js/api.js` to `/api/accommodation/history?id={id}`, but the current backend does not filter by `id` yet.

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

Current backend implementation: `account_service/announcements` defines list/create, detail/update/delete, mark-read, and current-user read-list views. However, `account_service/account_service/urls.py` does not currently include `announcements.urls`, so these endpoints will 404 until the backend mounts the app, for example at `path('api/announcements/', include('announcements.urls'))`.

Current front-end routing sends authenticated `/api/announcements/...` routes to the account service base because the implemented app lives in `account_service`. The anonymous `/api/announcements/public/` homepage route is excluded and stays on the general API base because the account-service announcement app does not currently implement it.

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

Status: implemented app, backend URL mount pending
Auth: authenticated  
Roles: students see active targeted/public announcements; admins see manageable announcements.

Query params:

| Param | Description |
| --- | --- |
| `dormitory_id` | Current implemented dormitory filter. Returns public dormitory announcements plus matching dormitory target. |

Current serializer fields include `target_role`, `target_role_name`, `target_dormitory_id`, `created_by`, `created_by_username`, `is_active`, and `is_expired`.

### `POST /api/announcements/`

Status: implemented app, backend URL mount pending
Auth: dormitory admin or system admin  
Used by: dormitory admin announcement modal.

Request:

```json
{
  "title": "Payment schedule",
  "content": "Students should pay before the due date.",
  "target_role": 1,
  "target_dormitory_id": 1,
  "expires_at": "2026-10-01",
  "is_active": true
}
```

Rules:

- Empty `target_role_id` and empty `target_dormitory_id` means public/authenticated-wide announcement.
- Dormitory admin may only target allowed dormitories.

Frontend note: dormitory-admin announcement targeting now loads role IDs through `/api/accounts/roles/` and submits the backend serializer field `target_role`.

### `GET /api/announcements/{id}/`

Status: implemented app, backend URL mount pending
Auth: visible announcement or admin  
Purpose: announcement detail.

### `PATCH /api/announcements/{id}/`

Status: implemented app, backend URL mount pending
Auth: creator/admin  
Purpose: edit content, target, expiration, or active flag.

### `DELETE /api/announcements/{id}/`

Status: implemented app, backend URL mount pending
Auth: creator/admin  
Purpose: delete announcement or perform soft delete.

### `POST /api/announcements/{id}/read/`

Status: implemented app, backend URL mount pending
Auth: authenticated  
Used by: student mark-as-read action.

Request:

```json
{}
```

Response:

```json
{
  "id": 1,
  "announcement": 21,
  "announcement_title": "Payment schedule",
  "user": 13,
  "username": "student001",
  "read_at": "2026-07-10T12:05:00Z"
}
```

### `GET /api/announcements/reads/me/`

Status: implemented app, backend URL mount pending
Auth: authenticated
Purpose: list current user's `AnnouncementRead` records.

Frontend note: the student dashboard now loads this endpoint after `/api/announcements/` and merges returned `announcement` IDs into local read/unread state.

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

## External AI Service APIs

The current backend includes a Flask AI service in `AI/face_recognition/face_recognition_server.py`.
The service exposes raw paths on port `5000`. The front end uses `/api/face/...` aliases so UI code does not depend on the raw service paths.

The repository also contains `AI/national_id_detector/` model/script code for ID-card detection/classification. That directory does not currently expose an HTTP server, route list, request schema, or stable response schema, so there is no front-end API alias for it yet.

Important caveats:

- Current Flask face routes do not enforce JWT authentication. The front end sends these requests with `auth: false` and relies on the surrounding authenticated page context.
- Current Flask face routes do not configure CORS. Direct browser calls from another origin may fail until the AI service enables CORS or is placed behind the same gateway/origin as the front end.
- Responses use `{ "success": boolean, "log": string }`, not the standard SaraSystem success envelope.
- The AI service stores face data on local disk under `AI/face_recognition/database/{id}/img.jpg`.
- The front end only uploads/deletes images and displays service results. It does not implement face recognition logic.
- National-ID/card detection cannot be connected from the browser until the backend exposes a REST endpoint, expected multipart field names, auth/CORS behavior, and response shape.

### `POST /api/face/register/`

Status: Implemented external service alias

AI service path: `POST http://127.0.0.1:5000/register`

Auth: authenticated front-end page context; no JWT currently enforced by AI service

Purpose: register a user's face image in the AI service.

Request: `multipart/form-data`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string/integer | yes | User identifier. Current front end sends account user `id`/`user_id`. |
| `image` | file | yes | Face image file. |

Response:

```json
{
  "success": true,
  "log": "saved successfully."
}
```

### `POST /api/face/verify/`

Status: Implemented external service alias

AI service path: `POST http://127.0.0.1:5000/verify`

Auth: authenticated front-end page context; no JWT currently enforced by AI service

Purpose: verify a user-submitted face image against the stored image for that user.

Request: `multipart/form-data`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string/integer | yes | User identifier. |
| `image` | file | yes | Face image file to verify. |

Response:

```json
{
  "success": true,
  "log": "operation done."
}
```

### `POST /api/face/delete/`

Status: Implemented external service alias

AI service path: `POST http://127.0.0.1:5000/delete`

Auth: authenticated front-end page context; no JWT currently enforced by AI service

Purpose: delete the stored face image for a user from the AI service.

Request: `multipart/form-data`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string/integer | yes | User identifier. |

Response:

```json
{
  "success": true,
  "log": "deleted successfully."
}
```

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
2. `GET /api/v1/users/current` now returns a user object, but the optional `userId` permission check compares `request.user.id` to the raw query-string value; normalize types before comparing.
3. `BedCreateView` currently repeats `IsAuthenticated` in `permission_classes` and does not require `IsAdminUser`, so authenticated non-admin users may be able to create beds.
4. The face-recognition AI service does not enforce JWT auth or configure CORS; browser calls need either CORS support or same-origin gateway/proxying.
5. `AI/national_id_detector/` is present as scripts/models only; expose a real HTTP API before adding front-end ID-card verification controls.
6. There are no list/delete endpoints for `UserRole` and `RolePermission`.
7. There are no update/delete endpoints for `Permission`.
8. Username-only anonymous password reset is implemented at `/api/v1/users/password/reset`; older `/password/reset/username` aliases should normalize to that route.
9. Accommodation requests and the announcements app now have partial backend implementations. Remaining missing or unmounted areas include bed assignments, payments, maintenance requests, public stats, public announcements, reports, and the `announcements.urls` include in the account service root URL config.
10. Dormitory/room/bed endpoints use action-style names; RESTful aliases are recommended for long-term consistency.
11. `PUT /api/accommodation/review?id={id}` currently rejects `pending` records, so dormitory admins cannot approve/reject newly submitted requests.
12. Current serializers omit some model fields such as dormitory `dorm_type`, `description`, `createdAt`, `updatedAt`, room/bed `description`, and timestamps. Add them if the UI/reporting needs them.
13. `AccommodationCreateView` validates `description` but does not pass it into `Accommodation.objects.create(...)`, so student notes may be lost and replaced by the model default.
14. `Accommodation.requested_dorm` is a `OneToOneField`; use `ForeignKey` if multiple students can request the same dormitory.

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
- AI: keep current face register/verify/delete routes stable; add an authenticated/CORS-safe national-ID/card verification endpoint if the detector should be user-facing.
