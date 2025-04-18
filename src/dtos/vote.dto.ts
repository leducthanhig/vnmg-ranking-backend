import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayUnique, IsIn, IsInt, IsNotEmpty, IsString, Max, Min, ValidateNested } from "class-validator";

class UserInfo {
  @IsString()
  @IsIn(['male', 'female'])
  gender: string;

  @IsInt()
  @Min(0)
  @Max(100)
  age: number;
}

export class CreateVoteDto {
  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(10)
  favoriteAdaptations: string[];

  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(10)
  favoriteAwardWinnings: string[];

  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(10)
  favoriteMonthlyPublisheds: string[];

  @IsString({ each: true })
  @ArrayUnique()
  @ArrayMaxSize(10)
  favoriteRecommendeds: string[];

  @ValidateNested()
  @Type(() => UserInfo)
  userInfo: UserInfo;

  @IsString()
  @IsNotEmpty()
  token: string;
}
