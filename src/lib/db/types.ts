export interface UsersTable {
  id: string;
  username: string;
  password_hash: string;
  created_at: number;
}

export interface MessagesTable {
  id: string;
  user_id: string;
  role: "user" | "admin";
  content: string;
  created_at: number;
}

export interface Database {
  users: UsersTable;
  messages: MessagesTable;
}
