import { JwtPayload } from 'modules/auth/interfaces/jwt-payload'

export default (user: JwtPayload) => {
  return {
    timezone: 'Europe/London'
  }
}
