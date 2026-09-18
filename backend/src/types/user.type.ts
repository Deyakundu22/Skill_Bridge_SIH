import { RowDataPacket } from "mysql2";

export interface User extends RowDataPacket {
  id: number;
  name: string;
  username: string;
  email: string;
  password: string;
  role:
    | "Student"
    | "Industry"
    | "Academician"
    | "Institution"
    | "Admin"
    | "Faculty"
    | "Institute"
    | string;
  is_email_verified?: boolean;
  email_verified_at?: Date | string | null;
  created_at: Date;
}

export interface UserIdRow extends RowDataPacket {
  id: number;
}
