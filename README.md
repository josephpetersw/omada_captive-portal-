# Omada Captive Portal Template

This template is an advanced captive portal designed to integrate seamlessly with the **Omada Software Controller / Hardware Controller**. It acts as the intermediary between connected devices (clients) and the network by enforcing authentication and relaying device tracking metadata with the Omada server before granting internet access.

## Technology Stack

The template is built using a lightweight, mostly vanilla front-end to ensure compatibility and fast loading across mobile and desktop devices.

- **HTML/CSS**: Defines the portal structure and styles.
- **JavaScript (Vanilla JS & jQuery)**: ES5 Javascript for core functionalities and AJAX requests. jQuery (`jquery.min.js`) is used specifically for DOM manipulation related to complex dynamic forms (like Form Authentication).
- **Communication Protocol**: Asynchronous JSON POST requests via `XMLHttpRequest` (XHR) to the Omada Server endpoints.

## Critical Files

1. **`index.html`**
   The core structural file. It hosts the hidden inputs for device variables, the `oper-hint` span for error messaging, and various input fields conditionally displayed depending on the selected authentication type (e.g., Voucher, SMS, Local User, LDAP).

2. **`index.js`**
   The most critical logic file. This script coordinates:
   - **URL Parameter Extraction**: Fetching MAC addresses, AP details, SSIDs, and origin URLs.
   - **Controller Initialization**: Contacting the Omada server to inquire about the hotspot type configured.
   - **UI State Management**: Toggling the visibility of input fields (SMS vs. Voucher vs. RADIUS).
   - **Custom Survey rendering (Form Auth)**: Dynamic generation of forms, logic, rating scales, and answers parsing.

3. **`index.css`**
   Styling rules governing the look and feel of the portal interface, error tags, and mobile responsive behavior.

4. **`jquery.min.js`**
   Library used primarily for complex event binding, conditional visibility of options, and manipulating the Form Authentication UI interactions easily.

## Backend Integration and Server Communication

When a client device connects to the wireless network, the Omada AP intercepts the traffic and redirects the user's browser to this portal.

### 1. Initial Handshake (`/portal/getPortalPageSetting`)

`index.js` intercepts URL parameters appended during the redirect to identify the device and access point:

- `clientMac`: The MAC address of the connecting user's device.
- `apMac`: The MAC address of the Access Point.
- `gatewayMac`: Gateway MAC (if any).
- `ssidName`: The SSID the client is connected to.
- `radioId` & `vid`: Radio and VLAN identifiers.
- `originUrl`: Where the user originally wanted to navigate.

An initial `POST` request is sent to `/portal/getPortalPageSetting` payloading these identifiers. The Omada Controller replies with page configuration variables (`data`), such as what types of authentication to present (`globalConfig.hotspotTypes`), translations, styles, button texts, and whether a custom survey form (`formAuth`) should be shown.

### 2. Device Authorization Request (`/portal/auth` or specific endpoints)

Once the user fills the appropriate form (Voucher, User/Pass, SMS Code), the portal sends the authentication payload back to the controller.

- For standard (Voucher/Simple/SMS): POST to `/portal/auth`
- For RADIUS: POST to `/portal/radius/auth`
- For LDAP: POST to `/portal/ldap/auth`

If this network requires SMS Verification, the `Get Code` button triggers a POST to `/portal/sendSmsAuthCode`, forwarding the `phoneNum`, prompting the Omada Controller to execute its SMS API gateway configured on the backend.

### 3. Granting Access

If the Omada server responds to the auth request with `errorCode: 0`, the client device is whitelisted on the AP/Gateway for the granted duration, and the frontend redirects the user browser to the `landingUrl` or their `originUrl`.

## Authentication Types

The portal dynamically caters to differing Access Policies dictated by the Omada Controller:

- **0 - NO_AUTH**: Simply click to pass through.
- **1 - SIMPLE_PASSWORD**: A single shared global password.
- **2 & 8 - RADIUS / EXTERNAL_RADIUS**: 802.1X/Radius based username and password mapping.
- **15 - EXTERNAL_LDAP**: Active Directory / LDAP user credential authentication.
- **3 - VOUCHER_ACCESS_TYPE**: Randomized Voucher Code authentication (time/data limits).
- **5 - LOCAL_USER_ACCESS_TYPE**: Standard portal user management credentials.
- **6 - SMS_ACCESS_TYPE**: Mobile input, OTP delivery via controller's gateway, and code validation.
- **12 - FORM_AUTH_ACCESS_TYPE**: A custom questionnaire/survey the user must complete to connect.

## Error Handling and Communication

Errors are robustly handled by parsing numerical `errorCode` properties returned by the Omada backend POST responses. These mapped errors are displayed to the user via changing the inner HTML of the `<span id="oper-hint">` field.

The error codes comprehensively cover edge cases:

- `-41500` to `-41507`: Voucher Issues (`Voucher code is incorrect`, `Voucher is expired`, `Voucher traffic has exceeded the limit`).
- `-41508` to `-41516`: Local User issues (Quota exceeded, Disabled user, Expired user, Incorrect MAC).
- `-41519` to `-41523`: SMS OTP Issues (Invalid code, Expired code, Failed to send).
- `-41529` / `-43408` / `-43409`: Authentication failure, Active Directory / LDAP invalid credentials mapping, or Radius timeouts.
- `0`: Success / OK.

When an error happens, the frontend catches the `res.errorCode`, runs it through `errorHintMap` dictionary internally, and translates it instantly to human-readable format right above the login forms.
