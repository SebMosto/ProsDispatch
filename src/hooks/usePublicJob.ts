import { useState, useEffect } from 'react';
import { publicRepository, type PublicJobDetails } from '../repositories/publicRepository';

export function useJobByToken(token: string | undefined) {
  const [job, setJob] = useState<PublicJobDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchJob = async () => {
      setLoading(true);
      const { data, error } = await publicRepository.getJobByToken(token);
      if (error) {
        setError(new Error(error.message));
      } else {
        setJob(data);
      }
      setLoading(false);
    };

    fetchJob();
  }, [token]);

  return { job, loading, error };
}
