// TEMPORARY diagnostic route — reveals no secret values, only presence/shape. Delete after use.
export async function GET() {
  const url = process.env.DATABASE_URL;
  return Response.json({
    hasDatabaseUrl: !!url,
    length: url?.length ?? 0,
    protocol: url?.split("://")[0] ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
