export interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  youtubeUrl: string;
  category: string;
  teamMembers: string[];
  semester: string;
  major?: string;
  techTags?: string[];
  isGoldenTicket?: boolean;
  userCreate?: string;
}
