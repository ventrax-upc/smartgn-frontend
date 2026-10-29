import { User } from '../domain/model/user.entity';

/*
  Every authenticated role lands on the same operational overview. The
  overview adapts its content to the role, so there is no need for a
  role-specific landing route.
*/
export function defaultRouteForUser(_user: User | null): string {
  return '/home';
}
