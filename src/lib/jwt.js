import JWT from "jsonwebtoken"

const key = process.env.JWT_KEY || "abcd"

export const jwt = {
  createToken({ event_code, admin = false, uuid }) {
    return JWT.sign({ event_code, admin, uuid }, key)
  },
  verifyToken(token) {
    return JWT.verify(token, key)
  },
}
