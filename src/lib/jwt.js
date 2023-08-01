import JWT from "jsonwebtoken"

const key = "abcd"

export const jwt = {
  createToken(event_code) {
    return JWT.sign({ event_code }, key)
  },
  verifyToken(token) {
    return JWT.verify(token, key)
  },
}
