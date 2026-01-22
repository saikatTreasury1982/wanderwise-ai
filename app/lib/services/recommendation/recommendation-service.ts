import type {
  RecommendationAvailability,
  RecommendationResponse,
  FlightRecommendation,
  AccommodationRecommendation,
  PackingRecommendation,
  ItineraryRecommendation,
} from '@/app/lib/types/recommendation';

/**
 * Recommendation Service Interface
 * 
 * This interface defines the contract for all recommendation implementations.
 * Phase 1: Rule-based implementation using SQL queries
 * Phase 2: AI-powered implementation using language models
 * 
 * The factory pattern allows switching between implementations without
 * changing any consuming code.
 */
export interface IRecommendationService {
  /**
   * Check if recommendations are available for a trip
   * @param tripId - The current trip ID
   * @param userId - The user ID (string)
   * @returns Availability status and source information
   */
  checkAvailability(tripId: number, userId: string): Promise<RecommendationAvailability>;

  /**
   * Get flight recommendations
   * @param tripId - The current trip ID
   * @param userId - The user ID (string or number)
   * @returns Flight recommendations with source attribution
   */
  getFlightRecommendations(tripId: number, userId: string): Promise<RecommendationResponse<FlightRecommendation>>;

  /**
   * Get accommodation recommendations
   * @param tripId - The current trip ID
   * @param userId - The user ID (string or number)
   * @returns Accommodation recommendations with source attribution
   */
  getAccommodationRecommendations(tripId: number, userId: string): Promise<RecommendationResponse<AccommodationRecommendation>>;

  /**
   * Get packing recommendations
   * @param tripId - The current trip ID
   * @param userId - The user ID (string or number)
   * @returns Packing recommendations grouped by category
   */
  getPackingRecommendations(tripId: number, userId: string): Promise<RecommendationResponse<PackingRecommendation>>;

  /**
   * Get itinerary recommendations
   * @param tripId - The current trip ID
   * @param userId - The user ID (string or number)
   * @returns Itinerary recommendations grouped by day
   */
  getItineraryRecommendations(tripId: number, userId: string): Promise<RecommendationResponse<ItineraryRecommendation>>;
}