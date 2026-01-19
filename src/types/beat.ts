export interface License {
  id: string;
  type: 'mp3' | 'wav' | 'stems';
  name: string;
  price: number;
  includes: string[];
  color: 'basic' | 'premium' | 'exclusive';
}

export interface Beat {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  mood: string;
  coverUrl: string;
  previewUrl: string;
  licenses: License[];
  isExclusiveAvailable: boolean;
  createdAt: Date;
}

export interface CartItem {
  beat: Beat;
  license: License;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerEmail: string;
  paypalTransactionId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}
