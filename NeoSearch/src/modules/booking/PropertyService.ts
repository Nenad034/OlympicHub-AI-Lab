import { supabase } from '../../api/v1/supabaseClient';

export interface Property {
  id: string;
  name: string;
  star_rating: number;
  description: string | null;
  intro_description: string | null;
  amenity_ids: string[];
  main_image_url: string | null;
  image_urls: string[];
  location: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export class PropertyService {
  /**
   * Fetches all properties from the hotel_catalog database.
   */
  static async fetchAllProperties(): Promise<Property[]> {
    try {
      // Fetching from hotel_catalog which contains the fresh scraped data
      const { data, error } = await supabase
        .from('hotel_catalog')
        .select('*');

      if (error) {
        console.error('Error fetching hotel_catalog from Supabase:', error);
        throw error;
      }

      // Map Supabase response to Property array
      return (data || []).map((row: any) => ({
        id: row.id || row.hotel_name, // Fallback to name if ID is missing
        name: row.hotel_name,
        star_rating: row.stars || 4,
        description: row.description,
        intro_description: row.intro_description,
        amenity_ids: row.amenities || [],
        main_image_url: row.main_image_url,
        image_urls: row.image_urls || [],
        location: row.location,
        meta_title: row.meta_title,
        meta_description: row.meta_description
      }));
    } catch (error) {
      console.error('PropertyService.fetchAllProperties failed:', error);
      return [];
    }
  }

  /**
   * Fetches amenity definitions from the database if needed for a legend.
   */
  static async fetchAmenityDefinitions() {
    try {
      const { data, error } = await supabase
        .from('def_amenities')
        .select('*');
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching amenity definitions:', error);
      return [];
    }
  }
}
