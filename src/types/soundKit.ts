export interface SoundKit {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  previewUrl: string | null;
  price: number;
  category: string;
  createdAt: Date;
}

export interface SoundKitCartItem {
  soundKit: SoundKit;
  itemType: 'sound_kit';
}
