import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Do not transform if it's a binary stream/file or Buffer
        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data;
        }
        return {
          data,
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: 'Success',
        };
      }),
    );
  }
}
