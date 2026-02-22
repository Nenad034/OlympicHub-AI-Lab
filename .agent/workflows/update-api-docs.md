---
description: Update API documentation when code changes
---

# Update API Documentation Workflow

This workflow ensures API documentation stays in sync with code changes.

## When to Update

Update `docs/API.md` when:
- Adding new API endpoints
- Modifying existing endpoints (parameters, responses)
- Adding new data types/interfaces
- Changing authentication requirements
- Adding new error codes
- Modifying rate limits
- Adding/removing webhook events

## Steps

1. **Identify the change type:**
   - New endpoint → Add to appropriate section
   - Modified endpoint → Update existing entry
   - New type/interface → Add to relevant object section
   - New error code → Add to Error Handling section

2. **Update the documentation:**
   - Open `docs/API.md`
   - Find the relevant section
   - Add/update the documentation
   - Update the `Last Updated` date at the top

3. **Update version if significant:**
   - Minor changes: Keep same version
   - New endpoints: Bump minor version (1.0.0 → 1.1.0)
   - Breaking changes: Bump major version (1.0.0 → 2.0.0)

4. **Update the Changelog section:**
   - Add entry with date and description

5. **Cross-reference other docs if needed:**
   - `docs/ARCHITECTURE.md` - If architecture changed
   - `docs/COMPONENTS.md` - If new components/hooks added

## Documentation Template for New Endpoint

```markdown
### Endpoint Name

```http
METHOD /path
```

**Description:** What this endpoint does.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1 | string | Yes | Description |

**Request Body:**

```json
{
  "field": "value"
}
```

**Response:**

```json
{
  "data": {...},
  "success": true
}
```

**Errors:**

| Code | Description |
|------|-------------|
| 400 | Invalid request |
| 404 | Not found |
```

## Checklist

- [ ] Updated relevant endpoint section
- [ ] Updated `Last Updated` date
- [ ] Updated version number if needed
- [ ] Added changelog entry
- [ ] Verified examples are accurate
- [ ] Cross-referenced other docs if needed

## Example Update

When adding a new endpoint like `GET /bookings`:

1. Add under new "Bookings API" section
2. Document all parameters
3. Show request/response examples
4. List possible errors
5. Update changelog:
   ```markdown
   ### v1.1.0 (2025-12-30)
   - Added Bookings API endpoints
   ```
