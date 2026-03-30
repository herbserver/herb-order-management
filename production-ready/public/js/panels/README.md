# Panel Structure

Canonical frontend panel files now live in:

- `admin/`
- `departments/`
- `employee/`

Legacy compatibility entry points remain at:

- `public/js/panels/admin.js`
- `public/js/panels/department.js`
- `public/js/panels/employee.js`

These compatibility files exist only so older paths do not break while pages are moved to folder-based script paths.
