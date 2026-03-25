# Duffel API — Complete Test Mode Reference
### Everything you can do in sandbox mode, documented for the Yui AI project

> **Base URL:** `https://api.duffel.com`  
> **Test token prefix:** `duffel_test_...`  
> **Required headers on every request:**
> ```
> Authorization: Bearer duffel_test_YOUR_TOKEN
> Duffel-Version: v2
> Accept: application/json
> Content-Type: application/json   (POST/PATCH only)
> Accept-Encoding: gzip
> ```

---

## Table of Contents

1. [Test Mode — How It Works](#1-test-mode--how-it-works)
2. [Basics — Authentication, Requests & Responses](#2-basics--authentication-requests--responses)
3. [Flights — Offer Requests](#3-flights--offer-requests)
4. [Flights — Offers](#4-flights--offers)
5. [Flights — Seat Maps](#5-flights--seat-maps)
6. [Flights — Orders](#6-flights--orders)
7. [Flights — Order Cancellations](#7-flights--order-cancellations)
8. [Flights — Order Change Requests](#8-flights--order-change-requests)
9. [Flights — Order Change Offers](#9-flights--order-change-offers)
10. [Flights — Order Changes (Confirm)](#10-flights--order-changes-confirm)
11. [Flights — Airline-Initiated Changes](#11-flights--airline-initiated-changes)
12. [Flights — Airline Credits](#12-flights--airline-credits)
13. [Flights — Batch Offer Requests](#13-flights--batch-offer-requests)
14. [Flights — Payments (Hold Orders)](#14-flights--payments-hold-orders)
15. [Stays — Search](#15-stays--search)
16. [Stays — Quotes](#16-stays--quotes)
17. [Stays — Bookings](#17-stays--bookings)
18. [Stays — Accommodation Data](#18-stays--accommodation-data)
19. [Payments — Payment Intents (Duffel Payments)](#19-payments--payment-intents-duffel-payments)
20. [Notifications — Webhooks](#20-notifications--webhooks)
21. [Identity — Customer Users](#21-identity--customer-users)
22. [Supporting Resources — Airlines, Airports, Aircraft, Places](#22-supporting-resources--airlines-airports-aircraft-places)
23. [Test Scenarios — Predictable Routes Cheat Sheet](#23-test-scenarios--predictable-routes-cheat-sheet)
24. [Yui/ARIA Integration Notes](#24-yuiaria-integration-notes)

---

## 1. Test Mode — How It Works

### What test mode gives you
Test mode is a full sandbox where you can call every API endpoint risk-free with no real money spent, no real flights booked, and no real passengers affected. Everything works the same as live mode — the data structures, the webhooks, the error codes — but all operations are synthetic.

### Token identification
- Test tokens always start with `duffel_test_`
- Live tokens start with `duffel_live_`
- Test tokens can only access resources created in test mode
- Live tokens can only access resources created in live mode

### Duffel Airways — the reliable sandbox airline
Because real airline sandboxes can be unreliable (maintenance windows, exhausted inventory), Duffel created their own sandbox airline called **Duffel Airways** (`IATA code: ZZ`).

**What Duffel Airways supports in test mode:**
- Multiple fare brands (especially useful for business class)
- Extra services (additional baggage)
- Full seat maps with free and paid seats
- Order creation, cancellation, and changes
- Hold orders (pay later)
- Loyalty programme discounts

**How to get Duffel Airways offers:**  
Search for one adult flying **LHR → JFK**. Duffel Airways will always be in the results.

**Duffel Balance in sandbox:**  
When paying for sandbox bookings, use `type: "balance"`. Your sandbox Duffel Balance is unlimited — no top-up needed.

---

## 2. Basics — Authentication, Requests & Responses

### Authentication
Every request must include:
```http
Authorization: Bearer duffel_test_YOUR_TOKEN
```

Token scopes when creating:
- **Read-only** — can only GET resources
- **Read-write** — can GET, POST, PATCH, DELETE

### Versioning
Always pass `Duffel-Version: v2` on every request. Without this header the request will be rejected.

### Request format
- All request bodies must be JSON
- Wrap all POST body fields inside a `"data": {}` object
- Always include `Content-Type: application/json` for POST and PATCH

```json
{
  "data": {
    "your_field": "value"
  }
}
```

### Response format
- All responses are JSON with UTF-8 encoding
- All response bodies wrap data in a `"data": {}` object (or `"data": []` for lists)
- Lists include `"meta": { "before": "...", "after": "...", "limit": 50 }` for pagination
- Compression is supported: include `Accept-Encoding: gzip`

### Pagination
List endpoints use cursor-based pagination via `before` and `after` query parameters. Default page size is 50, maximum is 200.

```
GET /air/orders?limit=20&after=g2wAAAACbQ...
```

### Rate limiting
Rate limit headers are returned on every response:
- `X-RateLimit-Limit` — requests allowed per 60-second window
- `X-RateLimit-Remaining` — requests left in the current window
- `X-RateLimit-Reset` — when the window resets

### Error structure
All errors follow this shape:
```json
{
  "errors": [
    {
      "type": "validation_error",
      "code": "required",
      "message": "departure_date is required",
      "source": { "pointer": "/data/slices/0/departure_date" }
    }
  ]
}
```

Error `type` values: `authentication_error`, `invalid_request_error`, `validation_error`, `airline_error`, `rate_limit_error`, `api_error`

### Response times
Flight search (offer requests) can take up to 20 seconds as Duffel queries multiple airline systems simultaneously. Set your HTTP client timeout to at least **130 seconds** when creating orders or bookings — these involve payment and must not time out on your end.

---

## 3. Flights — Offer Requests

An offer request is a flight search. You describe passengers + journey slices and Duffel queries airlines and returns matching offers.

### Core concept: Slices
A slice is one leg of a journey — origin → destination on a specific date. One-way = 1 slice, return = 2 slices, multi-city = N slices.

### Core concept: Passengers
- `type: "adult"` for passengers 18+
- `type: "child"` with `age` field for under-18
- `type: "infant_without_seat"` for infants (0-1) who sit on lap
- **Best practice:** always specify `age` numerically even for adults — avoids airline-type mismatches

### Create an Offer Request
```
POST /air/offer_requests
```

**Minimal payload (LHR → JFK, 1 adult, economy):**
```json
{
  "data": {
    "slices": [
      {
        "origin": "LHR",
        "destination": "JFK",
        "departure_date": "2025-11-20"
      }
    ],
    "passengers": [
      { "type": "adult" }
    ],
    "cabin_class": "economy"
  }
}
```

**All available fields:**

| Field | Type | Description |
|---|---|---|
| `slices` | array (required) | List of journey legs. Each has `origin`, `destination`, `departure_date`, optional `arrival_time` and `departure_time` windows |
| `passengers` | array (required) | List of passengers. Each has `type` or `age`, optional `loyalty_programme_accounts` |
| `cabin_class` | string | `economy`, `premium_economy`, `business`, `first` |
| `return_offers` | boolean | If `true` (default), returns offers inline. If `false`, returns just the offer request ID for later pagination |
| `max_connections` | integer | `0` = direct flights only, `1` = max one connection |
| `supplier_timeout` | integer | Max ms to wait per airline (default 20,000, max 21,000) |
| `private_fares` | object | Corporate/tour fare codes per airline IATA code |
| `airline_credits` | array | Airline credit IDs to evaluate against offers |

**Return trip (2 slices):**
```json
{
  "data": {
    "slices": [
      { "origin": "MAA", "destination": "BLR", "departure_date": "2025-11-15" },
      { "origin": "BLR", "destination": "MAA", "departure_date": "2025-11-18" }
    ],
    "passengers": [{ "type": "adult" }],
    "cabin_class": "economy"
  }
}
```

**Direct flights only:**
```json
{
  "data": {
    "slices": [{ "origin": "LHR", "destination": "JFK", "departure_date": "2025-11-20" }],
    "passengers": [{ "type": "adult" }],
    "cabin_class": "economy",
    "max_connections": 0
  }
}
```

**With loyalty programme accounts:**
```json
{
  "data": {
    "slices": [{ "origin": "LHR", "destination": "JFK", "departure_date": "2025-11-20" }],
    "passengers": [
      {
        "type": "adult",
        "given_name": "Amelia",
        "family_name": "Earhart",
        "loyalty_programme_accounts": [
          { "airline_iata_code": "BA", "account_number": "BA12345678" }
        ]
      }
    ],
    "cabin_class": "economy"
  }
}
```

### List Offer Requests
```
GET /air/offer_requests
```
Returns paginated list of all offer requests created by your organisation.

### Get a Single Offer Request
```
GET /air/offer_requests/{offer_request_id}
```

### What the response contains
The response returns an object with:
- `id` — the offer request ID (prefix `orq_`)
- `slices` — your requested slices echoed back
- `passengers` — each passenger with a generated `id` (save these — needed for order creation)
- `offers` — array of available offers (if `return_offers: true`)
- `client_key` — used for the Duffel Ancillaries component

---

## 4. Flights — Offers

An offer represents a specific set of flights available to purchase from an airline at a specific price.

### Key offer fields
| Field | Description |
|---|---|
| `id` | Unique offer ID (prefix `off_`) |
| `total_amount` | Total price including taxes, all passengers |
| `base_amount` | Price before taxes |
| `tax_amount` | Taxes portion |
| `total_currency` | ISO 4217 currency code |
| `expires_at` | ISO 8601 datetime — offer typically expires in ~30 minutes |
| `slices` | Journey legs with segments (actual flights) |
| `passengers` | Passenger IDs from the offer request |
| `owner` | The airline selling this offer |
| `available_services` | Extra services available (bags, seats) — only in GET single offer |
| `conditions` | Change/cancellation conditions and penalties |
| `payment_requirements.requires_instant_payment` | `false` = hold order available |
| `passenger_identity_documents_required` | If `true`, passport required for all passengers |
| `supported_passenger_identity_document_types` | `passport`, `tax_id`, `known_traveler_number`, etc. |
| `supported_loyalty_programmes` | Airlines whose loyalty accounts are accepted at booking |
| `total_emissions_kg` | Estimated CO₂ for all passengers |
| `private_fares` | Any private/corporate fares applied |

### List Offers for an Offer Request
```
GET /air/offers?offer_request_id={orq_id}
```

Optional query params:
- `sort` — `total_amount` or `total_duration` (prefix `-` for descending, e.g. `-total_amount`)
- `max_connections` — filter by max connections
- `limit`, `after`, `before` — pagination

```
GET /air/offers?offer_request_id=orq_00009htyDGjIfajdNBZRlw&sort=total_amount&max_connections=0
```

### Get a Single Offer (with services)
```
GET /air/offers/{offer_id}?return_available_services=true
```
Adding `return_available_services=true` returns `available_services` — the list of add-ons (bags, seats) you can bundle with this offer. Always call this right before booking to get the latest price and availability.

### Update an Offer Passenger (add loyalty programme mid-flow)
```
PATCH /air/offers/{offer_id}/passengers/{passenger_id}
```
```json
{
  "data": {
    "given_name": "Amelia",
    "family_name": "Earhart",
    "loyalty_programme_accounts": [
      { "airline_iata_code": "ZZ", "account_number": "TEST123" }
    ]
  }
}
```
**Duffel Airways test loyalty hack:** Use `account_number: "FREQUENT_FLYER_TEST_ACCOUNT"` for a 10% discount and 6 extra checked bags on Duffel Airways offers.

### Reading offer conditions
The `conditions` object tells you what post-booking changes are allowed:
```json
{
  "conditions": {
    "change_before_departure": {
      "allowed": true,
      "penalty_amount": "50.00",
      "penalty_currency": "GBP"
    },
    "refund_before_departure": {
      "allowed": false,
      "penalty_amount": null,
      "penalty_currency": null
    }
  }
}
```

---

## 5. Flights — Seat Maps

Seat maps let you show passengers a visual cabin layout and let them select seats before booking.

### How seat maps work
- One seat map is returned per segment (flight leg)
- Each row contains elements: `seat`, `empty`, `bassinet`, `exit_row`, `lavatory`, `galley`, `stairs`
- Each seat element may have `available_services` attached — that service ID is what you pass when booking
- Seat cost can be `0.00` (free) or a positive amount
- Not all airlines support seat maps — an empty list is a valid response

### Get Seat Maps for an Offer
```
GET /air/seat_maps?offer_id={offer_id}
```

**Response structure:**
```json
{
  "data": [
    {
      "slice_id": "sli_...",
      "segment_id": "seg_...",
      "cabins": [
        {
          "cabin_class": "economy",
          "rows": [
            {
              "sections": [
                {
                  "elements": [
                    {
                      "type": "seat",
                      "designator": "12A",
                      "available_services": [
                        {
                          "id": "ase_...",
                          "total_amount": "0.00",
                          "total_currency": "GBP",
                          "disclosures": ["Standard seat"]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Seat types in a row:**
| `type` value | Meaning |
|---|---|
| `seat` | An actual passenger seat |
| `empty` | Empty space (missing seat position) |
| `bassinet` | Infant bassinet position |
| `exit_row` | Exit row indicator |
| `lavatory` | Toilet |
| `galley` | Galley kitchen |
| `stairs` | Stairs (double-deck aircraft) |

**Rendering rule:** Render `seat`, `empty`, and `bassinet` elements with equal width. Render `exit_row`, `lavatory`, `galley`, and `stairs` to fill available space.

**Wings indicator:** The `wings` field on the cabin tells you which row indices are over the wings — useful for highlighting on your UI.

### Booking a seat when creating an order
```json
{
  "data": {
    "services": [
      { "id": "ase_0000A8QB9MdUMFnIHWQOl4", "quantity": 1 }
    ]
  }
}
```
Rules:
- Each passenger can only have one seat per segment
- Two passengers cannot share the same seat
- Seats are only bookable at order creation — not post-booking

---

## 6. Flights — Orders

An order is a confirmed flight booking. It has a PNR (booking reference) from the airline.

### Create an Order (instant payment)
```
POST /air/orders
```

```json
{
  "data": {
    "type": "instant",
    "selected_offers": ["off_00009htYpSCXrwaB9DnUm0"],
    "payments": [
      {
        "type": "balance",
        "amount": "286.97",
        "currency": "GBP"
      }
    ],
    "passengers": [
      {
        "id": "pas_00009hj8USM7Ncg31cBCLL",
        "given_name": "Amelia",
        "family_name": "Earhart",
        "gender": "f",
        "title": "mrs",
        "born_on": "1987-07-24",
        "phone_number": "+442080160509",
        "email": "[email protected]"
      }
    ]
  }
}
```

### Create an Order with seat and extra bag
```json
{
  "data": {
    "type": "instant",
    "selected_offers": ["off_00009htYpSCXrwaB9DnUm0"],
    "payments": [{ "type": "balance", "amount": "320.00", "currency": "GBP" }],
    "passengers": [
      {
        "id": "pas_00009hj8USM7Ncg31cBCLL",
        "given_name": "Amelia",
        "family_name": "Earhart",
        "gender": "f",
        "title": "mrs",
        "born_on": "1987-07-24",
        "phone_number": "+442080160509",
        "email": "[email protected]"
      }
    ],
    "services": [
      { "id": "ase_seat_service_id", "quantity": 1 },
      { "id": "ase_bag_service_id", "quantity": 1 }
    ]
  }
}
```

### Create a Hold Order (pay later)
Only available on offers where `payment_requirements.requires_instant_payment: false`.

```json
{
  "data": {
    "type": "hold",
    "selected_offers": ["off_00009htYpSCXrwaB9DnUm0"],
    "passengers": [
      {
        "id": "pas_00009hj8USM7Ncg31cBCLL",
        "given_name": "Amelia",
        "family_name": "Earhart",
        "gender": "f",
        "title": "mrs",
        "born_on": "1987-07-24",
        "phone_number": "+442080160509",
        "email": "[email protected]"
      }
    ]
  }
}
```
Do NOT include `payments` key for hold orders. The `payment_required_by` field on the returned order tells you the deadline to pay.

### Key order response fields
| Field | Description |
|---|---|
| `id` | Duffel order ID (prefix `ord_`) |
| `booking_reference` | Airline PNR/record locator (e.g. `"RJNERD"`) |
| `booking_references` | All carrier PNRs if multi-carrier booking |
| `status` | `confirmed`, `cancelled` |
| `slices` | Full itinerary with segments |
| `passengers` | Passenger details |
| `conditions` | Post-booking change/cancel conditions |
| `available_actions` | What you can do: `change`, `cancel`, `add_service` |
| `metadata` | Key-value store for your own data (e.g. `{"user_id": "usr_123"}`) |
| `synced_at` | Last sync with airline — if < 1 min ago, data is current |
| `payment_status` | `paid`, `awaiting_payment` (hold orders) |
| `payment_required_by` | Deadline to pay for hold orders |

### Get a Single Order
```
GET /air/orders/{order_id}
```

### List Orders
```
GET /air/orders
```
Filter params:
- `owner_airline_ids` — filter by airline
- `origin`, `destination` — filter by route
- `departing_at[gte]`, `departing_at[lte]` — departure time window
- `arriving_at[gte]`, `arriving_at[lte]` — arrival time window
- `created_at[gte]`, `created_at[lte]` — creation time
- `awaiting_payment` — show only unpaid hold orders
- `with_unactioned_airline_initiated_changes` — show only orders with pending airline changes
- `user_ids` — filter by customer user

### Update Order Metadata
```
PATCH /air/orders/{order_id}
```
```json
{
  "data": {
    "metadata": { "yui_trip_id": "trip_abc123", "aria_resolved": true }
  }
}
```

### Add Services Post-Booking (extra bags after booking)
```
POST /air/orders/{order_id}/services
```
```json
{
  "data": {
    "add_services": [
      { "id": "ase_bag_service_id", "quantity": 1 }
    ],
    "payment": { "type": "balance", "amount": "35.00", "currency": "GBP" }
  }
}
```

### Payment methods for test mode
In test mode, always use `type: "balance"` — your sandbox balance is unlimited. In live mode, `type: "balance"` draws from your real Duffel balance. `type: "arc_bsp_cash"` is for IATA agents with their own airline relationships.

---

## 7. Flights — Order Cancellations

Cancel a confirmed order and get a refund quote.

### Create an Order Cancellation (get refund quote)
```
POST /air/order_cancellations
```
```json
{
  "data": {
    "order_id": "ord_00009hthhsUZ8W4LxQgkjo"
  }
}
```

This creates a **pending** cancellation and returns a refund quote without actually cancelling. The response includes:
- `refund_amount` — how much will be refunded
- `refund_currency`
- `refund_to` — `balance`, `original_form_of_payment`, `airline_credits`, or `voucher`
- `expires_at` — deadline to confirm this cancellation

**Test scenario — airline credits refund:**  
Book `LTN → SYD`. Create a cancellation — the `refund_to` will be `airline_credits`. Confirm it to see credit codes.

### Confirm an Order Cancellation
```
POST /air/order_cancellations/{cancellation_id}/actions/confirm
```
No request body needed. This actually cancels the booking.

### Get a Single Cancellation
```
GET /air/order_cancellations/{cancellation_id}
```

---

## 8. Flights — Order Change Requests

An order change request starts the process of changing an existing order's flights.

### Create an Order Change Request
```
POST /air/order_change_requests
```
```json
{
  "data": {
    "order_id": "ord_00009hthhsUZ8W4LxQgkjo",
    "slices": {
      "remove": ["sli_00009htYpSCXrwaB9DnUm0"],
      "add": [
        {
          "origin": "LHR",
          "destination": "JFK",
          "departure_date": "2025-11-21",
          "cabin_class": "economy",
          "passengers": [{ "id": "pas_00009hj8USM7Ncg31cBCLL" }]
        }
      ]
    }
  }
}
```

The response returns an order change request with `order_change_offers` — alternative flights you can select to perform the change.

### Get a Single Order Change Request
```
GET /air/order_change_requests/{order_change_request_id}
```

---

## 9. Flights — Order Change Offers

After creating an order change request, you get back a list of order change offers — alternative flight options for the change.

### List Order Change Offers
```
GET /air/order_change_offers?order_change_request_id={ocr_id}
```

### Get a Single Order Change Offer
```
GET /air/order_change_offers/{order_change_offer_id}
```

Key fields in the response:
- `change_total_amount` — cost of the change (positive = you pay more, negative = refund)
- `penalty_total_amount` — airline change fee
- `new_total_amount` — total new order price after change
- `refund_to` — where negative amount goes: `voucher` or `original_form_of_payment`
- `slices.add` / `slices.remove` — new/removed slices

---

## 10. Flights — Order Changes (Confirm)

After choosing an order change offer, create the pending change and then confirm it.

### Create a Pending Order Change
```
POST /air/order_changes
```
```json
{
  "data": {
    "selected_order_change_offer": "oco_00009htYpSCXrwaB9DnUm0"
  }
}
```

### Confirm an Order Change
```
POST /air/order_changes/{order_change_id}/actions/confirm
```

If `change_total_amount > 0`, include payment:
```json
{
  "data": {
    "payment": {
      "type": "balance",
      "amount": "75.00",
      "currency": "GBP"
    }
  }
}
```

If `change_total_amount <= 0`, no payment object needed — a refund will be issued.

### Get a Single Order Change
```
GET /air/order_changes/{order_change_id}
```

---

## 11. Flights — Airline-Initiated Changes

Airline-initiated changes (AIC) are schedule changes made by the airline after you've booked — delays, time changes, cancellations.

### How ARIA uses this for Yui
This is the core disruption detection mechanism. ARIA triggers on `order.airline_initiated_change_detected` webhook events. After receiving the webhook, ARIA calls the AIC API to get full details, then reasons about whether to accept, cancel, or rebook.

### Simulate a disruption in test mode
Book a one-way flight `LHR → LTN`. Then call:
```
GET /air/airline_initiated_changes?order_id={order_id}
```
**Each call to this endpoint on an LHR→LTN order creates a new simulated disruption.** This is the primary mechanism for triggering ARIA in demo/testing.

### List Airline-Initiated Changes
```
GET /air/airline_initiated_changes?order_id={order_id}
```

Response fields:
- `id` — AIC ID
- `action_taken` — `accepted`, `cancelled`, `changed` (null if unactioned)
- `available_actions` — what you can do: `accept`, `cancel`, `change`, `update`
- `slices.before` — original flight schedule
- `slices.after` — updated flight schedule
- `change_total_amount` — cost difference if accepting or rebooking
- `updated_at`, `created_at`

### Accept an Airline-Initiated Change
```
POST /air/airline_initiated_changes/{aic_id}/actions/accept
```
No request body. Accepts the new schedule as-is.

### Cancel the Order Due to an AIC
```
POST /air/airline_initiated_changes/{aic_id}/actions/cancel
```
Cancels the order and triggers a refund.

### Change the Order Due to an AIC
```
POST /air/airline_initiated_changes/{aic_id}/actions/change
```
```json
{
  "data": {
    "selected_order_change_offer": "oco_00009htYpSCXrwaB9DnUm0"
  }
}
```
Rebooks the passenger on alternative flights. The AIC endpoint returns `order_change_offers` alongside the change details.

### Update an AIC (mark as actioned without using Duffel)
```
PATCH /air/airline_initiated_changes/{aic_id}
```
Used when you've handled the change outside of Duffel (e.g. directly with the airline). Sets `action_taken` to indicate the change has been resolved.

---

## 12. Flights — Airline Credits

Airline credits are vouchers/unused tickets issued when a flight is cancelled or changed. They can be used as payment for future bookings.

### What airline credits can do
- Be stored and tracked in Duffel
- Be applied as payment method when creating new orders
- Be combined with balance payments
- Be evaluated for applicability during flight search (pass credit IDs in offer request)
- Be spent, expired, or invalidated — Duffel tracks this automatically

### Create an Airline Credit
```
POST /air/airline_credits
```
```json
{
  "data": {
    "airline_iata_code": "ZZ",
    "code": "CREDIT123456",
    "issued_on": "2025-10-01",
    "expires_on": "2026-10-01",
    "amount": "250.00",
    "currency": "GBP",
    "name": "Flight disruption voucher",
    "given_name": "Amelia",
    "family_name": "Earhart",
    "user_id": "usr_00009htYpSCXrwaB9DnUm0"
  }
}
```

### List Airline Credits
```
GET /air/airline_credits
```
Filter by `user_id` to get all credits for a specific customer.

### Get a Single Airline Credit
```
GET /air/airline_credits/{airline_credit_id}
```

### Use airline credit in an offer request (to see discounts)
```json
{
  "data": {
    "slices": [...],
    "passengers": [...],
    "airline_credits": ["acd_00009htYpSCXrwaB9DnUm1"]
  }
}
```
Offers returned will include `available_airline_credits` if the credit applies.

### Use airline credit when creating an order
```json
{
  "data": {
    "type": "instant",
    "selected_offers": ["off_..."],
    "payments": [
      { "type": "airline_credit", "airline_credit_id": "acd_...", "amount": "150.00", "currency": "GBP" },
      { "type": "balance", "amount": "100.00", "currency": "GBP" }
    ],
    "passengers": [...]
  }
}
```

**Test scenario — airline credits refund from cancellation:**  
Book `LTN → SYD` → cancel → the `refund_to` field on the cancellation will be `airline_credits`. Confirm the cancellation to generate credit codes you can use.

---

## 13. Flights — Batch Offer Requests

Batch offer requests use a long-polling pattern — you start a search and retrieve offers in batches as airlines respond, rather than waiting for all of them.

### When to use batch vs standard offer requests
- **Standard offer request:** Simpler, returns everything at once after airlines respond (up to 20s wait)
- **Batch offer request:** Returns immediately with a request ID; you poll for offer batches as they arrive; better for high-volume or progressive-loading UIs

### Create a Batch Offer Request
```
POST /air/batch_offer_requests
```
Same payload as standard offer requests. Response returns immediately with:
- `id` — batch offer request ID
- `total_batches` — how many batches to expect
- `remaining_batches` — how many batches haven't been returned yet

### Get Batches of Offers
```
GET /air/batch_offer_requests/{id}
```
Call repeatedly until `remaining_batches: 0`. Each response may contain multiple offer batches. Stop polling once `remaining_batches` reaches 0.

---

## 14. Flights — Payments (Hold Orders)

For hold orders, you pay separately after booking. This is useful for "reserve now, pay later" flows.

### Create a Payment for a Hold Order
```
POST /air/payments
```
```json
{
  "data": {
    "order_id": "ord_00009hthhsUZ8W4LxQgkjo",
    "payment": {
      "type": "balance",
      "amount": "286.97",
      "currency": "GBP"
    }
  }
}
```

Possible `type` values:
- `balance` — draw from Duffel balance (use this in test mode)
- `card` — use a tokenised card from a Payment Intent
- `arc_bsp_cash` — IATA agents only
- `airline_credit` — use airline credit voucher

### Payment status flow
`pending` → `succeeded` or `failed`

### Common errors when creating payments
| Error code | Meaning |
|---|---|
| `already_paid` | Order was already paid |
| `already_cancelled` | Order was cancelled before payment |
| `past_payment_required_by_date` | Payment deadline passed |
| `schedule_changed` | Airline changed the order — start again with a new search |

### List Payments for an Order
```
GET /air/payments?order_id={order_id}
```

---

## 15. Stays — Search

The Stays API lets you search and book hotels and accommodation at millions of properties worldwide.

### How Stays works (4-step flow)
1. **Search** — find available accommodations by location or specific property
2. **Quote** — get current price and availability for a specific rate
3. **Book** — confirm the booking using the quote ID
4. **Manage** — cancel or modify the booking

### Create a Stay Search
```
POST /stays/searches
```

**Search by location (lat/long + radius):**
```json
{
  "data": {
    "check_in_date": "2025-11-15",
    "check_out_date": "2025-11-16",
    "rooms": 1,
    "guests": [{ "type": "adult" }],
    "location": {
      "radius": 2,
      "geographic_coordinates": {
        "latitude": 12.9716,
        "longitude": 77.5946
      }
    }
  }
}
```

**Search by specific accommodation ID:**
```json
{
  "data": {
    "check_in_date": "2025-11-15",
    "check_out_date": "2025-11-16",
    "rooms": 1,
    "guests": [{ "type": "adult" }],
    "accommodation": {
      "id": "acc_0000A8QB9MdUMFnIHWQOl4"
    }
  }
}
```

**Additional search options:**
| Field | Description |
|---|---|
| `free_cancellation_only` | Only return rates with free cancellation |
| `negotiated_rate_ids` | Apply pre-negotiated rates |
| `is_mobile_booking` | Affects rates returned — set `true` for mobile users |

### Response
Returns a list of accommodations with:
- `accommodation.id` — the property ID
- `accommodation.name`, `address`, `photos`, `amenities`, `rating`
- `cheapest_rate_total_amount` — price for cheapest available rate (always accurate)
- `rooms` — room options with rates (may not be complete at search stage — use quotes for accuracy)

---

## 16. Stays — Quotes

A quote locks in a specific rate for a specific room and confirms current pricing and availability before booking.

### Create a Quote
```
POST /stays/quotes
```
```json
{
  "data": {
    "rate_id": "rat_0000A8QB9MdUMFnIHWQOl4"
  }
}
```

Use the `rate_id` from your search result's room rates.

### Quote response
- `id` — quote ID (prefix `quo_`)
- `check_in_date`, `check_out_date`
- `total_amount`, `total_currency` — confirmed price
- `cancellation_timeline` — array of refundability windows as check-in approaches
- `supported_loyalty_programme` — hotel loyalty programme if available
- `expires_at` — how long this quote is valid

**Cancellation timeline example:**
```json
{
  "cancellation_timeline": [
    {
      "refund_amount": "250.00",
      "currency": "GBP",
      "before": "2025-11-14T00:00:00Z"
    },
    {
      "refund_amount": "0.00",
      "currency": "GBP",
      "before": null
    }
  ]
}
```
This means: fully refundable before Nov 14, non-refundable after.

### Get a Single Quote
```
GET /stays/quotes/{quote_id}
```

---

## 17. Stays — Bookings

Create and manage hotel bookings.

### Create a Booking
```
POST /stays/bookings
```
```json
{
  "data": {
    "quote_id": "quo_0000A8QB9MdUMFnIHWQOl4",
    "guests": [
      {
        "given_name": "Amelia",
        "family_name": "Earhart",
        "born_on": "1987-07-24",
        "email": "[email protected]",
        "phone_number": "+442080160509"
      }
    ],
    "payment": {
      "type": "balance"
    },
    "accommodation_special_requests": "High floor room if possible"
  }
}
```

### Booking response fields
| Field | Description |
|---|---|
| `id` | Booking ID (prefix `bok_`) |
| `booking_reference` | Hotel's reference — use when contacting hotel |
| `status` | `confirmed`, `cancelled` |
| `check_in_date`, `check_out_date` |  |
| `rooms` | Number of rooms booked |
| `accommodation` | Full accommodation details with photos, address |
| `guests` | Guest details |
| `loyalty_programme_account_number` | If loyalty programme used |
| `cancellation_timeline` | Refundability windows |

### Cancel a Booking
```
POST /stays/bookings/{booking_id}/actions/cancel
```
No request body. Issues a refund according to cancellation policy.

### Get a Booking
```
GET /stays/bookings/{booking_id}
```

### List Bookings
```
GET /stays/bookings
```

### Update a Booking
```
PATCH /stays/bookings/{booking_id}
```
```json
{
  "data": {
    "metadata": { "yui_trip_id": "trip_abc123" },
    "accommodation_special_requests": "Late check-in at 11 PM"
  }
}
```

### Booking with Loyalty Programme
```json
{
  "data": {
    "quote_id": "quo_...",
    "guests": [...],
    "payment": { "type": "balance" },
    "loyalty_programme_account_number": "BONVOY123456"
  }
}
```
**Note:** Hotel loyalty programme must be in the quote's `supported_loyalty_programme` field. Account number is passed on a best-effort basis — the hotel honours it at their discretion.

---

## 18. Stays — Accommodation Data

Supporting data endpoints for building a rich hotel search experience.

### Get Accommodation Details
```
GET /stays/accommodations/{accommodation_id}
```
Returns full property details: description, photos (multiple resolutions), amenities, rating, address, chain, policies.

### List Accommodations (bulk lookup)
```
GET /stays/accommodations
```
Filter by multiple IDs to fetch details for many properties at once.

### Accommodation Reviews
```
GET /stays/accommodations/{accommodation_id}/reviews
```
Returns guest reviews with ratings and comments.

### Negotiated Rates
If your organisation has negotiated rates with hotel chains:
```
GET /stays/negotiated_rates
```
Returns available negotiated rate IDs you can pass in searches.

### Accommodation Loyalty Programmes
```
GET /stays/accommodation_loyalty_programmes
```
Returns all supported hotel loyalty programmes:
`wyndham_rewards`, `choice_privileges`, `marriott_bonvoy`, `best_western_rewards`, `world_of_hyatt`, `hilton_honors`, `ihg_one_rewards`, `leaders_club`, `stash_rewards`, `omni_select_guest`, `i_prefer`, `accor_live_limitless`, `my_6`, `jumeirah_one`, `global_hotel_alliance_discovery`, `duffel_hotel_group_rewards`

### Booking Payment Instructions
```
GET /stays/bookings/{booking_id}/payment_instructions
```
Returns payment instructions for pay-at-hotel bookings (e.g. credit card requirements, key collection steps).

---

## 19. Payments — Payment Intents (Duffel Payments)

Payment Intents are used when you want to collect a card payment directly from your end-user and use Duffel as the payment processor.

> **Note:** For Yui AI's test demo, you won't need Payment Intents — you'll use `type: "balance"` in sandbox. Payment Intents are relevant if you're building a live consumer-facing booking flow.

### Create a Payment Intent
```
POST /payments/payment_intents
```
```json
{
  "data": {
    "amount": "286.97",
    "currency": "GBP"
  }
}
```
Returns a `client_token` — pass this to your frontend to collect the card number via Duffel's secure JS component.

### Confirm a Payment Intent (after card collected)
```
POST /payments/payment_intents/{payment_intent_id}/actions/confirm
```
Called from your backend after the frontend has collected the card. This tops up your Duffel Balance by `amount` minus Duffel Payments fees (2.9%).

### Get a Payment Intent
```
GET /payments/payment_intents/{payment_intent_id}
```

### Refund via Payment Intent
```
POST /payments/payment_intents/{payment_intent_id}/actions/refund
```
```json
{
  "data": {
    "amount": "286.97",
    "currency": "GBP"
  }
}
```

### Test card numbers for Payment Intents
| Card number | Country | Result |
|---|---|---|
| `4000 0082 6000 0000` | Great Britain | Succeeds |
| `4000 0037 2000 0005` | Ireland | Succeeds |
| `4000 0003 6000 0006` | Australia | Succeeds |
| `4242 4242 4242 4242` | USA | Succeeds |
| `4000 0000 0000 3220` | USA | Triggers 3D Secure 2, then succeeds |
| `4000 0000 0000 9995` | USA | Fails (insufficient funds) |

All test cards accept any 3-digit CVC and any future expiry date.

---

## 20. Notifications — Webhooks

Webhooks are how Duffel pushes real-time events to your server. This is the foundation of ARIA's autonomous disruption detection — no polling required.

### Key rule
Duffel allows **one webhook per mode** (one for test, one for live). You cannot have multiple test webhooks.

### Create a Webhook
```
POST /webhooks
```
```json
{
  "data": {
    "url": "https://yui-app.render.com/duffel-webhook",
    "events": [
      "order.airline_initiated_change_detected",
      "order.created",
      "order.creation_failed",
      "payment.created"
    ]
  }
}
```

**CRITICAL:** Save the `secret` from the response — it is shown only once and is used to verify webhook signatures. You will never be able to retrieve it again.

### All Supported Webhook Events

| Event | When it fires |
|---|---|
| `order.created` | Order successfully created (including 200/202 async cases) |
| `order.creation_failed` | Order creation failed after 202 acceptance |
| `order.airline_initiated_change_detected` | Airline changes the schedule of a booked order |
| `payment.created` | Payment successfully created for a hold order |
| `air.payment.succeeded` | Payment succeeded when using airline credits |
| `stays.booking.created` | Stay booking confirmed |
| `stays.booking.creation_failed` | Stay booking failed after acceptance |
| `ping.triggered` | Test event to verify webhook is working |

### Webhook payload structure
```json
{
  "id": "wev_0000A5O5f2N91XniqO9DdY",
  "type": "order.airline_initiated_change_detected",
  "live_mode": false,
  "created_at": "2025-11-15T08:05:00Z",
  "idempotency_key": "ord_0000ApoiwggSbt7BordU1o",
  "identity_organisation_id": "org_0000A5IcgBRqte1uoxkDU8",
  "data": {
    "object": {
      "order_id": "ord_00009hthhsUZ8W4LxQgkjo",
      "airline_initiated_change_id": "aic_00009htYpSCXrwaB9DnUm0"
    }
  }
}
```

### Verifying webhook signatures (HMAC)
Every webhook includes an `X-Duffel-Signature` header. Verify it to ensure the request is genuinely from Duffel:

```python
import hmac
import hashlib

def verify_webhook(payload_body: bytes, secret: str, signature_header: str) -> bool:
    expected = hmac.new(
        secret.encode("utf-8"),
        payload_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)
```

### List Webhooks
```
GET /webhooks
```

### Get a Single Webhook
```
GET /webhooks/{webhook_id}
```

### Update a Webhook (change URL or deactivate)
```
PATCH /webhooks/{webhook_id}
```
```json
{
  "data": {
    "url": "https://new-url.render.com/duffel-webhook",
    "active": true
  }
}
```

### Delete a Webhook
```
DELETE /webhooks/{webhook_id}
```

### Test webhook delivery (ping)
```
POST /webhooks/{webhook_id}/actions/ping
```
Sends a `ping.triggered` event to your URL — use to verify your server is receiving webhooks correctly.

---

## 21. Identity — Customer Users

Customer Users are Duffel's identity layer — they represent the travelers using your platform. Attaching users to orders and bookings enables per-user filtering, access control, and multi-user management.

### Create a Customer User
```
POST /identity/customers/users
```
```json
{
  "data": {
    "email": "[email protected]",
    "given_name": "Amelia",
    "family_name": "Earhart"
  }
}
```

### Get a Customer User
```
GET /identity/customers/users/{user_id}
```

### List Customer Users
```
GET /identity/customers/users
```

### Update a Customer User
```
PATCH /identity/customers/users/{user_id}
```

### Associate a user with an order
When creating orders, include `user_ids`:
```json
{
  "data": {
    "type": "instant",
    "selected_offers": ["off_..."],
    "payments": [...],
    "passengers": [...],
    "user_ids": ["usr_00009htYpSCXrwaB9DnUm0"]
  }
}
```
Users in `user_ids` can then:
- View and manage the order via the Duffel API
- Have their airline credits auto-evaluated against offers
- Filter orders by `user_ids` query param

---

## 22. Supporting Resources — Airlines, Airports, Aircraft, Places

Read-only reference data endpoints.

### Airlines
```
GET /air/airlines
GET /air/airlines/{airline_id}
```
Returns: `id`, `name`, `iata_code`, `logo_symbol_url`, `logo_lockup_url`, `conditions_of_carriage_url`

**Duffel Airways test airline:**
- `iata_code: "ZZ"`
- `name: "Duffel Airways"`

### Airports
```
GET /air/airports
GET /air/airports/{airport_id}
```
Returns: `id`, `name`, `iata_code`, `icao_code`, `city`, `city_name`, `latitude`, `longitude`, `time_zone`, `terminals`

### Aircraft
```
GET /air/aircraft
GET /air/aircraft/{aircraft_id}
```
Returns: `id`, `name`, `iata_code`

### Places (location autocomplete)
```
GET /places/suggestions?query=bengaluru
```
Returns a list of matching airports and cities for autocomplete. Use `type=airport` or `type=city` to filter.

```
GET /places/suggestions?query=BLR&type=airport
```

Response includes `iata_code`, `name`, `type` (`airport` or `city`), `city_name`, `country_name`.

---

## 23. Test Scenarios — Predictable Routes Cheat Sheet

These are guaranteed outcomes in the Duffel sandbox. Use them to test every edge case.

### Offer Request scenarios
| Route | Description | Use case |
|---|---|---|
| `LHR → JFK` | Returns Duffel Airways offers | Primary sandbox route — use for all demos |
| `JFK → EWR` | Returns hold orders (`requires_instant_payment: false`) | Test "pay later" flow |
| `LHR → DXB` | Returns connecting flights (multi-segment) | Test cascade impact on connections |
| `BTS → MRU` | No baggage included | Test zero-baggage edge case |
| `STN → LHR` | Request times out | Test timeout handling |
| `PVD → RAI` | No offers returned | Test empty results handling |
| `DXB → AMS` | Offers have stops (not full connections) | Test stop display |

### Offer API scenarios
| Route | Description |
|---|---|
| `BTS → ABV` (with `return_available_services=true`) | No services returned |
| `LGW → LHR` | Offer no longer available when fetched |
| `LHR → STN` | Price changes between offer request and get offer |

### Order API scenarios
| Route | Description |
|---|---|
| `LHR → LGW` | Order creation fails |
| `LGW → STN` | Insufficient balance error |
| `LHR → STN` | Offer no longer available at order creation |
| `LTN → STN` | Order created but 200 response (async confirm) |
| `SEN → STN` | Order accepted with 202 (async confirm) |
| `LCY → STN` | 202 response + `order.creation_failed` webhook after 30 seconds |

### Airline-Initiated Changes
| Route | Description |
|---|---|
| `LHR → LTN` | Creates a new simulated AIC on every `GET airline_initiated_changes` call |

### Airline Credits
| Route | Description |
|---|---|
| `LTN → SYD` | Cancellation results in `refund_to: "airline_credits"` |

### Payments API
| Route | Description |
|---|---|
| `LTN → STN` | Hold order payment returns 200 (async) |
| `SEN → STN` | Hold order payment returns 202 (async) |

---

## 24. Yui/ARIA Integration Notes

### The ARIA disruption loop using Duffel
```
1. Register webhook:
   POST /webhooks
   events: ["order.airline_initiated_change_detected", "order.created"]
   url: "https://yui-app.render.com/duffel-webhook"

2. Create test trip:
   POST /air/offer_requests  (LHR → LHR JFK, 1 adult)
   GET /air/offers?offer_request_id=...
   POST /air/orders  (type: instant, type: balance)
   → Save ord_id and booking_reference to Supabase trip_context

3. Trigger simulated disruption:
   GET /air/airline_initiated_changes?order_id={ord_id}
   → This creates a new AIC and fires the webhook to your server

4. ARIA receives webhook POST at /duffel-webhook
   → Extracts order_id from payload
   → Fetches full AIC: GET /air/airline_initiated_changes?order_id=...
   → Runs Nova Pro reasoning with full KG context
   → Searches for alternatives: POST /air/offer_requests (same route, new date)
   → Confirms rebooking: POST /air/order_changes/{id}/actions/confirm
   → Updates Supabase trip_context
   → Sends Telegram notification via Yui

5. User taps "Accept":
   → ARIA calls POST /air/airline_initiated_changes/{aic_id}/actions/accept
      (or /actions/change if rebooking to different flight)
   → Updates Supabase with new itinerary
```

### Key fields to save in Supabase trip_context from Duffel
| Duffel field | Where it comes from | What to store |
|---|---|---|
| `booking_reference` | Order response | Primary PNR for user display |
| `id` (order) | Order response | `duffel_order_id` for all future API calls |
| `slices[].segments[].departing_at` | Order/offer | Actual departure times for watchdog |
| `slices[].segments[].arriving_at` | Order/offer | Actual arrival times for free-window detection |
| `passengers[].id` | Offer request | Needed for order creation and changes |
| `conditions.change_before_departure` | Offer/order | Store change penalty for ARIA decision rules |
| `airline_initiated_changes[].id` | AIC response | Store for subsequent accept/cancel/change calls |

### Test payment in sandbox
Always use `type: "balance"` with `amount` matching `offer.total_amount`. Your sandbox balance is unlimited.

```python
# services/duffel.py — Example payment block for sandbox
def make_payment_block(offer):
    return {
        "type": "balance",
        "amount": offer["total_amount"],
        "currency": offer["total_currency"]
    }
```

### Webhook security in FastAPI
```python
# api/duffel_webhook.py
import hmac, hashlib
from fastapi import Request, HTTPException

async def verify_duffel_signature(request: Request, secret: str):
    body = await request.body()
    sig = request.headers.get("X-Duffel-Signature", "")
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    return body
```

### Rate limits to respect
- Standard endpoints: tracked per 60-second window — header `X-RateLimit-Remaining` tells you what's left
- Offer requests: count as multiple calls (one per airline queried) — use `max_connections=0` to reduce airline queries
- Webhook test endpoint (ping): use sparingly in demo setup, not in cron loops

---

*Last updated: March 2026 | Based on Duffel API v2 documentation*  
*For the Yui AI — Autonomous Travel Intelligence System*