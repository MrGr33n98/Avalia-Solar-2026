import { fetchIcpProfile, updateIcpProfile, type IcpProfile } from '@/lib/icp-api';

export const icpProfileService = {
  getProfile: async (companyId?: string | number): Promise<IcpProfile> => {
    const numericId = companyId ? Number(companyId) : undefined;
    try {
      // Timeout controller for safety
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const profile = await fetchIcpProfile(numericId);
      clearTimeout(timeoutId);
      return profile;
    } catch (error) {
      console.error('[IcpProfileService.getProfile] Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (profile: Partial<IcpProfile>, companyId?: string | number): Promise<IcpProfile> => {
    const numericId = companyId ? Number(companyId) : undefined;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const updated = await updateIcpProfile(profile, numericId);
      clearTimeout(timeoutId);
      return updated;
    } catch (error) {
      console.error('[IcpProfileService.updateProfile] Error updating profile:', error);
      throw error;
    }
  }
};
