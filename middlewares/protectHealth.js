export const protectHealth = (req, res, next) => {
  const providedKey = req.get('x-health-secret') || req.query.key;

  if (!process.env.HEALTH_SECRET || !providedKey || providedKey !== process.env.HEALTH_SECRET) {
    return res.status(403).send('<h1>403 Forbidden</h1>');
  }

  next();
};