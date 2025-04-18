import { plainToInstance } from "class-transformer";
import { validateOrReject, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { HttpException } from "../exceptions/HttpException";

/**
 * @name ValidationMiddleware
 * @description Allows use of decorator and non-decorator based validation
 * @param type dto
 * @param skipMissingProperties When skipping missing properties
 * @param whitelist Even if your object is an instance of a validation class it can contain additional properties that are not defined
 * @param forbidNonWhitelisted If you would rather to have an error thrown when any non-whitelisted properties are present
 */
export const ValidationMiddleware = (type: any, skipMissingProperties = false, whitelist = false, forbidNonWhitelisted = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(type, req.body);
    validateOrReject(dto, { skipMissingProperties, whitelist, forbidNonWhitelisted })
      .then(() => {
        req.body = dto;
        next();
      })
      .catch((errors: ValidationError[]) => {
        const message = errors
          .map((error: ValidationError) => {
            // Check if constraints exists
            if (error.constraints) {
              return Object.values(error.constraints);
            }

            // Handle nested validation errors
            if (error.children && error.children.length) {
              return error.children
                .map(child => child.constraints ? Object.values(child.constraints) : [])
                .flat();
            }

            return [`Invalid value for ${error.property}`];
          })
          .flat()
          .join(', ');
        next(new HttpException(400, message));
      });
  };
};
