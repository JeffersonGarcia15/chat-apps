import { IsNotEmpty, IsString } from "class-validator";

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  groupId: string;
}
