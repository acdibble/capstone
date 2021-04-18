/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable camelcase */

declare global {
  declare namespace Twitter {

    interface URL {
      url: string;
      expanded_url: string;
      display_url: string;
      indices: [number, number];
    }

    interface Palette {
      rgb: { red: number; green: number; blue: number };
      percentage: number;
    }

    interface MediaColor {
      palette: Palette[];
    }

    interface Extension {
      mediaStats: {
        r: { missing: unknown };
        ttl: number;
      };
    }

    interface Entity {
      description?: {
        urls: Twitter.URL[];
      };
      urls?: Twitter.URL[];
    }

    interface ImageType {
      type: 'IMAGE';
      image_value: {
        url: string;
        width: number;
        height: number;
      };
    }

    interface ImageColor {
      type: 'IMAGE_COLOR';
      image_color_value: {
        palette: Palette[];
      };
    }

    interface StringType {
      type: 'STRING';
      string_value: string;
      scribe_key?: string;
    }

    interface UserType {
      type: 'USER';
      user_value: {
        id_str: string;
        path: [];
      };
      scribe_key: 'publisher_id';
    }

    interface User {
      id_str: string;
      name: string;
      screen_name: string;
      location: string;
      description: string;
      entities: Entity;
      followers_count: number;
      fast_followers_count: number;
      normal_followers_count: number;
      friends_count: number;
      listed_count: number;
      created_at: string;
      favourites_count: number;
      geo_enabled: boolean;
      verified: boolean;
      statuses_count: number;
      media_count: number;
      profile_image_url_https: string;
      profile_banner_url: string;
      profile_image_extensions_alt_text: unknown;
      profile_image_extensions_media_availability: unknown;
      profile_image_extensions_media_color: MediaColor;
      profile_image_extensions: Extension;
      profile_banner_extensions_alt_text: unknown;
      profile_banner_extensions_media_availability: unknown;
      profile_banner_extensions_media_color: MediaColor;
      profile_banner_extensions: Extension;
      profile_link_color: string;
      pinned_tweet_ids: number[];
      pinned_tweet_ids_str: string[];
      has_custom_timelines: boolean;
      can_media_tag: boolean;
      following: boolean;
      want_retweets: boolean;
      advertiser_account_type: string;
      advertiser_account_service_levels: string[];
      profile_interstitial_type: string;
      business_profile_state: string;
      translator_type: string;
      withheld_in_countries: [];
      ext: {
        highlightedLabel: {
          r: { ok: Record<string, unknown> };
          ttl: -1;
        };
      };
    }

    interface Card {
      name: 'summary';
      url: string;
      card_type_url: string;
      binding_values: {
        vanity_url: StringType;
        domain: StringType;
        site: UserType;
        title: StringType;
        description: StringType;
        thumbnail_image_small: ImageType;
        thumbnail_image: ImageType;
        thumbnail_image_large: ImageType;
        thumbnail_image_x_large: ImageType;
        thumbnail_image_color: ImageColor;
        thumbnail_image_original: ImageType;
        card_url: StringType;
      };
      users: Record<string, User>;
      card_platform: {
        platform: {
          device: {
            name: 'Swift';
            version: '12';
          };
          audience: { name: 'production' };
        };
      };
    }

    interface Tweet {
      created_at: string;
      id_str: string;
      full_text: string;
      display_text_range: [number, number];
      entities: Entity;
      source: string;
      user_id_str: string;
      retweet_count: number;
      favorite_count: number;
      reply_count: number;
      quote_count: number;
      conversation_id_str: string;
      possibly_sensitive_editable: boolean;
      card: Card;
      lang: 'en';
    }

    interface Response {
      globalObjects: {
        tweets?: Record<string, Tweet>;
      };
    }
  }

  declare namespace Cleaner {
    type Classification = 'positive' | 'neutral' | 'negative'
  }
}

export {};
