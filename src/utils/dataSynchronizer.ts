import MangaDexManga, { MangaDexFetchOptions, MangaDexStatistics } from "../interfaces/mangadex.interface";
import Manga from "../interfaces/manga.interface";
import MangaModel from "../models/manga.model";
import mangaDexFetch from "./mangaDexFetcher";

const simplifiyMangaData = (manga: MangaDexManga): Manga => {
  const firstLang = Object.keys(manga.attributes.title)[0];
  const title = manga.attributes.title[firstLang] || 'Untitled';
  const formatTags = manga.attributes.tags
    .filter(tag => tag.attributes.group === 'format')
    .map(tag => tag.attributes.name.en);
  const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
  const coverFileName = coverArt?.attributes?.fileName || null;

  return {
    _id: manga.id,
    title: title,
    tags: formatTags,
    publishedDate: new Date(manga.attributes.createdAt),
    coverUrl: coverFileName ? `https://mangadex.org/covers/${manga.id}/${coverFileName}` : '',
    rating: 0,
  };
};

const getRatingData = async (mangaIds: string[]): Promise<Record<string, number>> => {
  const statistics = (await mangaDexFetch<{ statistics: MangaDexStatistics }>(
    '/statistics/manga',
    {
      method: 'GET',
      params: { 'manga[]': mangaIds },
    },
  )).statistics;
  return Object.keys(statistics).reduce((result, id) => {
    result[id] = statistics[id].rating.bayesian;
    return result;
  }, {} as Record<string, number>);
};

const updateMangaData = async (simplifiedData: Manga[], ratingData: Record<string, number>): Promise<void> => {
  const mangaWithRatings = simplifiedData.map(manga => ({
    ...manga,
    rating: ratingData[manga._id] || 0,
  }));

  const result = await MangaModel.bulkWrite(
    mangaWithRatings.map(manga => ({
      updateOne: {
        filter: { _id: manga._id },
        update: { $set: manga },
        upsert: true
      }
    }))
  );

  console.log('Bulk write operation results:', {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
    insertedCount: result.insertedCount,
  });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const synchronizeData = async (): Promise<void> => {
  const newData: MangaDexManga[] = [];
  const batchSize = 100;
  let received = 0;

  const initialRequestDelay = 200;
  let currentDelay = initialRequestDelay;
  let consecutiveSuccesses = 0;
  let consecutiveFailures = 0;
  while (true) {
    try {
      const options: MangaDexFetchOptions = {
        method: 'GET',
        params: {
          'limit': batchSize,
          'offset': received,
          'includedTags[]': ['f4122d1c-3b44-44d0-9936-ff7502c39ad3', '0a39b5a1-b235-4886-a747-1d05d216532d'],
          'includedTagsMode': 'OR',
          'originalLanguage[]': ['ja'],
          'includes[]': ['cover_art'],
        }
      };

      console.log(`Fetching manga batch (offset: ${received})`);
      const startTime = Date.now();
      const response = await mangaDexFetch<{ data: MangaDexManga[], total: number }>('/manga', options);
      const requestTime = Date.now() - startTime;

      received += response.data.length;
      newData.push(...response.data);

      console.log(`Fetched ${received}/${response.total} manga entries (${requestTime}ms)`);

      consecutiveSuccesses++;
      consecutiveFailures = 0;

      if (consecutiveSuccesses >= 5 && currentDelay > 50) {
        currentDelay = Math.max(initialRequestDelay, currentDelay - 20);
        console.log(`Adjusting request delay to ${currentDelay}ms`);
        consecutiveSuccesses = 0;
      }

      if (received >= response.total) {
        break;
      }

      await sleep(currentDelay);

    } catch (error: unknown) {
      consecutiveFailures++;
      consecutiveSuccesses = 0;

      console.error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);

      currentDelay = Math.min(2000, currentDelay * (1 + 0.5 * consecutiveFailures));
      console.log(`Increasing delay to ${currentDelay}ms after failure`);

      await sleep(currentDelay);
    }
  }
  const simplifiedData = newData.map(simplifiyMangaData);

  const mangaIds = simplifiedData.map(manga => manga._id);
  const chunkSize = 100;
  const ratingData: Record<string, number> = {};
  currentDelay = initialRequestDelay;

  for (let i = 0; i < mangaIds.length; i += chunkSize) {
    try {
      const chunk = mangaIds.slice(i, i + chunkSize);
      console.log(`Fetching ratings for manga ${i + 1}-${Math.min(i + chunkSize, mangaIds.length)}`);

      const chunkRatings = await getRatingData(chunk);
      Object.assign(ratingData, chunkRatings);

      if (i + chunkSize < mangaIds.length) {
        await sleep(currentDelay);
      }
    } catch (error: unknown) {
      console.error(`Error fetching ratings: ${error instanceof Error ? error.message : String(error)}`);
      currentDelay = Math.min(2000, currentDelay * 1.5);
      await sleep(currentDelay);
      i -= chunkSize;
    }
  }
  await updateMangaData(simplifiedData, ratingData);
};

export default synchronizeData;
