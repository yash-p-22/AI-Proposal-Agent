import type { NextApiRequest, NextApiResponse } from 'next';
import { listJobPosts, createJobPost } from '@/lib/firebaseService';
import type { JobPost } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ jobs: JobPost[] } | JobPost | { error: string }>,
) {
  if (req.method === 'GET') {
    try {
      const jobs = await listJobPosts();
      return res.status(200).json({ jobs });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const job = await createJobPost(req.body);
      return res.status(201).json(job);
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
