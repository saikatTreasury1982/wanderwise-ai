import type { IRecommendationService } from './recommendation-service';
import { RuleBasedRecommender } from './rule-based-recommender';

/**
 * Recommendation Service Factory
 * 
 * This factory decides which recommendation implementation to use.
 * 
 * Phase 1: Always returns RuleBasedRecommender (rule-based SQL queries)
 * Phase 2: Can return AIRecommender based on config/feature flags
 * 
 * Usage:
 *   const recommender = RecommendationFactory.create();
 *   const availability = await recommender.checkAvailability(tripId, userId);
 */
export class RecommendationFactory {
  /**
   * Create a recommendation service instance
   * 
   * Currently returns rule-based implementation.
   * Future: Check environment variable or feature flag to switch to AI.
   * 
   * Example future implementation:
   * ```
   * if (process.env.RECOMMENDATION_ENGINE === 'ai') {
   *   return new AIRecommender();
   * }
   * return new RuleBasedRecommender();
   * ```
   */
  static create(): IRecommendationService {
    // Phase 1: Always use rule-based
    return new RuleBasedRecommender();

    // Phase 2: Uncomment when AI implementation is ready
    // const engine = process.env.RECOMMENDATION_ENGINE || 'rule-based';
    // 
    // switch (engine) {
    //   case 'ai':
    //     return new AIRecommender();
    //   case 'rule-based':
    //   default:
    //     return new RuleBasedRecommender();
    // }
  }

  /**
   * Check if AI recommendations are enabled
   * This can be used in UI to show different badges or messaging
   */
  static isAIEnabled(): boolean {
    return process.env.RECOMMENDATION_ENGINE === 'ai';
  }

  /**
   * Get the current engine name for logging/debugging
   */
  static getEngineName(): string {
    return process.env.RECOMMENDATION_ENGINE || 'rule-based';
  }
}