# Admin API Documentation (v1)

Base URL: `https://your-domain.com/api/v1/admin`

All endpoints return JSON.  
When the response contains a field named `success`, a value of `true` means the call succeeded.

---

## Authentication
Every request (except `POST /login-admin`) **must** include a valid **JWT** in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued by the login endpoint.

---

## Common Response Shapes

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "optional human-readable string",
  "code": 200
}
```

### Error
```json
{
  "message": "Human-readable error"
}
```

Possible HTTP codes:  
400, 401, 403, 404, 409, 500

---

## Endpoints

### 1. Admin Login
```
POST /login-admin
```
Login to obtain a JWT.

**Body**
```json
{
  "username": "admin",
  "password": "secret"
}
```

**Success 200**
```json
{
  "success": true,
  "token": "<JWT>",
  "message": "Login successful"
}
```

---

### 2. User Management

#### Create User *(Super-Admin only)*
```
POST /create-user
```
**Body**
```json
{
  "username": "newUser",
  "password": "pass123",
  "roles": ["admin"]
}
```

**Success 201**
```json
{
  "id": "60f...",
  "username": "newUser",
  "roles": ["admin"]
}
```

#### List Users *(Super-Admin only)*
```
GET /user
```
**Query (all optional)**
- `search` – username regex  
- `role` – filter by role  
- `sortBy` – default `createdAt`  
- `sortOrder` – `asc|desc`, default `desc`  
- `page` – default `1`  
- `limit` – default `10`

**Success 200**
```json
{
  "data": [ { ...user } ],
  "pagination": { "page": 1, "limit": 10, "total": 5, "pages": 1 }
}
```

#### User Details
```
GET /user/:id
```
Returns user profile plus statistics:
- created forms
- created materials
- counts of questions & sub-materials

#### Delete User *(Super-Admin only)*
```
DELETE /user/:id
```
**Success 200**
```json
{ "message": "User Has been deleted successfully" }
```

---

### 3. Material Management

#### Create Material
```
POST /create-material
```
**Body**
```json
{
  "name": "Material A",
  "details": "Description",
  "sourceFrom": "internal"
}
```

#### List Materials
```
GET /material
```
**Query (all optional)**
- `search` – text in `name`, `details`, or `sourceFrom`  
- `sortBy`, `sortOrder`, `page`, `limit` – same as above

Response includes creator username and up to 5 sub-materials per material.

#### Get Single Material
```
GET /material/:id
```
Returns material plus paginated sub-materials.

#### Update Material
```
PUT /material/:id
```
Same body as create.

#### Delete Material
```
DELETE /material/:id
```
Deletes material and **all** its sub-materials.

---

### 4. Sub-Material (nested under a material)

#### Add Sub-Material
```
POST /material/:materialId
```
**Body**
```json
{
  "name": "Sub A",
  "picture": "https://...",
  "details": "..."
}
```

#### Edit Sub-Material
```
PUT /sub-material/:subMaterialId
```
Same body as add.

#### Delete Sub-Material
```
DELETE /sub-material/:subMaterialId
```

---

### 5. Form Management

#### Create Form
```
POST /create-form
```
**Body**
```json
{
  "title": "Form A",
  "description": "...",
  "materialId": "60f..."
}
```

#### List Forms
```
GET /form
```
**Query (all optional)**
- `search` – text in `title` or `description`  
- `createdBy` – user id filter  
- `withQuestions=true` – populate questions  
- `sortBy`, `sortOrder`, `page`, `limit`

#### Get Single Form
```
GET /form/:id
```
**Query**
- `withQuestions=true|false` (default true)

#### Edit Form
```
PUT /form/:id
```
**Body**
```json
{
  "title": "...",
  "description": "...",
  "materialId": "60f...",
  "isActive": true
}
```

#### Delete Form
```
DELETE /form/:id
```
Deletes form and **all** its questions.

---

### 6. Question Management (nested under a form)

#### Add Question
```
POST /form/:formId
```
**Body**
```json
{
  "questionText": "...",
  "questionType": "multiple-choice",
  "options": ["A","B"],
  "scale": null,
  "isRequired": true,
  "order": 1,
  "materialId": null
}
```
Supported types: `short-answer`, `paragraph`, `multiple-choice`, `checkboxes`, `dropdown`, `linear-scale`, `rating`, `date`, `file-upload`.

#### Edit Question
```
PUT /question/:questionId
```
Same body schema as add.

#### Delete Question
```
DELETE /question/:questionId
```

---

### 7. System Logs *(Super-Admin only)*
```
GET /logs
```
Returns audit logs of all CRUD operations.

---

## Quick Start Example

1. **Login**
```bash
curl -X POST https://your-domain.com/api/v1/admin/login-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"super","password":"secret"}'
```

2. **Create a Material** (use token from step 1)
```bash
curl -X POST https://your-domain.com/api/v1/admin/create-material \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Math 101","details":"Intro course"}'
```

---

## Error Code Summary

| Code | Name              | Meaning                                  |
|------|-------------------|------------------------------------------|
| 400  | invalidInput      | Missing/invalid fields                   |
| 401  | Unauthenticated   | Missing or invalid JWT                   |
| 403  | forbidden         | Not enough privileges                    |
| 404  | ContentNotFound   | Resource does not exist                  |
| 409  | username/registered | Username already taken                 |
| 500  | -                 | Server error                             |

---

*Last updated: 2025-07-30*