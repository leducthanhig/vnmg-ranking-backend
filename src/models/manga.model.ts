import { prop, getModelForClass, modelOptions, ReturnModelType } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { PipelineStage } from "mongoose";

@modelOptions({ schemaOptions: { collection: 'manga' } })
class Manga extends TimeStamps {
  @prop({ required: true })
  public _id!: string;

  @prop({ required: true })
  public title!: string;

  @prop({ type: String, required: true })
  public tags!: string[];

  @prop({ required: true })
  public publishedDate!: Date;

  @prop({ required: true })
  public coverUrl!: string;

  @prop({ required: true })
  public rating!: number;

  public static async getManga(this: ReturnModelType<typeof Manga>, type: MangaType, limit: number, page: number) {
    let filteringStages: PipelineStage[] = [];
    switch (type) {
      case MangaType.ADAPTATION:
        filteringStages = this.getMangaWithTagAggregate('Adaptation');
        break;
      case MangaType.AWARD_WINNING:
        filteringStages = this.getMangaWithTagAggregate('Award Winning');
        break;
      case MangaType.CURRENT_MONTH:
        filteringStages = this.getCurrentMonthPublicationAggregate();
        break;
      case MangaType.RECOMMENDED:
        filteringStages = this.getRecommendedMangaAggregate();
        break;
      default:
        throw new Error(`Invalid manga type: ${type}`);
    }

    const result = await this.aggregate([
      ...filteringStages,
      {
        $facet: {
          results: [
            { $sort: { title: 1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $project: { _id: 1, title: 1, coverUrl: 1 } },
          ],
          total: [
            { $count: 'count' },
          ],
        },
      },
    ]);

    return {
      results: result[0].results,
      total: result[0].total[0]?.count || 0,
    };
  }

  private static getMangaWithTagAggregate(this: ReturnModelType<typeof Manga>, tag: string): PipelineStage[] {
    return [
      { $match: { tags: tag } },
    ];
  }

  private static getCurrentMonthPublicationAggregate(this: ReturnModelType<typeof Manga>): PipelineStage[] {
    const now = new Date();
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const firstDayOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    return [
      {
        $match: {
          publishedDate: {
            $gte: firstDayOfMonth,
            $lt: firstDayOfNextMonth
          }
        }
      }
    ];
  }

  private static getRecommendedMangaAggregate(this: ReturnModelType<typeof Manga>): PipelineStage[] {
    return [
      { $sort: { rating: -1 } },
      { $limit: 500 },
    ];
  }

  public static async validateMangaIds(
    this: ReturnModelType<typeof Manga>,
    {
      adaptation = [],
      awardWinning = [],
      currentMonth = [],
      recommended = []
    }: {
      adaptation?: string[];
      awardWinning?: string[];
      currentMonth?: string[];
      recommended?: string[];
    }
  ): Promise<Array<{ type: MangaType, id: string }>> {
    const invalidIds: Array<{ type: MangaType, id: string }> = [];

    // Check adaptation manga
    if (adaptation.length > 0) {
      const validIds = await this.find({
        _id: { $in: adaptation },
        tags: 'Adaptation'
      }).select('_id');

      const validIdStrings = validIds.map(m => m._id);
      adaptation.filter(id => !validIdStrings.includes(id))
        .forEach(id => invalidIds.push({ type: MangaType.ADAPTATION, id }));
    }

    // Check award-winning manga
    if (awardWinning.length > 0) {
      const validIds = await this.find({
        _id: { $in: awardWinning },
        tags: 'Award Winning'
      }).select('_id');

      const validIdStrings = validIds.map(m => m._id);
      awardWinning.filter(id => !validIdStrings.includes(id))
        .forEach(id => invalidIds.push({ type: MangaType.AWARD_WINNING, id }));
    }

    // Check current month manga
    if (currentMonth.length > 0) {
      const now = new Date();
      const validIds = await this.find({
        _id: { $in: currentMonth },
        publishedDate: {
          $gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
          $lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
        }
      }).select('_id');

      const validIdStrings = validIds.map(m => m._id);
      currentMonth.filter(id => !validIdStrings.includes(id))
        .forEach(id => invalidIds.push({ type: MangaType.CURRENT_MONTH, id }));
    }

    // Check recommended manga
    if (recommended.length > 0) {
      // Get the ratings of the top 500 manga
      const minRating = await this.aggregate([
        { $sort: { rating: -1 } },
        { $skip: 499 },  // Get the 500th item
        { $limit: 1 },
        { $project: { rating: 1 } }
      ]).then(results => results[0]?.rating || 0);

      // Validate the provided IDs against the rating threshold
      const validIds = await this.find({
        _id: { $in: recommended },
        rating: { $gte: minRating }  // Must have rating at least as high as the 500th manga
      }).select('_id');

      const validIdStrings = validIds.map(m => m._id);
      recommended.filter(id => !validIdStrings.includes(id))
        .forEach(id => invalidIds.push({ type: MangaType.RECOMMENDED, id }));
    }

    return invalidIds;
  }
}

const MangaModel = getModelForClass(Manga);

export default MangaModel;

export enum MangaType {
  ADAPTATION = 'adaptation',
  AWARD_WINNING = 'award-winning',
  CURRENT_MONTH = 'current-month',
  RECOMMENDED = 'recommended',
}
