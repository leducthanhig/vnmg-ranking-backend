import { Router } from "express";
import Route from "../interfaces/route.interface";
import PeriodController from "../controllers/period.controller";

export default class PeriodRoute implements Route {
  public path = '/period';
  public router = Router();
  public period = new PeriodController();

  constructor() {
    this.initializeRoute();
  }

  private initializeRoute() {
    this.router.get('/', this.period.getAllPeriods);
    this.router.get('/active', this.period.getActivePeriods);
    this.router.post('/', this.period.postPeriod);
    this.router.patch('/:id', this.period.togglePeriod);
  }
}
