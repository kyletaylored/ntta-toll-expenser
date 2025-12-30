# NTTA Customer Portal API Documentation

This document describes the API for the North Texas Tollway Authority (NTTA) Customer Portal. This API is **undocumented and unofficial** - use at your own risk.

## ⚠️ Important Notes

- This API is **not officially documented** by NTTA
- Endpoints, request/response formats, and authentication methods may change without notice
- This documentation is based on observed behavior of the NTTA Customer Portal web application
- Use of this API should comply with NTTA's Terms of Service

## Base URL

```
https://sptrips.ntta.org
```

## Authentication

The API uses a hybrid authentication approach:

1. **Bearer Token (JWT)** - Obtained from the `/authenticate` endpoint
2. **Session Cookies** - Set automatically by the authentication response
3. **Required Headers**:
   - `Authorization: Bearer <token>` (for authenticated endpoints)
   - `api-origin: CustomerPortal`
   - `channelid: 2`
   - `icn: 160408`
   - `appcurrdate: <URL-encoded current date/time>`
   - `allowanonymous: true|false` (depends on endpoint)

### Date Format for `appcurrdate` Header

**Format**: `M/d/yyyy h:mm:ss a` (URL-encoded)

**Example**: `12%2F20%2F2025%201%3A30%3A45%20PM`

## Endpoints

### 1. Authentication

**POST** `/CustomerPortal/api/authenticate`

Authenticate a user and obtain access token.

**Headers**:

```
Content-Type: application/json
api-origin: CustomerPortal
channelid: 2
icn: 160408
appcurrdate: <URL-encoded current datetime>
allowanonymous: true
```

**Request Body**:

```json
{
  "UserName": "your-username",
  "Password": "your-password",
  "Grant_Type": "password",
  "RememberMe": false
}
```

**Response** (Status: 210):

```json
{
  "AccountId": 3703066,
  "FirstName": "John",
  "LastName": "Doe",
  "UserName": "johndoe",
  "FullName": "John Doe",
  "AccountStatus": "AC",
  "AccountType": "PREPAID",
  "EmailAddress": "john.doe@example.com",
  "PhoneNumber": "(940) 555-1234",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Important**: Save both the `access_token` and cookies from the response.

---

### 2. Account Summary

**GET** `/CustomerPortal/api/customers/{customerId}/accountsummary`

Get detailed account information including balance, contact info, and account details.

**Headers**:

```
Authorization: Bearer <access_token>
api-origin: CustomerPortal
channelid: 2
icn: 160408
appcurrdate: <URL-encoded current datetime>
allowanonymous: false
Accept: application/json
```

**Path Parameters**:

- `customerId` (integer) - Customer account ID from authentication response

**Response** (Status: 200):

```json
{
  "AccountId": 3703066,
  "FirstName": "John",
  "LastName": "Doe",
  "FullName": "John Doe",
  "UserName": "johndoe",
  "EmailAddress": "john.doe@example.com",
  "PhoneNumber": "(940) 555-1234",
  "Line1": "123 Main St",
  "Line2": "Apt 4B",
  "City": "Dallas",
  "State": "TX",
  "Zip1": "75201",
  "AccountStatus": "AC",
  "AccountType": "PREPAID",
  "CurrentBalance": 25.5,
  "LowBalanceAmount": 10.0,
  "ActiveVehicleCount": "2",
  "InActiveVehicleCount": "0"
}
```

---

### 3. Transaction History

**POST** `/CustomerPortal/api/customers/{customerId}/transhistory`

Retrieve paginated transaction history for a customer account.

**Headers**:

```
Authorization: Bearer <access_token>
Content-Type: application/json
api-origin: CustomerPortal
channelid: 2
icn: 160408
appcurrdate: <URL-encoded current datetime>
allowanonymous: false
```

**Path Parameters**:

- `customerId` (integer) - Customer account ID

**Request Body**:

```json
{
  "Paging": {
    "PageNumber": 1,
    "PageSize": 50,
    "SortDir": 1,
    "SortColumn": "POSTEDDATE"
  },
  "StartDate": "9/20/2025, 12:00:00 AM",
  "EndDate": "12/20/2025, 11:59:59 PM",
  "TrnsTypes": "",
  "Transponder": "",
  "Plates": "",
  "customerId": "3703066",
  "TransactionDateType": "true",
  "ExportAs": "",
  "IsViolator": false,
  "AppCurrDate": "12/20/2025, 1:30:45 PM"
}
```

**Request Body Fields**:

- `Paging.PageNumber` - Page number (1-indexed)
- `Paging.PageSize` - Number of transactions per page (max 50)
- `Paging.SortDir` - Sort direction: `1` = ascending, `-1` = descending
- `StartDate` - Start date/time in format `M/d/yyyy, h:mm:ss a`
- `EndDate` - End date/time in format `M/d/yyyy, h:mm:ss a`
- `TransactionDateType` - Must be string `"true"` (not boolean)
- `AppCurrDate` - Current date/time (NOT URL-encoded in body)

**Response** (Status: 200):

```json
[
  {
    "CustomerTripId": "123456789",
    "Entry_TripDateTime": "2025-11-28T14:24:36",
    "LocationName": "I-35E",
    "EntryPlazaName": "Lewisville",
    "EntryLaneName": "Lane 3",
    "TollAmount": -2.5,
    "VehicleNumber": "ABC1234",
    "TagId": "123456789012",
    "IsViolator": false,
    "TransactionType": "TOLL"
  }
]
```

**Transaction Fields**:

- `CustomerTripId` - Unique transaction ID
- `Entry_TripDateTime` - ISO 8601 timestamp
- `TollAmount` - **Negative value** (represents charge/deduction)
- `LocationName` - Toll road name
- `EntryPlazaName` - Entry plaza location
- `EntryLaneName` - Specific lane used
- `VehicleNumber` - License plate
- `TagId` - TollTag number
- `IsViolator` - Boolean indicating violation status

**Pagination**: If response contains 50 items, there may be more pages. Increment `PageNumber` and request again until fewer than 50 items are returned.

---

## Error Responses

### 401 Unauthorized

Authentication failed or session expired.

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 500 Internal Server Error

Server error or invalid request format.

```json
{
  "message": "An error occurred processing your request",
  "statusCode": 500
}
```

## Rate Limiting

NTTA may implement rate limiting. Be respectful:

- Don't make excessive requests
- Implement exponential backoff for retries
- Cache responses when appropriate

## Best Practices

1. **Store Tokens Securely** - Never log or expose access tokens
2. **Handle Expired Sessions** - Implement automatic re-authentication
3. **Validate Responses** - Check for expected fields and types
4. **Use HTTPS** - All requests must use HTTPS
5. **Respect Privacy** - Never share user data with third parties

## OpenAPI Specification

A complete OpenAPI 3.0 specification is available in `ntta-api-clean.yaml`.

## Changes & Updates

This API is subject to change without notice. Monitor for:

- New required headers
- Changed response formats
- New authentication requirements
- Endpoint deprecations

## Support

This is an unofficial API. For official NTTA support:

- **NTTA Customer Service**: 1-972-818-6882
- **NTTA Website**: https://www.ntta.org

---

**Last Updated**: December 2025
