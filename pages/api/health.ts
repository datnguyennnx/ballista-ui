import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Failed to check health status' });
  }
} 