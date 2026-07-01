import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/db';

export interface EligibleCompetition {
  id: string;
  competition_number: number;
  is_finale: boolean;
  is_whitelist_only: boolean;
  fcfs_slots_remaining: number | null;
  registration_start: string | null;
  registration_end: string | null;
  competition_start: string;
  eligibilityType: 'WHITELIST' | 'QUALIFIED' | 'FCFS' | null;
}

export function useEligibleCompetitions(walletAddress: string | null) {
  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState<EligibleCompetition[]>([]);

  const checkEligibility = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch all competitions currently in REGISTERING status
      const { data: registeringComps, error } = await supabase
        .from('arena_competitions')
        .select('*')
        .eq('status', 'REGISTERING')
        .order('competition_number', { ascending: true });

      if (error || !registeringComps) {
        setCompetitions([]);
        setLoading(false);
        return;
      }

      if (!walletAddress) {
        // Return competitions but without eligibility info
        setCompetitions(registeringComps.map(c => ({
          id: c.id,
          competition_number: c.competition_number,
          is_finale: c.is_finale,
          is_whitelist_only: c.is_whitelist_only,
          fcfs_slots_remaining: c.fcfs_slots_remaining,
          registration_start: c.registration_start,
          registration_end: c.registration_end,
          competition_start: c.competition_start,
          eligibilityType: null,
        })));
        setLoading(false);
        return;
      }

      const eligibleComps: EligibleCompetition[] = [];

      for (const comp of registeringComps) {
        // Check if already registered
        const { data: existingReg } = await supabase
          .from('arena_registrations')
          .select('id')
          .eq('competition_id', comp.id)
          .eq('wallet_address', walletAddress.toLowerCase())
          .maybeSingle();

        if (existingReg) continue; // Already registered

        let eligibilityType: 'WHITELIST' | 'QUALIFIED' | 'FCFS' | null = null;

        if (comp.is_finale) {
          // Check qualification
          const { data: qualifications } = await supabase
            .from('arena_qualifications')
            .select('id')
            .eq('wallet_address', walletAddress.toLowerCase())
            .eq('qualified_for_finale', true)
            .limit(1);

          if (qualifications && qualifications.length > 0) {
            eligibilityType = 'QUALIFIED';
          } else if (comp.fcfs_slots_remaining && comp.fcfs_slots_remaining > 0) {
            eligibilityType = 'FCFS';
          }
        } else {
          // Standard competition - check whitelist
          if (comp.is_whitelist_only) {
            const { data: whitelistEntry } = await supabase
              .from('arena_whitelist')
              .select('id')
              .eq('competition_id', comp.id)
              .eq('wallet_address', walletAddress.toLowerCase())
              .maybeSingle();

            if (whitelistEntry) {
              eligibilityType = 'WHITELIST';
            }
          } else {
            // Open registration
            eligibilityType = 'WHITELIST';
          }
        }

        if (eligibilityType) {
          eligibleComps.push({
            id: comp.id,
            competition_number: comp.competition_number,
            is_finale: comp.is_finale,
            is_whitelist_only: comp.is_whitelist_only,
            fcfs_slots_remaining: comp.fcfs_slots_remaining,
            registration_start: comp.registration_start,
            registration_end: comp.registration_end,
            competition_start: comp.competition_start,
            eligibilityType,
          });
        }
      }

      setCompetitions(eligibleComps);
    } catch (error) {
      console.error('Error checking eligible competitions:', error);
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  return { loading, competitions, refetch: checkEligibility };
}
