export default interface Manga {
  _id: string;
  title: string;
  tags: string[];
  publishedDate: Date;
  coverUrl: string;
  rating: number;
}
