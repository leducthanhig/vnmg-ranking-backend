import { prop, getModelForClass } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

class Period extends TimeStamps {
  @prop({ required: true })
  public _id!: string;

  @prop({ required: true })
  public periodName!: string;

  @prop({ required: true })
  public startDate!: Date;

  @prop({ required: true })
  public endDate!: Date;

  @prop({ default: true })
  public isActive!: boolean;
}

const PeriodModel = getModelForClass(Period);

export default PeriodModel;
