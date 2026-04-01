import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to GCS' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @Body('patientId') patientId: string,
  ) {
    const url = await this.storageService.uploadFile(
      req.tenantId,
      folder || 'general',
      file.originalname,
      file.mimetype,
      file.buffer,
    );
    return {
      fileUrl: url,
      fileName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
      patientId,
    };
  }

  @Get('signed-url')
  @ApiOperation({ summary: 'Generate a signed URL for secure GCS file access' })
  async getSignedUrl(@Query('path') filePath: string) {
    const url = await this.storageService.getSignedUrl(filePath);
    return { signedUrl: url };
  }
}
