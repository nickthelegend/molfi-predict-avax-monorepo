import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/db';

export type AdmissionType = 'WHITELIST' | 'QUALIFIED' | 'FCFS' | 'NONE';

export interface EligibilityResult {
  isEligible: boolean;
  admissionType: AdmissionType;
  reason: string;
  isAlreadyRegistered: boolean;
  competitionStatus: string;
  fcfsSlotsRemaining?: number;
  qualifiedFromCompetition?: number;
}

export interface ArenaCompetition {
  id: string;
  season_id: string;
  competition_number: number;
  is_finale: boolean;
  status: string;
  registration_start: string | null;
  registration_end: string | null;
  competition_start: string;
  competition_end: string;
  is_whitelist_only: boolean;
  fcfs_slots: number;
  fcfs_slots_remaining: number;
}

export function useArenaEligibility(competitionId: string | null, walletAddress: string | null) {
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState<ArenaCompetition | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult>({
    isEligible: false,
    admissionType: 'NONE',
    reason: 'Checking eligibility...',
    isAlreadyRegistered: false,
    competitionStatus: 'UNKNOWN',
  });

  const checkEligibility = useCallback(async () => {
    if (!competitionId || !walletAddress) {
      setEligibility({
        isEligible: false,
        admissionType: 'NONE',
        reason: 'Connect wallet to check eligibility.',
        isAlreadyRegistered: false,
        competitionStatus: 'UNKNOWN',
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch competition details
      const { data: compData, error: compError } = await supabase
        .from('arena_competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (compError || !compData) {
        setEligibility({
          isEligible: false,
          admissionType: 'NONE',
          reason: 'Competition not found.',
          isAlreadyRegistered: false,
          competitionStatus: 'UNKNOWN',
        });
        setLoading(false);
        return;
      }

      setCompetition(compData as ArenaCompetition);

      // Check if competition is accepting registrations
      if (compData.status !== 'REGISTERING') {
        setEligibility({
          isEligible: false,
          admissionType: 'NONE',
          reason: compData.status === 'LIVE' 
            ? 'Competition is already live. Registration closed.'
            : compData.status === 'FINALIZED'
            ? 'Competition has ended.'
            : 'Registration is not open for this competition.',
          isAlreadyRegistered: false,
          competitionStatus: compData.status,
        });
        setLoading(false);
        return;
      }

      // Check if user is already registered
      const { data: existingReg } = await supabase
        .from('arena_registrations')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .maybeSingle();

      if (existingReg) {
        setEligibility({
          isEligible: false,
          admissionType: 'NONE',
          reason: 'You are already registered for this competition.',
          isAlreadyRegistered: true,
          competitionStatus: compData.status,
        });
        setLoading(false);
        return;
      }

      // Check admission type based on competition type
      if (compData.is_finale) {
        // Finale: Check if qualified from prior competitions OR FCFS
        const { data: qualifications } = await supabase
          .from('arena_qualifications')
          .select('competition_id, final_rank')
          .eq('wallet_address', walletAddress.toLowerCase())
          .eq('qualified_for_finale', true);

        if (qualifications && qualifications.length > 0) {
          // User qualified from a prior competition
          const qualComp = qualifications[0];
          // Get competition number
          const { data: qualCompData } = await supabase
            .from('arena_competitions')
            .select('competition_number')
            .eq('id', qualComp.competition_id)
            .single();

          setEligibility({
            isEligible: true,
            admissionType: 'QUALIFIED',
            reason: `Qualified from Competition ${qualCompData?.competition_number || '?'} (Rank #${qualComp.final_rank})`,
            isAlreadyRegistered: false,
            competitionStatus: compData.status,
            qualifiedFromCompetition: qualCompData?.competition_number,
          });
          setLoading(false);
          return;
        }

        // Check FCFS availability
        if (compData.fcfs_slots_remaining > 0) {
          setEligibility({
            isEligible: true,
            admissionType: 'FCFS',
            reason: `Open entry slot available.`,
            isAlreadyRegistered: false,
            competitionStatus: compData.status,
            fcfsSlotsRemaining: compData.fcfs_slots_remaining,
          });
          setLoading(false);
          return;
        }

        setEligibility({
          isEligible: false,
          admissionType: 'NONE',
          reason: 'You are not eligible for the Grand Finale. Qualification required or no FCFS slots remaining.',
          isAlreadyRegistered: false,
          competitionStatus: compData.status,
          fcfsSlotsRemaining: 0,
        });
        setLoading(false);
        return;
      }

      // Standard competition: Check whitelist
      if (compData.is_whitelist_only) {
        const { data: whitelistEntry } = await supabase
          .from('arena_whitelist')
          .select('id')
          .eq('competition_id', competitionId)
          .eq('wallet_address', walletAddress.toLowerCase())
          .maybeSingle();

        if (whitelistEntry) {
          setEligibility({
            isEligible: true,
            admissionType: 'WHITELIST',
            reason: 'You are whitelisted for this competition.',
            isAlreadyRegistered: false,
            competitionStatus: compData.status,
          });
        } else {
          setEligibility({
            isEligible: false,
            admissionType: 'NONE',
            reason: 'This competition is invite-only. You are not on the whitelist.',
            isAlreadyRegistered: false,
            competitionStatus: compData.status,
          });
        }
        setLoading(false);
        return;
      }

      // Open registration (shouldn't happen for competitions 1-5 per spec)
      setEligibility({
        isEligible: true,
        admissionType: 'WHITELIST',
        reason: 'Open registration.',
        isAlreadyRegistered: false,
        competitionStatus: compData.status,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setEligibility({
        isEligible: false,
        admissionType: 'NONE',
        reason: 'Error checking eligibility. Please try again.',
        isAlreadyRegistered: false,
        competitionStatus: 'UNKNOWN',
      });
      setLoading(false);
    }
  }, [competitionId, walletAddress]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  return { loading, competition, eligibility, refetch: checkEligibility };
}
