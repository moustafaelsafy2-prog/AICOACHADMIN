import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    id?: string;
  }
  interface Session {
    user: User & {
      role?: string;
      id?: string;
    };
  }
}
