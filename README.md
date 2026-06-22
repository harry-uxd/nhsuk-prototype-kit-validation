# nhs-prototype-validation

Validation engine for NHS prototype kit apps. Declarative rules, custom validators, NHS-shaped error output.

Define validation rules directly in your Nunjucks templates — no custom routes or server logic needed. When a form is submitted, the middleware checks the rules, and if validation fails it re-renders the page with the correct NHS error summary and inline error messages.

---

## Install

```bash
npm install nhs-prototype-validation
```

The post-install script will prompt you to optionally copy example pages and docs into your prototype. If the prompts don't appear (some npm setups suppress them), run the script manually:

```bash
node node_modules/nhs-prototype-validation/scripts/postinstall.js
```

---

## Wiring

### 1. Add the middleware to your routes

In `app/routes.js`, import and register the middleware **before** `module.exports = router`:

```js
const { createValidationMiddleware } = require('nhs-prototype-validation');

router.use(createValidationMiddleware());
```

#### Custom render callback (optional)

By default, the middleware derives the view path from `req.path` and calls `res.render`. If your prototype uses a different view path strategy, pass a custom `render` function:

```js
router.use(createValidationMiddleware({
  render(req, res, formattedErrors) {
    res.render('my/custom/path', {
      errors: formattedErrors.errors,
      errorList: formattedErrors.errorSummary,
    });
  }
}));
```

### 2. Make the macro available

The `applyValidation` macro needs to be on the Nunjucks search path. There are two ways to do this:

**Option A — Add the package to `viewsPath` in `app.js`** (recommended, no file copying):

```js
const viewsPath = [
  'app/views/',
  'node_modules/nhs-prototype-validation/',
]
```

Then in your layout (`app/views/layouts/main.html`):

```njk
{% from "macros/validation.njk" import applyValidation %}
```

