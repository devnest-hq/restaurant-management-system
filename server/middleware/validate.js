const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map(i => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  req.body = result.data;
  next();
};

const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map(i => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  next();
};

module.exports = { validate, validateParams };