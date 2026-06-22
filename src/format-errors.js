// Formats validate.js errors for NHS frontend components
function toKebabCase(value) {
  return `${value || ""}`
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

function formatErrors(validationErrors) {
  if (!validationErrors) return null;

  const errors = {};
  const errorSummary = [];

  // Loop through all failed fields
  for (const [field, messages] of Object.entries(validationErrors)) {
    // Take just the first error message for each field
    const errorMessage = messages[0];

    // For the individual input component
    errors[field] = {
      text: errorMessage
    };

    // For the error summary at the top of the page
    errorSummary.push({
      text: errorMessage,
      href: `#${toKebabCase(field)}`
    });
  }

  return { errors, errorSummary };
}

module.exports = { formatErrors };
