// Room-related type definitions

export interface Room {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  hasPassword: boolean;
  maxMembers: number;
  currentMembers: number;
  language: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface RoomMember {
  userId: string;
  username: string;
  userType: 'user' | 'guest';
  role: 'owner' | 'member';
  isOnline: boolean;
  joinedAt: Date;
  color: string;
}

export interface CreateRoomData {
  name: string;
  description: string;
  isPublic: boolean;
  password?: string;
  maxMembers: number;
  language: string;
}

export interface RoomJoinResponse {
  room: Room;
  members: RoomMember[];
  currentUser: RoomMember;
}

export interface RoomSettings {
  name?: string;
  description?: string;
  isPublic?: boolean;
  password?: string;
  maxMembers?: number;
  language?: string;
}

export interface MemberInvitation {
  email: string;
  role: RoomRole;
}

export interface RoomExportData {
  room: Room;
  members: RoomMember[];
  files: any[]; // Will be defined when file types are implemented
  createdAt: Date;
}

export interface MemberManagementAction {
  memberId: string;
  action: 'promote' | 'demote' | 'remove';
  newRole?: RoomRole;
}

export type RoomRole = 'owner' | 'member';