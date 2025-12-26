export interface Announcement {
  id: string;
  gymId: string;
  content: string; // HTML content
  updatedAt: Date;
}

export interface UpsertAnnouncementRequest {
  content: string;
}
