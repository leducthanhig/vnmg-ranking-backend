import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { PipelineStage } from "mongoose";
import { MangaType } from "./manga.model";

class UserInfo {
  @prop({ required: true })
  public age!: number;

  @prop({ required: true })
  public gender!: string;
}

class Vote extends TimeStamps {
  @prop({ required: true })
  public ip!: string;

  @prop()
  public ua?: string;

  @prop({ required: true })
  public period!: string;

  @prop({ type: String, required: true })
  public favoriteAdaptations!: string[];

  @prop({ type: String, required: true })
  public favoriteAwardWinnings!: string[];

  @prop({ type: String, required: true })
  public favoriteMonthlyPublisheds!: string[];

  @prop({ type: String, required: true })
  public favoriteRecommendeds!: string[];

  @prop({ required: true })
  public userInfo!: UserInfo;

  public static async getLeaderBoard(
    this: ReturnModelType<typeof Vote>,
    limit: number,
    page: number,
    type?: MangaType,
    period?: string,
    top?: number,
  ) {
    const count = await this.countDocuments(period ? { period: period } : {});
    const gender = await this.aggregate(getUserInfoAggregate('userInfo.gender', period));
    const age = await this.aggregate(getUserInfoAggregate('userInfo.age', period));
    const results: any = {};
    switch (type) {
      case MangaType.ADAPTATION:
        results.favoriteAdaptations = await this.aggregate(getMangaAggrerate('favoriteAdaptations', limit, page, period, top));
        break;
      case MangaType.AWARD_WINNING:
        results.favoriteAwardWinnings = await this.aggregate(getMangaAggrerate('favoriteAwardWinnings', limit, page, period, top));
        break;
      case MangaType.CURRENT_MONTH:
        results.favoriteMonthlyPublisheds = await this.aggregate(getMangaAggrerate('favoriteMonthlyPublisheds', limit, page, period, top));
        break;
      case MangaType.RECOMMENDED:
        results.favoriteRecommendeds = await this.aggregate(getMangaAggrerate('favoriteRecommendeds', limit, page, period, top));
        break;
      case undefined:
        results.favoriteAdaptations = await this.aggregate(getMangaAggrerate('favoriteAdaptations', limit, page, period, top));
        results.favoriteAwardWinnings = await this.aggregate(getMangaAggrerate('favoriteAwardWinnings', limit, page, period, top));
        results.favoriteMonthlyPublisheds = await this.aggregate(getMangaAggrerate('favoriteMonthlyPublisheds', limit, page, period, top));
        results.favoriteRecommendeds = await this.aggregate(getMangaAggrerate('favoriteRecommendeds', limit, page, period, top));
        break;
      default:
        throw new Error(`Invalid manga type: ${type}`);
    }
    return { count, gender, age, ...results };
  }
}

const VoteModel = getModelForClass(Vote);

export default VoteModel;

const getMangaAggrerate = (field: string, limit: number, page: number, period?: string, top?: number): PipelineStage[] => [
  ...(period !== undefined ? [{ $match: { period: period } }] : []),
  {
    $unwind: {
      path: `$${field}`,
    },
  },
  {
    $group: {
      _id: `$${field}`,
      count: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: 'manga',
      localField: '_id',
      foreignField: '_id',
      as: 'manga',
    },
  },
  {
    $sort: {
      count: -1,
    },
  },
  {
    $addFields: {
      manga: { $first: '$manga' },
    },
  },
  ...(top !== undefined ? [{ $limit: top }] : []),
  { $skip: (page - 1) * limit },
  { $limit: limit },
];

const getUserInfoAggregate = (field: string, period?: string): PipelineStage[] => [
  ...(period ? [{ $match: { period: period } }] : []),
  {
    $unwind: {
      path: `$${field}`,
    },
  },
  {
    $group: {
      _id: `$${field}`,
      count: { $sum: 1 },
    },
  },
  {
    $sort: {
      count: -1,
    },
  },
];
