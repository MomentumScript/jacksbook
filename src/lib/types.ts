export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Post = {
  id: number;
  author_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'> | null;
  likes: { user_id: string }[];
  comments: { count: number }[];
};

export type Comment = {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'> | null;
};

export type Route =
  | { name: 'tabs' }
  | { name: 'comments'; postId: number }
  | { name: 'profile'; userId: string }
  | { name: 'editProfile' };
