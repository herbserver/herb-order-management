# Employee Panel Structure

This folder is the target split for the employee panel.

Current runtime now loads:
- `public/employee.html`
- `public/js/panels/employee/index.js`
- `public/js/panels/employee/core/*`
- `public/js/panels/employee/shared/*`
- `public/js/panels/employee/tabs/*`

Current runtime still has shared dependency on:
- `public/js/core/session.js` for session storage
- `public/js/core/utils.js` for generic text and clipboard utilities
- `public/js/ui/modals.js` for shared order detail modal rendering

Employee-specific helper popups, WhatsApp helper, auth gate, tracking modal, and global search now live inside:
- `shared/helpers.js`
- `shared/tracking-modal.js`
- `shared/search.js`

`employee.html` no longer needs to load `public/app.js`, `public/js/common.js`, or `public/js/global-search.js`.

## Target layout

### Entry
- `index.js`
  Creates the shared `window.EmployeePanel` namespace.

### Core
- `core/bootstrap.js`
  Employee startup flow, session check, first tab load, shared boot order.
- `core/router.js`
  Tab switching, active tab state, mobile close-on-tab-change behavior.
- `core/layout.js`
  Sidebar, header, layout-level UI helpers.

### Shared
- `shared/order-form.js`
  Order form setup, item rows, totals, COD, submit payload building.
- `shared/orders-api.js`
  Fetch helpers for employee order/history/progress endpoints.
- `shared/renderers.js`
  Shared card/table rendering used by multiple employee tabs.

### Tabs
- `tabs/order-tab.js`
  New order page behavior only.
- `tabs/tracking-tab.js`
  "My Orders" tab data load, filters, pagination.
- `tabs/history-tab.js`
  History tab load, search, pagination, reorder action.
- `tabs/progress-tab.js`
  Progress stats and chart/table rendering.
- `tabs/ofd-tab.js`
  OFD-specific list behavior when that tab is migrated out of legacy code.
- `tabs/cancelled-tab.js`
  Cancelled orders list, filters, search.

## Function migration map

- `switchEmpTab()` -> `core/router.js`
- `toggleEmpSidebar()` -> `core/layout.js`
- `initOrderForm()`, `addItem()`, `calculateTotal()`, `calculateCOD()`, `saveOrder()` -> `shared/order-form.js`
- `loadMyOrders()` -> `tabs/tracking-tab.js`
- `loadMyHistory()` -> `tabs/history-tab.js`
- `loadEmpProgress()` -> `tabs/progress-tab.js`
- `loadMyCancelledOrders()` / `loadCancelledOrders()` -> `tabs/cancelled-tab.js`
- OFD employee handling -> `tabs/ofd-tab.js`

## Migration order

1. Move router and sidebar behavior.
2. Move order form helpers.
3. Move My Orders tab.
4. Move History tab.
5. Move Progress tab.
6. Move Cancelled tab.
7. Move OFD tab.
8. Audit any remaining shared helper usage and remove obsolete employee-specific duplicates from `public/app.js`.

## Rule while migrating

Only one employee-facing implementation should stay active per function on `employee.html`.
When a function moves into this structure, the old copy should either be removed later or safely overridden so employee updates stay isolated.
