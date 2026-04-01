import { Model, UpdateQuery, Document } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
type FilterQuery<T> = any; // Fallback since Mongoose FilterQuery is causing TS type-resolution issues in this environment

export abstract class BaseService<T extends Document> {
  protected constructor(protected readonly model: Model<T>) {}

  async create(tenantId: string, createDto: any): Promise<T> {
    const createdEntity = new this.model({
      ...createDto,
      tenantId,
    });
    return createdEntity.save() as unknown as Promise<T>;
  }

  async findAll(tenantId: string, filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model
      .find({ ...filter, tenantId })
      .lean()
      .exec() as unknown as Promise<T[]>;
  }

  async findOne(tenantId: string, filter: FilterQuery<T>): Promise<T> {
    const entity = await this.model
      .findOne({ ...filter, tenantId })
      .lean()
      .exec();
    if (!entity) {
      throw new NotFoundException(`Entity not found`);
    }
    return entity as unknown as T;
  }

  async findById(tenantId: string, id: string): Promise<T> {
    const entity = await this.model
      .findOne({ _id: id, tenantId } as FilterQuery<T>)
      .lean()
      .exec();
    if (!entity) {
      throw new NotFoundException(`Entity not found`);
    }
    return entity as unknown as T;
  }

  async update(
    tenantId: string,
    id: string,
    updateDto: UpdateQuery<T>,
  ): Promise<T> {
    const entity = await this.model
      .findOneAndUpdate({ _id: id, tenantId } as FilterQuery<T>, updateDto, {
        new: true,
      })
      .lean()
      .exec();

    if (!entity) {
      throw new NotFoundException(`Entity not found`);
    }
    return entity as unknown as T;
  }

  async remove(tenantId: string, id: string): Promise<T> {
    const entity = await this.model
      .findOneAndDelete({ _id: id, tenantId } as FilterQuery<T>)
      .lean()
      .exec();

    if (!entity) {
      throw new NotFoundException(`Entity not found`);
    }
    return entity as unknown as T;
  }
}
