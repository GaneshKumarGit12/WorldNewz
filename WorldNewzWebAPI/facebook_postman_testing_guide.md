# Facebook Page Automation - Postman Testing Guide

This document serves as a comprehensive guide to manually test your automated Facebook feed posts using Postman and the Facebook Graph API.

## 1. Prerequisites: Generating a Page Access Token

To post to a Facebook Page, you need a **Page Access Token**, not a User Access Token.

### Steps to Generate the Token:
1. Go to the [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. On the right side under **Permissions**, click **Add a Permission**, select **Events Groups Pages**, and add:
   - `pages_read_engagement`
   - `pages_manage_posts`
3. Click the blue **Generate Access Token** button.
4. A Facebook login pop-up will appear. Click **Continue**, and **CRITICALLY**, make sure you check the box next to the Facebook Page you want to manage. Complete the prompts.
5. In the Graph API Explorer, click the **User or Page** dropdown.
6. Look under **Page Access Tokens** and click the name of your Facebook Page.
7. The string in the "Access Token" field at the top will refresh. **Copy this new token**.

---

## 2. Setting Up the Postman Request

### Method and URL
- **Method:** `POST` *(Do not use GET. GET will just read your empty timeline and return `"data": []`)*
- **URL:** `https://graph.facebook.com/v20.0/YOUR_PAGE_ID/feed?access_token=YOUR_PAGE_ACCESS_TOKEN`
  - Replace `YOUR_PAGE_ID` with the numeric ID of your Facebook Page.
  - Replace `YOUR_PAGE_ACCESS_TOKEN` with the token generated in Step 1.

### Headers
Go to the **Headers** tab in Postman and ensure you have:
- **Key:** `Content-Type`
- **Value:** `application/json`

### Body (The Post Payload)
1. Go to the **Body** tab.
2. Select **raw**.
3. Select **JSON** from the dropdown menu on the right.
4. Paste the following JSON:

```json
{
    "message": "Test Article Title\n\nThis is a test description generated from Postman to verify the Facebook automation feed.",
    "link": "https://world-newz.vercel.app"
}
```

### Sending the Request
Click the **Send** button. 

**Success Response (200 OK):**
```json
{
    "id": "1234567890_0987654321"
}
```
If you get this response, check your Facebook Page timeline. The post should be live!

---

## 3. Common Errors & Troubleshooting

### Error: `404 Not Found` (or empty response)
**Cause:** 
- You left the literal string `YOUR_PAGE_ID` in the URL.
- Your access token does not have permissions to view or post to the page.
- You are using a User Token instead of a Page Token. Facebook treats unauthorized requests as 404s to protect privacy.

### Error: `400 Bad Request - An access token is required to request this resource`
**Cause:** Facebook couldn't find your access token in the request.
**Fix:** Ensure you appended `?access_token=YOUR_TOKEN` to the URL correctly, or pass it via Postman's **Authorization** tab as a **Bearer Token**.

### Response: `200 OK` with `{"data": []}`
**Cause:** You sent a `GET` request instead of a `POST` request. 
**Fix:** Change the HTTP method dropdown in Postman from `GET` to `POST` and send again.

### Error: `403 OAuthException Code 200 - Requires both pages_read_engagement and pages_manage_posts`
**Cause:** You are using a User Token, or a token that hasn't been granted the necessary permissions.
**Fix:** You must complete Step 1 (above) fully. Ensure you select your Page from the "User or Page" dropdown to convert your User Token into a Page Token.
