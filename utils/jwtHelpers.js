import jwt from 'jsonwebtoken';

const sign = async (payload, secret) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, (error, token) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
  });
};

const verify = async (token, secret) => {
  return new Promise((resolve, reject) => {
    // Pin the algorithm to HS256 (our signing alg) to block algorithm-confusion attacks.
    jwt.verify(token, secret, { algorithms: ['HS256'] }, (error, payload) => {
      if (error) {
        resolve(null);
      } else {
        resolve(payload);
      }
    });
  });
};

export { sign, verify };
