export interface UnityAsset {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  assetType: 'ACCOUNT' | 'GOOGLE_DRIVE';
  originalLink: string;
  driveLink?: string;
  owner?: string;
  createdAt?: number;
}