**Option B — Copy the macro into your views folder** (simpler if you don't want to touch `app.js`):

```bash
cp node_modules/nhs-prototype-validation/macros/validation.njk app/views/macros/validation.njk
```

Then in your layout (`app/views/layouts/main.html`):

```njk
{% from "macros/validation.njk" import applyValidation %}
```

---

## Usage

Add `applyValidation()` directly beneath any input that needs validation. Pass it the field name and a rules object.

```njk
{% extends 'layouts/main.html' %}

{% block pageTitle %}
  {% if errorList %}Error: {% endif %}Enter your email
{% endblock %}

{% block content %}
  <div class="nhsuk-grid-row">
    <div class="nhsuk-grid-column-two-thirds">

      {% if errorList %}
        {{ errorSummary({ titleText: "There is a problem", errorList: errorList }) }}
      {% endif %}

      <h1 class="nhsuk-heading-l">Enter your email</h1>

      <form method="post">
        {{
          input({
            label: { text: "Email" },
            id: "email",
            name: "email",
            value: data['email'],
            errorMessage: errors.email
          })
        }}
        {{
          applyValidation('email', {
            presence: { allowEmpty: false, message: "Enter your email" },
            email: { message: "Enter an email address in the correct format, like name@example.com" }
          })
        }}
        {{ button({ text: "Continue" }) }}
      </form>

    </div>
  </div>
{% endblock %}
```

The `errorMessage: errors.<fieldName>` property wires the individual field error. `errorList` feeds the summary at the top of the page.

---

## Validator reference

### `presence`

Makes a field mandatory. Use `allowEmpty: false` to reject whitespace-only input.

```js
presence: {
  allowEmpty: false,
  message: "Enter your name"
}
```

> For `select`/dropdown fields, make sure the default option has an empty `value` (e.g. `value: ""`). A non-empty default value will be treated as a filled field and bypass presence validation.

---

### `email`

Validates email address format.

```js
email: {
  message: "Enter an email address in the correct format, like name@example.com"
}
```

---

### `length`

Enforces character limits.

```js
length: {
  minimum: 8,
  maximum: 20,
  message: "Password must be between 8 and 20 characters"
}
```

Use `is` for an exact length requirement:

```js
length: { is: 6, message: "Enter a 6-digit code" }
```

---

### `isValidDate`

Validates a standard NHS 3-box date input (day, month, year). Checks that all three boxes are filled and the combined date is a real calendar date.

```js
isValidDate: {
  message: "Enter a valid date of birth"
}
```

> `validDate` and `customDate` are supported as aliases for backwards compatibility.

Combine with `presence` to also catch empty date fields:

```js
presence: { message: "Enter your date of birth" },
isValidDate: { message: "Enter a valid date of birth" }
```

---

### `isInPast`

Validates that a date is before today.

```js
isInPast: {
  message: "Date must be in the past"
}
```

---

### `isInFuture`

Validates that a date is after today.

```js
isInFuture: {
  message: "Date must be in the future"
}
```

---

### `dateGuess`

Compares a date against a fixed target and returns a different message depending on whether the entry is before or after it.

```js
dateGuess: {
  target: "2005-05-25",
  messageBefore: "That date is too early",
  messageAfter: "That date is too late"
}
```

Both `messageBefore` and `messageAfter` are required when `target` is set.

---

### `fileType`

Validates a file upload field by checking the submitted filename extension. Does **not** inspect MIME type or file contents.

```js
fileType: {
  allowed: ["pdf", "jpg", "jpeg", "png"],
  message: "Choose a PDF, JPG or PNG file"
}
```

> **Important:** Because this checks the filename extension string only, a user could rename any file to bypass it. This is intentional and appropriate for prototypes. Do not rely on this for security in production.

---

### `conditional`

Validates a conditionally revealed input (e.g., a text field that appears when a specific radio or checkbox is selected). The validator only triggers if the parent option is selected.

```js
conditional: {
  dependentOn: {
    name: "contactMethod",   // name of the parent radios/checkboxes field
    value: "email"           // the option value that reveals this input
  },
  message: "Enter your email address"
}
```

Typically used alongside `presence` on the parent field:

```js
// Parent radios
applyValidation('contactMethod', {
  presence: { message: "Select a contact method" }
})

// Revealed child input
applyValidation('contactEmail', {
  conditional: {
    dependentOn: { name: "contactMethod", value: "email" },
    message: "Enter your email address"
  }
})
```

#### Persisting conditional state across validation errors

When re-rendering after a validation failure, keep the parent option selected so the conditional input stays visible. For radios:

```njk
checked: data.contactMethod == "email"
```

For checkboxes:

```njk
{% set selectedMethods = data.updateMethod or [] %}
...
checked: "email" in selectedMethods
```

The `or []` fallback prevents template errors on first page load.

---

### Built-in validate.js validators

All [validate.js](https://validatejs.org/) built-in validators are also available:

`presence`, `length`, `email`, `type`, `inclusion`, `exclusion`, `format`, `numericality`, `equality`, `url`, `datetime`

---

## Debug logging

Validation debug logging is **off by default**. Enable it with any of these flags:

| Method | How |
|--------|-----|
| Environment variable | `VALIDATION_DEBUG=true npm start` |
| Query string | `?validationDebug=true` |
| Hidden form input | `<input type="hidden" name="_validationDebug" value="true">` |
| Session | `req.session.data._validationDebug = true` |

Accepted truthy values: `true`, `1`, `yes`, `on`.

When enabled, the middleware logs each step to the console: rule parsing, field normalisation, date part handling, the prepared data object (with sensitive values masked), and the final validation result.

---

## Security note

**This package is designed for prototype use only.**

`applyValidation()` writes validation rules into hidden form inputs (`_validationRules[...]`). Those values are posted back by the browser, which means a user can modify or remove them before submission.

This is fine for UX prototyping — it is not safe as a security boundary in production.

The middleware automatically strips `_validationRules` and `_validationDebug` from the session and request body before handing off to the NHS prototype kit's auto-store middleware.

---

## Example pages

The `examples/` directory contains 12 working form pages covering every built-in validator. Run the post-install script (or copy them manually) to add them to your prototype under `app/views/validation/`:

| Page | Validators demonstrated |
|------|------------------------|
| `email.html` | `presence`, `email` |
| `textarea.html` | `presence`, `length` |
| `select.html` | `presence` |
| `radios.html` | `presence` |
| `checkboxes.html` | `presence` |
| `current-password.html` | `presence`, `length` |
| `new-password.html` | `presence`, `length` |
| `date-past-future.html` | `presence`, `isValidDate`, `isInPast`, `isInFuture` |
| `date-guess.html` | `presence`, `isValidDate`, `dateGuess` |
| `file-upload.html` | `presence`, `fileType` |
| `conditional-radios.html` | `presence`, `conditional` |
| `conditional-checkboxes.html` | `presence`, `conditional` |

---

## License

MIT
