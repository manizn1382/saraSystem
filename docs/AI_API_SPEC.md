# Face Verification & ID Verification API Specification

**Last reviewed:** 2026-07-17  
**Scope:** API specification for the Face Recognition and ID Verification services.

---

# Status Legend

| Status | Meaning |
|---------|---------|
| Implemented | Endpoint is fully implemented and available. |
| Failed | Request was processed but verification or operation failed. |
| Error | Request could not be completed due to an internal processing error. |

---

# Service Boundaries

| Service | Base URL | Description |
|---------|----------|-------------|
| Face Recognition Service | `http://<host>:5000` | Face registration, verification, and deletion. |
| ID Verification Service | `http://<host>:5000` | ID card detection and ID number verification using OCR. |

---

# Face Recognition API

## POST `/register`

Registers a user's face in the database.

### Request

**Content-Type**

```
multipart/form-data
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | File | Yes | Face image to register |
| id | String | Yes | User identifier |

### Response

| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Registration status |
| log | String | Operation message |

Example

```json
{
  "success": true,
  "log": "registered successfully."
}
```

---

## POST `/verify`

Verifies whether the uploaded face matches the registered user.

### Request

**Content-Type**

```
multipart/form-data
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | File | Yes | Face image |
| id | String | Yes | User identifier |

### Response

```json
{
  "success": true,
  "log": "verification successful."
}
```

---

## POST `/delete`

Deletes a registered user from the database.

### Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | String | Yes | User identifier |

### Success Response

```json
{
  "success": true,
  "log": "deleted successfully."
}
```

### Failure Response

```json
{
  "success": false,
  "log": "id not exists"
}
```

---

# ID Verification API

## POST `/verify`

Verifies that:

1. An ID card is detected in the uploaded image.
2. Text is successfully extracted using OCR.
3. The extracted ID matches the provided user ID.

### Request

**Content-Type**

```
multipart/form-data
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | File | Yes | Image containing the ID card |
| id | String | Yes | User identifier |

### Success Response

```json
{
  "success": true,
  "log": "user successfully verified."
}
```

### Possible Failure Responses

| Reason | Response |
|--------|----------|
| No ID card detected | `"no id_card detected from photo."` |
| OCR extraction failed | `"failed to extract text from photo."` |
| ID mismatch | `"id doesnt match."` |

---

# Common Response Format

All endpoints return the following JSON structure.

| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Indicates whether the request succeeded |
| log | String | Human-readable status or error message |

Example

```json
{
    "success": true,
    "log": "user successfully verified."
}
```

---

# API Summary

| Method | Endpoint | Service | Description |
|---------|----------|---------|-------------|
| POST | `/register` | Face Recognition | Register a user's face |
| POST | `/verify` | Face Recognition | Verify a user's face |
| POST | `/delete` | Face Recognition | Delete a registered face |
| POST | `/verify` | ID Verification | Verify an ID card against a user ID |