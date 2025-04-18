import { RequestHandler } from "express";
import { MangaType } from "../models/manga.model";
import MangaModel from "../models/manga.model";
import PeriodModel from "../models/period.model";
import VoteModel from "../models/vote.model";
import { verify } from "hcaptcha";
import { HCAPTCHA_SECRET, SECRET_KEY } from "../config";
import { CreateVoteDto } from "../dtos/vote.dto";

export default class VoteController {
  public getVotes: RequestHandler = async (req, res, next) => {
    try {
      const query: any = { ip: req.ip };
      if (req.query.period) {
        query.period = req.query.period;
      }
      const data = await VoteModel.find(query);
      res.status(200).json({ message: 'ok', data });
    }
    catch (error) {
      next(error);
    }
  };

  public getVoteCandidates: RequestHandler = async (req, res, next) => {
    try {
      const type = req.params.type as MangaType;
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;
      const data = {
        ...(await MangaModel.getManga(type, limit, page)),
        limit,
        page,
      };
      res.status(200).json({ message: 'ok', data });
    }
    catch (error) {
      next(error);
    }
  };

  public getVoteLeaderBoard: RequestHandler = async (req, res, next) => {
    try {
      const password = req.query.password;
      if (!password || password.toString() !== SECRET_KEY) {
        res.status(403).json({ message: 'incorrectPassword' });
        return;
      }

      const { period, top, limit, page } = req.query;
      const data = await VoteModel.getLeaderBoard(
        Number(limit) || 10,
        Number(page) || 1,
        req.query.type as MangaType | undefined,
        period as string | undefined,
        Number(top) || undefined,
      );
      res.status(200).json({ message: 'ok', data });
    }
    catch (error) {
      next(error);
    }
  };

  public postVote: RequestHandler = async (req, res, next) => {
    try {
      const body: CreateVoteDto = req.body;
      const hcaptchaResult = await verify(HCAPTCHA_SECRET, body.token);
      if (!hcaptchaResult.success) {
        res.status(403).json({ message: 'invalidCaptcha' });
        return;
      }

      const now = new Date();
      const currentPeriod = await PeriodModel.findOne({
        startDate: { $lte: now },
        endDate: { $gte: now },
        isActive: true,
      });
      if (!currentPeriod) {
        res.status(400).json({ message: 'noActiveVotingPeriod' });
        return;
      }

      if (!!(await VoteModel.findOne({ ip: req.ip, period: currentPeriod._id }))) {
        res.status(429).json({ message: 'rateLimit' });
        return;
      }

      const invalidMangaIds = await MangaModel.validateMangaIds({
        adaptation: body.favoriteAdaptations || [],
        awardWinning: body.favoriteAwardWinnings || [],
        currentMonth: body.favoriteMonthlyPublisheds || [],
        recommended: body.favoriteRecommendeds || []
      });

      if (invalidMangaIds.length > 0) {
        res.status(400).json({ message: 'invalidMangaIds', invalidIds: invalidMangaIds });
        return;
      }

      const userAgent = req.get('User-Agent');
      await VoteModel.create({
        ip: req.ip,
        ua: userAgent,
        periodId: currentPeriod._id,
        favoriteAdaptations: req.body.favoriteAdaptations,
        favoriteAwardWinnings: req.body.favoriteAwardWinnings,
        favoriteMonthlyPublisheds: req.body.favoriteMonthlyPublisheds,
        favoriteRecommendeds: req.body.favoriteRecommendeds,
        userInfo: req.body.userInfo,
      });

      res.status(200).json({ message: 'created' });
    }
    catch (error) {
      next(error);
    }
  };
}
