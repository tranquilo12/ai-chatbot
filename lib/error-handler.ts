import { ChatSDKError } from '@/lib/errors';
import { toast } from 'sonner';

/**
 * Centralized error handling utilities
 * Eliminates repeated error handling patterns across the codebase
 */
export class ErrorHandler {
  /**
   * Convert any error to a proper HTTP Response
   * Replaces scattered error handling in API routes
   */
  static toResponse(error: unknown): Response {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    const chatError = new ChatSDKError(
      "bad_request:api",
      error instanceof Error ? error.message : "Unknown error"
    );
    return chatError.toResponse();
  }

  /**
   * Display error as toast notification
   * Replaces repeated toast error patterns in components
   */
  static toToast(error: unknown): void {
    const message =
      error instanceof ChatSDKError
        ? error.message
        : "Something went wrong. Please try again.";

    toast.error(message);
  }

  /**
   * Convert backend API error to ChatSDKError
   * Standardizes backend error handling
   */
  static fromBackendError(error: any, context?: string): ChatSDKError {
    const message = error.detail || error.message || "Backend request failed";
    const contextMessage = context ? `${context}: ${message}` : message;
    
    return new ChatSDKError("bad_request:api", contextMessage);
  }

  /**
   * Handle fetch response errors
   * Common pattern for API calls
   */
  static async handleFetchResponse(response: Response): Promise<Response> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new ChatSDKError("bad_request:api", errorMessage);
    }
    
    return response;
  }

  /**
   * Wrap async operations with error handling
   * Utility for consistent error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ChatSDKError) {
        throw error;
      }
      throw this.fromBackendError(error, context);
    }
  }

  /**
   * Handle SWR errors consistently
   * For use in SWR error callbacks
   */
  static handleSWRError(error: unknown): void {
    // Only show toast for non-network errors to avoid spam
    if (error instanceof ChatSDKError && `${error.type}:${error.surface}` !== 'offline:api') {
      this.toToast(error);
    } else if (!(error instanceof Error) || !error.message.includes('fetch')) {
      this.toToast(error);
    }
  }

  /**
   * Create a network error for offline scenarios
   */
  static createNetworkError(): ChatSDKError {
    return new ChatSDKError(
      "offline:api",
      "Network connection failed. Please check your internet connection."
    );
  }

  /**
   * Create a timeout error
   */
  static createTimeoutError(): ChatSDKError {
    return new ChatSDKError(
      "rate_limit:api",
      "Request timed out. Please try again."
    );
  }

  /**
   * Validate and handle streaming response
   * Common pattern for streaming endpoints
   */
  static validateStreamingResponse(response: Response): void {
    if (!response.ok) {
      throw new ChatSDKError(
        "bad_request:stream",
        `Streaming failed: ${response.status} ${response.statusText}`
      );
    }

    if (!response.body) {
      throw new ChatSDKError(
        "bad_request:stream",
        "No response body available for streaming"
      );
    }
  }
}
