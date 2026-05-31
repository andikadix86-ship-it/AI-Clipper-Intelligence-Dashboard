# Database Migration History

`prisma/migrations` is the only production migration source of truth.

The `pre-baseline-20260531` folder contains historical SQL files from before the synchronized MVP Beta baseline. Prisma CLI does not read this archive. Do not run these files during deployment.

For production deployment, use:

```bash
npx prisma migrate deploy
```
