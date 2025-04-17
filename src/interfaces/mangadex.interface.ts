import { Method } from "axios";

export interface MangaDexFetchOptions {
  method?: Method;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
}

export default interface MangaDexManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    createdAt: string;
    tags: Array<{
      attributes: {
        name: { en: string };
        group: string;
      };
    }>;
  };
  relationships: Array<{
    type: string;
    attributes?: { fileName?: string };
  }>;
}

export interface MangaDexStatistics {
  [keys: string]: {
    rating: {
      bayesian: number;
    }
  }
}
