import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

const API_PREFIX = '/api/';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = environment.apiBaseUrl;
  if (!baseUrl || !req.url.startsWith(API_PREFIX)) {
    return next(req);
  }
  const rewritten = req.clone({ url: `${baseUrl}${req.url}` });
  return next(rewritten);
};
