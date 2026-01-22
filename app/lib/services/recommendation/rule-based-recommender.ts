import { createClient } from '@libsql/client';
import type { IRecommendationService } from './recommendation-service';
import type {
  RecommendationAvailability,
  RecommendationResponse,
  FlightRecommendation,
  AccommodationRecommendation,
  PackingRecommendation,
  ItineraryRecommendation,
  RecommendationSource,
} from '@/app/lib/types/recommendation';

/**
 * Rule-Based Recommendation Implementation
 * 
 * Uses SQL queries to find recommendations from user's historical trips
 * to the same destinations. This is a cost-free, fast implementation
 * suitable for personal use and small user bases.
 * 
 * Matching Logic:
 * 1. Find user's completed (status=3) or suspended (status=4) trips
 * 2. Match destinations (country + city if available)
 * 3. Extract relevant data from matched trips
 * 4. Return with source attribution
 */
export class RuleBasedRecommender implements IRecommendationService {
  private db: ReturnType<typeof createClient>;

  constructor() {
    const databaseUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!databaseUrl || !authToken) {
      throw new Error('Database configuration missing');
    }

    this.db = createClient({
      url: databaseUrl,
      authToken: authToken,
    });
  }

  /**
   * Find matching historical trips for recommendations
   * Returns trips with completed (3) or suspended (4) status
   * that match the current trip's destinations
   */
  private async findMatchingTrips(tripId: number, userId: string): Promise<RecommendationSource[]> {
    try {
      // Get current trip's destinations
      const currentDestinationsResult = await this.db.execute({
        sql: `
          SELECT DISTINCT country, city
          FROM trip_destinations
          WHERE trip_id = ?
        `,
        args: [tripId],
      });

      if (currentDestinationsResult.rows.length === 0) {
        return [];
      }

      const destinations = currentDestinationsResult.rows.map(row => ({
        country: row.country as string,
        city: row.city as string | null,
      }));

      // Find historical trips with matching destinations
      // Only include completed (3) or suspended (4) trips
      const matchingTripsResult = await this.db.execute({
        sql: `
          SELECT DISTINCT 
            t.trip_id,
            t.trip_name,
            t.start_date,
            t.end_date,
            t.status_code
          FROM trips t
          INNER JOIN trip_destinations td ON t.trip_id = td.trip_id
          WHERE t.user_id = ?
            AND t.trip_id != ?
            AND t.status_code IN (3, 4)
            AND (${destinations.map((_, i) => `(td.country = ? ${destinations[i].city ? 'AND td.city = ?' : ''})`).join(' OR ')})
          ORDER BY t.end_date DESC
        `,
        args: [
          userId,
          tripId,
          ...destinations.flatMap(d => d.city ? [d.country, d.city] : [d.country]),
        ],
      });

      return matchingTripsResult.rows.map(row => ({
        trip_id: row.trip_id as number,
        trip_name: row.trip_name as string,
        start_date: row.start_date as string,
        end_date: row.end_date as string,
        status_code: row.status_code as number,
      }));
    } catch (error) {
      console.error('Error finding matching trips:', error);
      return [];
    }
  }

  /**
   * Check if recommendations are available
   */
  async checkAvailability(tripId: number, userId: string): Promise<RecommendationAvailability> {
    try {
      const sources = await this.findMatchingTrips(tripId, userId);

      if (sources.length === 0) {
        return {
          hasRecommendations: false,
          sources: [],
          counts: {
            flights: 0,
            accommodations: 0,
            packingCategories: 0,
            itineraryDays: 0,
          },
        };
      }

      const sourceTripIds = sources.map(s => s.trip_id);

      // Count available recommendations in parallel
      const [flightsCount, accommodationsCount, packingCount, itineraryCount] = await Promise.all([
        this.db.execute({
          sql: `
            SELECT COUNT(DISTINCT flight_option_id) as count
            FROM flight_options
            WHERE trip_id IN (${sourceTripIds.map(() => '?').join(',')})
              AND status IN ('shortlisted', 'confirmed')
          `,
          args: sourceTripIds,
        }),
        this.db.execute({
          sql: `
            SELECT COUNT(DISTINCT accommodation_option_id) as count
            FROM accommodation_options
            WHERE trip_id IN (${sourceTripIds.map(() => '?').join(',')})
              AND status IN ('shortlisted', 'confirmed')
          `,
          args: sourceTripIds,
        }),
        this.db.execute({
          sql: `
            SELECT COUNT(DISTINCT category_id) as count
            FROM packing_categories
            WHERE trip_id IN (${sourceTripIds.map(() => '?').join(',')})
          `,
          args: sourceTripIds,
        }),
        this.db.execute({
          sql: `
            SELECT COUNT(DISTINCT day_id) as count
            FROM itinerary_days
            WHERE trip_id IN (${sourceTripIds.map(() => '?').join(',')})
          `,
          args: sourceTripIds,
        }),
      ]);

      const counts = {
        flights: Number(flightsCount.rows[0]?.count || 0),
        accommodations: Number(accommodationsCount.rows[0]?.count || 0),
        packingCategories: Number(packingCount.rows[0]?.count || 0),
        itineraryDays: Number(itineraryCount.rows[0]?.count || 0),
      };

      const hasRecommendations = Object.values(counts).some(count => count > 0);

      return {
        hasRecommendations,
        sources,
        counts,
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        hasRecommendations: false,
        sources: [],
        counts: {
          flights: 0,
          accommodations: 0,
          packingCategories: 0,
          itineraryDays: 0,
        },
      };
    }
  }

  /**
   * Get flight recommendations
   */
  async getFlightRecommendations(tripId: number, userId: string): Promise<RecommendationResponse<FlightRecommendation>> {
    try {
      const sources = await this.findMatchingTrips(tripId, userId);

      if (sources.length === 0) {
        return { recommendations: [], source: null, count: 0 };
      }

      // Use most recent source trip
      const source = sources[0];

      // Get flights with their legs
      const flightsResult = await this.db.execute({
        sql: `
          SELECT 
            fo.flight_option_id,
            fo.flight_type,
            fo.unit_fare,
            fo.currency_code,
            fo.status,
            fo.created_at,
            fl.departure_airport,
            fl.arrival_airport,
            fl.departure_date,
            fl.departure_time,
            fl.arrival_date,
            fl.arrival_time,
            fl.airline,
            fl.flight_number,
            fl.stops_count,
            fl.duration_minutes,
            fl.leg_order
          FROM flight_options fo
          LEFT JOIN flight_legs fl ON fo.flight_option_id = fl.flight_option_id
          WHERE fo.trip_id = ?
            AND fo.status IN ('shortlisted', 'confirmed')
          ORDER BY fo.flight_option_id, fl.leg_order
        `,
        args: [source.trip_id],
      });

      // Group legs by flight option
      const flightMap = new Map<number, FlightRecommendation>();

      for (const row of flightsResult.rows) {
        const flightId = row.flight_option_id as number;

        if (!flightMap.has(flightId)) {
          // Collect all airlines from legs for this flight
          const airlines: string[] = [];
          
          flightMap.set(flightId, {
            flight_option_id: flightId,
            flight_type: row.flight_type as any,
            total_price: row.unit_fare as number,
            currency_code: row.currency_code as string,
            airline_codes: '', // Will be populated after collecting all legs
            status: row.status as any,
            created_at: row.created_at as string,
            legs: [],
            source,
          });
        }

        if (row.departure_airport) {
          const flight = flightMap.get(flightId)!;
          
          // Combine date and time for datetime
          const departureDateTime = `${row.departure_date}T${row.departure_time || '00:00:00'}`;
          const arrivalDateTime = `${row.arrival_date}T${row.arrival_time || '00:00:00'}`;
          
          flight.legs.push({
            departure_airport: row.departure_airport as string,
            arrival_airport: row.arrival_airport as string,
            departure_datetime: departureDateTime,
            arrival_datetime: arrivalDateTime,
            airline_code: row.airline as string,
            flight_number: row.flight_number as string | null,
            stops_count: row.stops_count as number,
            duration_minutes: row.duration_minutes as number,
          });
          
          // Collect unique airlines
          if (row.airline && !flight.airline_codes.includes(row.airline as string)) {
            if (flight.airline_codes) {
              flight.airline_codes += ',' + row.airline;
            } else {
              flight.airline_codes = row.airline as string;
            }
          }
        }
      }

      const recommendations = Array.from(flightMap.values());

      return {
        recommendations,
        source,
        count: recommendations.length,
      };
    } catch (error) {
      console.error('Error getting flight recommendations:', error);
      return { recommendations: [], source: null, count: 0 };
    }
  }

  /**
   * Get accommodation recommendations
   */
  async getAccommodationRecommendations(tripId: number, userId: string): Promise<RecommendationResponse<AccommodationRecommendation>> {
    try {
      const sources = await this.findMatchingTrips(tripId, userId);

      if (sources.length === 0) {
        return { recommendations: [], source: null, count: 0 };
      }

      // Use most recent source trip
      const source = sources[0];

      const accommodationsResult = await this.db.execute({
        sql: `
          SELECT 
            ao.accommodation_option_id,
            ao.type_name,
            ao.accommodation_name,
            ao.check_in_date,
            ao.check_out_date,
            ao.total_price,
            ao.currency_code,
            ao.status,
            ao.created_at
          FROM accommodation_options ao
          WHERE ao.trip_id = ?
            AND ao.status IN ('shortlisted', 'confirmed')
          ORDER BY ao.check_in_date
        `,
        args: [source.trip_id],
      });

      // Calculate nights from check-in/out dates
      const recommendations: AccommodationRecommendation[] = accommodationsResult.rows.map(row => {
        const checkIn = new Date(row.check_in_date as string);
        const checkOut = new Date(row.check_out_date as string);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          accommodation_option_id: row.accommodation_option_id as number,
          accommodation_type: row.type_name as string,
          property_name: row.accommodation_name as string,
          check_in_date: row.check_in_date as string,
          check_out_date: row.check_out_date as string,
          total_price: row.total_price as number,
          currency_code: row.currency_code as string,
          status: row.status as any,
          nights: nights,
          created_at: row.created_at as string,
          source,
        };
      });

      return {
        recommendations,
        source,
        count: recommendations.length,
      };
    } catch (error) {
      console.error('Error getting accommodation recommendations:', error);
      return { recommendations: [], source: null, count: 0 };
    }
  }

  /**
   * Get packing recommendations
   */
  async getPackingRecommendations(tripId: number, userId: string): Promise<RecommendationResponse<PackingRecommendation>> {
    try {
      const sources = await this.findMatchingTrips(tripId, userId);

      if (sources.length === 0) {
        return { recommendations: [], source: null, count: 0 };
      }

      // Use most recent source trip
      const source = sources[0];

      const packingResult = await this.db.execute({
        sql: `
          SELECT 
            pc.category_name,
            pi.item_name
          FROM packing_categories pc
          LEFT JOIN packing_items pi ON pc.category_id = pi.category_id
          WHERE pc.trip_id = ?
          ORDER BY pc.category_name, pi.item_name
        `,
        args: [source.trip_id],
      });

      // Group items by category
      const categoryMap = new Map<string, PackingRecommendation>();

      for (const row of packingResult.rows) {
        const categoryName = row.category_name as string;

        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            category_name: categoryName,
            items: [],
            source,
          });
        }

        if (row.item_name) {
          categoryMap.get(categoryName)!.items.push({
            item_name: row.item_name as string,
            quantity: row.quantity as number,
          });
        }
      }

      const recommendations = Array.from(categoryMap.values());

      return {
        recommendations,
        source,
        count: recommendations.length,
      };
    } catch (error) {
      console.error('Error getting packing recommendations:', error);
      return { recommendations: [], source: null, count: 0 };
    }
  }

  /**
   * Get itinerary recommendations
   */
  async getItineraryRecommendations(tripId: number, userId: string): Promise<RecommendationResponse<ItineraryRecommendation>> {
    try {
      const sources = await this.findMatchingTrips(tripId, userId);

      if (sources.length === 0) {
        return { recommendations: [], source: null, count: 0 };
      }

      // Use most recent source trip
      const source = sources[0];

      const itineraryResult = await this.db.execute({
        sql: `
          SELECT 
            id.day_id,
            id.description,
            idc.category_name,
            idc.category_cost,
            idc.currency_code as category_currency,
            ia.activity_name,
            ia.start_time,
            ia.end_time,
            ia.activity_cost,
            ia.currency_code as activity_currency
          FROM itinerary_days id
          LEFT JOIN itinerary_day_categories idc ON id.day_id = idc.day_id
          LEFT JOIN itinerary_activities ia ON idc.category_id = ia.category_id
          WHERE id.trip_id = ?
          ORDER BY id.day_id, idc.category_name, ia.start_time
        `,
        args: [source.trip_id],
      });

      // Group by day -> category -> activities
      const dayMap = new Map<string, ItineraryRecommendation>();

      for (const row of itineraryResult.rows) {
        const dayCode = row.day_code as string;

        if (!dayMap.has(dayCode)) {
          dayMap.set(dayCode, {
            day_code: dayCode,
            day_description: row.day_description as string | null,
            categories: [],
            source,
          });
        }

        const day = dayMap.get(dayCode)!;

        if (row.category_name) {
          const categoryName = row.category_name as string;
          let category = day.categories.find(c => c.category_name === categoryName);

          if (!category) {
            category = {
              category_name: categoryName,
              category_cost: row.category_cost as number | null,
              currency_code: row.category_currency as string | null,
              activities: [],
            };
            day.categories.push(category);
          }

          if (row.activity_name) {
            category.activities.push({
              activity_name: row.activity_name as string,
              start_time: row.start_time as string | null,
              end_time: row.end_time as string | null,
              activity_cost: row.activity_cost as number | null,
              currency_code: row.activity_currency as string | null,
            });
          }
        }
      }

      const recommendations = Array.from(dayMap.values());

      return {
        recommendations,
        source,
        count: recommendations.length,
      };
    } catch (error) {
      console.error('Error getting itinerary recommendations:', error);
      return { recommendations: [], source: null, count: 0 };
    }
  }
}