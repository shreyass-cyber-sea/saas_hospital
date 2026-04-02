import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  AddClinicalNoteDto,
  AddDocumentDto,
} from './dto/patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new patient' })
  create(@Request() req: any, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(req.tenantId, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List patients with search and pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, phone, or patientId',
  })
  findAll(
    @Request() req: any,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll(req.tenantId, pagination, search);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search patients for autocomplete' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query',
  })
  search(@Request() req: any, @Query('q') query: string) {
    return this.patientsService.searchPatients(req.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full patient profile' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.patientsService.findOne(req.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient info' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(req.tenantId, id, dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get full visit history with clinical notes' })
  getHistory(@Request() req: any, @Param('id') id: string) {
    return this.patientsService.getHistory(req.tenantId, id);
  }

  @Get(':id/appointments')
  @ApiOperation({ summary: 'Get all appointments for a patient' })
  getAppointments(
    @Request() req: any,
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientsService.getAppointments(req.tenantId, id, pagination);
  }

  // ─── Clinical Notes ───────────────────────────────────────────────────────
  @Post(':id/notes')
  @ApiOperation({ summary: 'Add clinical note for patient' })
  addNote(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddClinicalNoteDto,
  ) {
    return this.patientsService.addNote(req.tenantId, id, req.user.id, dto);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'List clinical notes for patient' })
  getNotes(
    @Request() req: any,
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientsService.getNotes(req.tenantId, id, pagination);
  }

  @Patch(':id/notes/:noteId')
  @ApiOperation({ summary: 'Edit a clinical note' })
  updateNote(
    @Request() req: any,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() dto: Partial<AddClinicalNoteDto>,
  ) {
    return this.patientsService.updateNote(req.tenantId, id, noteId, dto);
  }

  // ─── Documents ────────────────────────────────────────────────────────────
  @Post(':id/documents')
  @ApiOperation({
    summary: 'Add document metadata for patient (URL from frontend/GCS)',
  })
  addDocument(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddDocumentDto,
  ) {
    return this.patientsService.addDocument(
      req.tenantId,
      id,
      req.user.id,
      dto,
    );
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'List all documents for patient' })
  getDocuments(@Request() req: any, @Param('id') id: string) {
    return this.patientsService.getDocuments(req.tenantId, id);
  }
}
