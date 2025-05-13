export type UserRole = 'admin' | 'volunteer' | 'user'; // Include 'user' here to match usage

export interface User {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture: string;
  role: 'admin' | 'volunteer' | 'user';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  volunteers: string[]; // user IDs
}
