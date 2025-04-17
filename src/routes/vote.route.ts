import { Router } from "express";
import Route from "../interfaces/route.interface";
import VoteController from "../controllers/vote.controller";
import { ValidationMiddleware } from "../middlewares/validation.middleware";
import { CreateVoteDto } from "../dtos/vote.dto";

export default class VoteRoute implements Route {
  public path = '/vote';
  public router = Router();
  public vote = new VoteController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.vote.getVotes);
    this.router.get('/leaderboard', this.vote.getVoteLeaderBoard);
    this.router.get('/:type', this.vote.getVoteCandidates);
    this.router.post('/', ValidationMiddleware(CreateVoteDto), this.vote.postVote);
  }
}
