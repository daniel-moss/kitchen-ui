// Pre-defined demo users for stories and prototypes. Photos live in
// public/avatars/. Paths are RELATIVE (no leading slash) on purpose: the
// static build may be hosted under a subpath (GitHub Pages serves it at
// /<repo>/), where absolute /avatars/… would 404. Order matches the Figma
// User Avatars set and ../Kitchen UI/assets/users.json, so it stays in sync
// with the HTML prototypes.

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  /** Absolute path served from public/. */
  avatar: string;
}

export const users: User[] = [
  { id: 1, firstName: "Lorne", lastName: "Riddle", name: "Lorne Riddle", avatar: "avatars/user-01.jpg" },
  { id: 2, firstName: "Thiago", lastName: "Cummings", name: "Thiago Cummings", avatar: "avatars/user-02.jpg" },
  { id: 3, firstName: "Amy", lastName: "Lowery", name: "Amy Lowery", avatar: "avatars/user-03.jpg" },
  { id: 4, firstName: "Kate", lastName: "Charles", name: "Kate Charles", avatar: "avatars/user-04.jpg" },
  { id: 5, firstName: "Dirk", lastName: "Horton", name: "Dirk Horton", avatar: "avatars/user-05.jpg" },
  { id: 6, firstName: "Angel", lastName: "Leblanc", name: "Angel Leblanc", avatar: "avatars/user-06.jpg" },
  { id: 7, firstName: "Seb", lastName: "Phillips", name: "Seb Phillips", avatar: "avatars/user-07.jpg" },
  { id: 8, firstName: "Ismaeel", lastName: "Landry", name: "Ismaeel Landry", avatar: "avatars/user-08.jpg" },
  { id: 9, firstName: "Junior", lastName: "Booker", name: "Junior Booker", avatar: "avatars/user-09.jpg" },
  { id: 10, firstName: "Zara", lastName: "Mcneil", name: "Zara Mcneil", avatar: "avatars/user-10.jpg" },
  { id: 11, firstName: "Aisa", lastName: "Donovan", name: "Aisa Donovan", avatar: "avatars/user-11.jpg" },
  { id: 12, firstName: "Camalla", lastName: "Robinson", name: "Camalla Robinson", avatar: "avatars/user-12.jpg" },
  { id: 13, firstName: "Daisy", lastName: "Bullock", name: "Daisy Bullock", avatar: "avatars/user-13.jpg" },
  { id: 14, firstName: "Eryk", lastName: "Pitts", name: "Eryk Pitts", avatar: "avatars/user-14.jpg" },
  { id: 15, firstName: "Ken", lastName: "Potts", name: "Ken Potts", avatar: "avatars/user-15.jpg" },
  { id: 16, firstName: "Adam", lastName: "Kraner", name: "Adam Kraner", avatar: "avatars/user-16.jpg" },
  { id: 17, firstName: "Aaran", lastName: "Mann", name: "Aaran Mann", avatar: "avatars/user-17.jpg" },
  { id: 18, firstName: "Bryn", lastName: "Booker", name: "Bryn Booker", avatar: "avatars/user-18.jpg" },
  { id: 19, firstName: "Scott", lastName: "Lyons", name: "Scott Lyons", avatar: "avatars/user-19.jpg" },
];

/** Object/company placeholder image (mesh gradient). */
export const objectPlaceholder = "avatars/object-placeholder.jpg";

export const usersById: Map<number, User> = new Map(users.map((u) => [u.id, u]));

/** Uppercase initials, e.g. "Lorne Riddle" → "LR". */
export function initials(user: User): string {
  return (user.firstName[0] + user.lastName[0]).toUpperCase();
}

/** One random user. */
export function randomUser(): User {
  return users[Math.floor(Math.random() * users.length)];
}

/** `n` distinct random users (clamped to the set size). */
export function randomUsers(n: number): User[] {
  return [...users].sort(() => Math.random() - 0.5).slice(0, Math.min(n, users.length));
}
