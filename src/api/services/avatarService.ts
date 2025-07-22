import client from '@/api/client';
import { USER } from '../endpoints';

export interface AvatarConfig {
  style: string;
  seed: string;
  options?: Record<string, string>;
}

export interface AvatarResponse {
  success: boolean;
  message: string;
  avatar_url: string;
  avatar_config: AvatarConfig;
}

export const avatarService = {
  async getCurrentAvatar(): Promise<AvatarResponse> {
    const response = await client.get(USER.AVATAR);
    return response.data;
  },

  async updateAvatar(avatarConfig: AvatarConfig): Promise<AvatarResponse> {
    const response = await client.put(USER.AVATAR, { avatar_config: avatarConfig });
    return response.data;
  },

  generateAvatarUrl(config: AvatarConfig): string {
    const { style, seed, options = {} } = config;
    
    const styleMapping: Record<string, string> = {
      'open-peeps': 'open-peeps',
      'adventurer': 'adventurer',
      'lorelei': 'lorelei',
      'croodles': 'croodles',
      'notionists': 'notionists',
      'pixel-art': 'pixel-art',
      'robohash-robots': 'bottts',
      'robohash-monsters': 'monsters'
    };

    const dicebearStyle = styleMapping[style] || style;
    
    if (style === 'robohash-robots' || style === 'robohash-monsters') {
      const robohashSet = style === 'robohash-robots' ? 'set1' : 'set2';
      return `https://robohash.org/${seed}?set=${robohashSet}&size=200x200`;
    }

    const queryParams = new URLSearchParams({ seed });
    Object.entries(options).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    return `https://api.dicebear.com/7.x/${dicebearStyle}/svg?${queryParams.toString()}`;
  },

  parseAvatarConfig(avatarUrl: string): AvatarConfig | null {
    try {
      if (avatarUrl.includes('robohash.org')) {
        const url = new URL(avatarUrl);
        const seed = url.pathname.substring(1);
        const setParam = url.searchParams.get('set');
        const style = setParam === 'set1' ? 'robohash-robots' : 'robohash-monsters';
        return { style, seed };
      }

      if (avatarUrl.includes('api.dicebear.com')) {
        const url = new URL(avatarUrl);
        const pathParts = url.pathname.split('/');
        const dicebearStyle = pathParts[pathParts.length - 2];
        
        const reverseStyleMapping: Record<string, string> = {
          'open-peeps': 'open-peeps',
          'adventurer': 'adventurer',
          'lorelei': 'lorelei',
          'croodles': 'croodles',
          'notionists': 'notionists',
          'pixel-art': 'pixel-art',
          'bottts': 'robohash-robots',
          'monsters': 'robohash-monsters'
        };

        const style = reverseStyleMapping[dicebearStyle] || dicebearStyle;
        const seed = url.searchParams.get('seed') || '';
        
        const options: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          if (key !== 'seed') {
            options[key] = value;
          }
        });

        return { style, seed, options };
      }

      return null;
    } catch {
      return null;
    }
  }
};