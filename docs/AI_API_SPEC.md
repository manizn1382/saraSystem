````md
# API Documentation

This project provides REST APIs for **ID card verification** and **face recognition**.

## Base URL

```
http://<server-ip>:5000
```

---

# ID Verification API

## POST `/verify`

Verifies that:
1. An ID card is present in the uploaded image.
2. Text can be extracted from the ID card.
3. The extracted ID matches the provided user ID.

### Request

**Content-Type**

```
multipart/form-data
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| image | File | Yes | Image containing the ID card |
| id | String | Yes | User ID to verify |

### Success Response

```json
{
  "success": true,
  "log": "user successfully verified."
}
```

### Possible Responses

```json
{
  "success": false,
  "log": "no id_card detected from photo."
}
```

```json
{
  "success": false,
  "log": "failed to extract text from photo."
}
```

```json
{
  "success": false,
  "log": "id doesnt match."
}
```

---

# Face Recognition API

## POST `/register`

Registers a user's face in the database.

### Request

**Content-Type**

```
multipart/form-data
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| image | File | Yes | User face image |
| id | String | Yes | User ID |

### Response

```json
{
  "success": true,
  "log": "..."
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

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| image | File | Yes | User face image |
| id | String | Yes | User ID |

### Response

```json
{
  "success": true,
  "log": "..."
}
```

---

## POST `/delete`

Deletes a registered user from the face database.

### Request

**Content-Type**

```
multipart/form-data
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | String | Yes | User ID |

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

# Response Format

All endpoints return a JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Indicates whether the request succeeded |
| log | String | Human-readable message describing the result |
````
