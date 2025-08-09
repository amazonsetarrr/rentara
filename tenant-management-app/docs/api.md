# API Documentation for Tenant Management Application

## Overview
This document provides an overview of the API endpoints available in the Tenant Management Application. The backend is powered by Supabase, which offers a RESTful API for interacting with the database.

## Base URL
All API requests are made to the following base URL:
```
https://<your-supabase-url>.supabase.co/rest/v1/
```

## Authentication
All requests to the API require authentication. You must include the `Authorization` header with a Bearer token obtained from the Supabase authentication process.

## Endpoints

### 1. Get Tenants
- **Endpoint:** `/tenants`
- **Method:** `GET`
- **Description:** Retrieve a list of all tenants.
- **Response:**
  - **200 OK**
    ```json
    [
      {
        "id": "uuid",
        "name": "Tenant Name",
        "email": "tenant@example.com",
        "created_at": "timestamp"
      }
    ]
    ```

### 2. Get Tenant by ID
- **Endpoint:** `/tenants/{id}`
- **Method:** `GET`
- **Description:** Retrieve a specific tenant by their ID.
- **Parameters:**
  - `id` (path): The unique identifier of the tenant.
- **Response:**
  - **200 OK**
    ```json
    {
      "id": "uuid",
      "name": "Tenant Name",
      "email": "tenant@example.com",
      "created_at": "timestamp"
    }
    ```
  - **404 Not Found** if the tenant does not exist.

### 3. Create Tenant
- **Endpoint:** `/tenants`
- **Method:** `POST`
- **Description:** Create a new tenant.
- **Request Body:**
  ```json
  {
    "name": "Tenant Name",
    "email": "tenant@example.com"
  }
  ```
- **Response:**
  - **201 Created**
    ```json
    {
      "id": "uuid",
      "name": "Tenant Name",
      "email": "tenant@example.com",
      "created_at": "timestamp"
    }
    ```

### 4. Update Tenant
- **Endpoint:** `/tenants/{id}`
- **Method:** `PATCH`
- **Description:** Update an existing tenant's information.
- **Parameters:**
  - `id` (path): The unique identifier of the tenant.
- **Request Body:**
  ```json
  {
    "name": "Updated Tenant Name",
    "email": "updated@example.com"
  }
  ```
- **Response:**
  - **200 OK**
    ```json
    {
      "id": "uuid",
      "name": "Updated Tenant Name",
      "email": "updated@example.com",
      "created_at": "timestamp"
    }
    ```

### 5. Delete Tenant
- **Endpoint:** `/tenants/{id}`
- **Method:** `DELETE`
- **Description:** Delete a tenant by their ID.
- **Parameters:**
  - `id` (path): The unique identifier of the tenant.
- **Response:**
  - **204 No Content** if the deletion was successful.
  - **404 Not Found** if the tenant does not exist.

## Error Handling
All API responses will include an appropriate HTTP status code and a JSON body with an error message in case of failure.

### Example Error Response
```json
{
  "error": "Tenant not found"
}
```

## Conclusion
This API documentation provides a comprehensive overview of the available endpoints for managing tenants in the Tenant Management Application. For further details on authentication and additional features, please refer to the relevant sections in the documentation.