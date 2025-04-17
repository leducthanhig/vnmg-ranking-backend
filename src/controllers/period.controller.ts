import { RequestHandler } from "express";
import { SECRET_KEY } from "../config";
import PeriodModel from "../models/period.model";

export default class PeriodController {
  public getAllPeriods: RequestHandler = async (req, res, next) => {
    try {
      const data = await PeriodModel.find().sort({ startDate: -1 });
      res.status(200).json({ message: 'ok', data });
    }
    catch (error) {
      next(error);
    }
  };

  public getActivePeriods: RequestHandler = async (req, res, next) => {
    try {
      const data = await PeriodModel.find({ isActive: true }).sort({ startDate: -1 });
      res.status(200).json({ message: 'ok', data });
    }
    catch (error) {
      next(error);
    }
  };

  public postPeriod: RequestHandler = async (req, res, next) => {
    try {
      const password = req.query.password;
      if (!password || password.toString() !== SECRET_KEY) {
        res.status(403).json({ message: 'incorrectPassword' });
        return;
      }

      await PeriodModel.create({
        _id: req.body.id,
        periodName: req.body.periodName,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        isActive: req.body.isActive,
      });

      res.status(200).json({ message: 'created' });
    }
    catch (error) {
      next(error);
    }
  };

  public togglePeriod: RequestHandler = async (req, res, next) => {
    try {
      const password = req.query.password;
      if (!password || password.toString() !== SECRET_KEY) {
        res.status(403).json({ message: 'incorrectPassword' });
        return;
      }

      const periodId = req.params.id;
      const { isActive } = req.body;

      if (isActive === undefined) {
        res.status(400).json({ message: 'isActiveRequired' });
        return;
      }

      const updatedPeriod = await PeriodModel.findByIdAndUpdate(periodId, { isActive }, { new: true });

      if (!updatedPeriod) {
        res.status(404).json({ message: 'periodNotFound' });
        return;
      }

      res.status(200).json({ message: 'updated', data: updatedPeriod });
    }
    catch (error) {
      next(error);
    }
  };
}
