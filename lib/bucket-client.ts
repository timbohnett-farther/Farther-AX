/**
 * S3 Bucket Client — L2 cache layer (durable warm cache)
 *
 * Railway Storage Buckets are S3-compatible object storage.
 * Stores JSON blobs keyed by namespace/id. Survives Redis eviction and restarts.
 *
 * Requires environment variables:
 *   S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_ENDPOINT, S3_REGION
 *
 * Gracefully degrades if bucket is unavailable — returns null on miss.
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

// ── S3 Client ───────────────────────────────────────────────────────────────

const BUCKET = process.env.S3_BUCKET;
const ENDPOINT = process.env.S3_ENDPOINT;
const ACCESS_KEY = process.env.S3_ACCESS_KEY;
const SECRET_KEY = process.env.S3_SECRET_KEY;
const REGION = process.env.S3_REGION || 'auto';

let s3: S3Client | null = null;

function getS3(): S3Client | null {
  if (!BUCKET || !ENDPOINT || !ACCESS_KEY || !SECRET_KEY) return null;
  if (!s3) {
    s3 = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
      forcePathStyle: false,
    });
  }
  return s3;
}

// ── Generic Operations ──────────────────────────────────────────────────────

/**
 * Read a JSON blob from the bucket.
 * Returns null if key doesn't exist or bucket is unavailable.
 */
export async function getFromBucket<T>(
  prefix: string,
  id: string
): Promise<T | null> {
  const client = getS3();
  if (!client || !BUCKET) return null;

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `${prefix}/${id}.json`,
      })
    );
    const body = await response.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch (err: unknown) {
    const error = err as { name?: string };
    if (error.name === 'NoSuchKey') return null;
    console.error(`[bucket-client] GET ${prefix}/${id} failed:`, err);
    return null;
  }
}

/**
 * Write a JSON blob to the bucket.
 * Adds _cachedAt metadata timestamp — the only addition to the data.
 */
export async function putToBucket<T>(
  prefix: string,
  id: string,
  data: T
): Promise<void> {
  const client = getS3();
  if (!client || !BUCKET) return;

  try {
    const blob = {
      ...(data as Record<string, unknown>),
      _cachedAt: new Date().toISOString(),
    };

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${prefix}/${id}.json`,
        Body: JSON.stringify(blob),
        ContentType: 'application/json',
      })
    );
  } catch (err) {
    console.error(`[bucket-client] PUT ${prefix}/${id} failed:`, err);
  }
}

/**
 * Delete a JSON blob from the bucket.
 */
export async function deleteFromBucket(
  prefix: string,
  id: string
): Promise<void> {
  const client = getS3();
  if (!client || !BUCKET) return;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: `${prefix}/${id}.json`,
      })
    );
  } catch (err) {
    console.error(`[bucket-client] DELETE ${prefix}/${id} failed:`, err);
  }
}

/**
 * List all keys under a prefix.
 * Returns array of key strings (e.g., ["advisors/12345.json", ...])
 */
export async function listBucketKeys(prefix: string): Promise<string[]> {
  const client = getS3();
  if (!client || !BUCKET) return [];

  try {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `${prefix}/`,
      })
    );
    return (response.Contents || [])
      .map(obj => obj.Key!)
      .filter(Boolean);
  } catch (err) {
    console.error(`[bucket-client] LIST ${prefix} failed:`, err);
    return [];
  }
}

/**
 * Read all JSON blobs under a prefix.
 * Used for bulk listing (e.g., all advisors).
 */
export async function getAllFromBucket<T>(prefix: string): Promise<T[]> {
  const client = getS3();
  if (!client || !BUCKET) return [];

  try {
    const keys = await listBucketKeys(prefix);
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const response = await client.send(
            new GetObjectCommand({ Bucket: BUCKET!, Key: key })
          );
          const body = await response.Body?.transformToString();
          return body ? JSON.parse(body) as T : null;
        } catch {
          return null;
        }
      })
    );
    return results.filter(Boolean) as T[];
  } catch (err) {
    console.error(`[bucket-client] GET ALL ${prefix} failed:`, err);
    return [];
  }
}

// ── Health Check ────────────────────────────────────────────────────────────

export async function bucketHealthCheck(): Promise<boolean> {
  const client = getS3();
  if (!client || !BUCKET) return false;

  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    return true;
  } catch {
    return false;
  }
}
