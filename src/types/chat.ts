export interface TempMessage {
  id: string;
  type: 'text' | 'image' | 'image_caption' | 'location' | 'audio' | 'video';
  content: string;
  imageData?: string;
  videoData?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  audioBlob?: Blob;
  timestamp: Date;
  isDraft: boolean;
}
