export const protectHealth = (req, res, next) => {
  const key = req.query.key;

  if (!key || key !== process.env.HEALTH_SECRET) {
    return res.status(403).send(`
      <h1>403 Forbidden</h1>
      <p>Invalid health access key.</p>
    `);
  }

  next();
};