// src/app/core/api/api-config.provider.ts
import { Provider } from '@angular/core';

import { environment } from '../environments/environment';
import { ApiConfiguration } from './generated/api-configuration';

export function provideApiConfiguration(): Provider {
  return {
    provide: ApiConfiguration,
    useFactory: () => {
      const config = new ApiConfiguration();
      config.rootUrl = environment.apiUrl;
      return config;
    }
  };
}
