import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/database/schema.ts',
  out: './drizzle',
  driver: 'libsql',
  dbCredentials: {
    url: 'file:./tournee-facile.db',
  },
} satisfies Config;