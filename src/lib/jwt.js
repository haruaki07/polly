import JWT from "jsonwebtoken"

const key = "abcd"

export const jwt = {
  createToken({ event_code, admin = false }) {
    return JWT.sign({ event_code, admin }, key)
  },
  verifyToken(token) {
    return JWT.verify(token, key)
  },
}
