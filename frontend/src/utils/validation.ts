/**
 * Frontend validation utilities that match backend API constraints
 */

import { GenerationParams, ValidationError, ValidationResult, VALIDATION_CONSTRAINTS } from '../types/api';

/**
 * Validates a generation parameters object against backend constraints
 */
export function validateGenerationParams(params: GenerationParams): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate prompt
  if (!params.prompt || typeof params.prompt !== 'string') {
    errors.push({
      field: 'prompt',
      message: 'Prompt is required',
      value: params.prompt,
    });
  } else {
    const trimmedPrompt = params.prompt.trim();
    if (trimmedPrompt.length < VALIDATION_CONSTRAINTS.prompt.minLength) {
      errors.push({
        field: 'prompt',
        message: `Prompt must be at least ${VALIDATION_CONSTRAINTS.prompt.minLength} character`,
        value: params.prompt,
      });
    }
    if (trimmedPrompt.length > VALIDATION_CONSTRAINTS.prompt.maxLength) {
      errors.push({
        field: 'prompt',
        message: `Prompt must be no more than ${VALIDATION_CONSTRAINTS.prompt.maxLength} characters`,
        value: params.prompt,
      });
    }
  }

  // Validate negative prompt
  if (params.negativePrompt && params.negativePrompt.length > VALIDATION_CONSTRAINTS.prompt.maxLength) {
    errors.push({
      field: 'negativePrompt',
      message: `Negative prompt must be no more than ${VALIDATION_CONSTRAINTS.prompt.maxLength} characters`,
      value: params.negativePrompt,
    });
  }

  // Validate width
  if (!isValidDimension(params.width)) {
    errors.push({
      field: 'width',
      message: `Width must be between ${VALIDATION_CONSTRAINTS.dimensions.min}-${VALIDATION_CONSTRAINTS.dimensions.max} pixels and a multiple of ${VALIDATION_CONSTRAINTS.dimensions.multipleOf}`,
      value: params.width,
    });
  }

  // Validate height
  if (!isValidDimension(params.height)) {
    errors.push({
      field: 'height',
      message: `Height must be between ${VALIDATION_CONSTRAINTS.dimensions.min}-${VALIDATION_CONSTRAINTS.dimensions.max} pixels and a multiple of ${VALIDATION_CONSTRAINTS.dimensions.multipleOf}`,
      value: params.height,
    });
  }

  // Validate steps
  if (!isValidSteps(params.steps)) {
    errors.push({
      field: 'steps',
      message: `Steps must be between ${VALIDATION_CONSTRAINTS.steps.min}-${VALIDATION_CONSTRAINTS.steps.max}`,
      value: params.steps,
    });
  }

  // Validate guidance scale
  if (!isValidGuidanceScale(params.guidanceScale)) {
    errors.push({
      field: 'guidanceScale',
      message: `Guidance scale must be between ${VALIDATION_CONSTRAINTS.guidanceScale.min}-${VALIDATION_CONSTRAINTS.guidanceScale.max}`,
      value: params.guidanceScale,
    });
  }

  // Validate seed
  if (params.seed !== null && !isValidSeed(params.seed)) {
    errors.push({
      field: 'seed',
      message: `Seed must be between ${VALIDATION_CONSTRAINTS.seed.min}-${VALIDATION_CONSTRAINTS.seed.max}`,
      value: params.seed,
    });
  }

  // Validate scheduler
  if (!isValidScheduler(params.scheduler)) {
    errors.push({
      field: 'scheduler',
      message: `Scheduler must be one of: ${VALIDATION_CONSTRAINTS.validSchedulers.join(', ')}`,
      value: params.scheduler,
    });
  }

  // Validate style (if provided)
  if (params.style && !isValidStyle(params.style)) {
    errors.push({
      field: 'style',
      message: `Style must be one of: ${VALIDATION_CONSTRAINTS.validStyles.join(', ')} or empty`,
      value: params.style,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a dimension (width or height)
 */
export function isValidDimension(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= VALIDATION_CONSTRAINTS.dimensions.min &&
    value <= VALIDATION_CONSTRAINTS.dimensions.max &&
    value % VALIDATION_CONSTRAINTS.dimensions.multipleOf === 0
  );
}

/**
 * Validates steps parameter
 */
export function isValidSteps(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= VALIDATION_CONSTRAINTS.steps.min &&
    value <= VALIDATION_CONSTRAINTS.steps.max
  );
}

/**
 * Validates guidance scale parameter
 */
export function isValidGuidanceScale(value: number): boolean {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    value >= VALIDATION_CONSTRAINTS.guidanceScale.min &&
    value <= VALIDATION_CONSTRAINTS.guidanceScale.max
  );
}

/**
 * Validates seed parameter
 */
export function isValidSeed(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= VALIDATION_CONSTRAINTS.seed.min &&
    value <= VALIDATION_CONSTRAINTS.seed.max
  );
}

/**
 * Validates scheduler parameter
 */
export function isValidScheduler(value: string): boolean {
  return VALIDATION_CONSTRAINTS.validSchedulers.includes(value);
}

/**
 * Validates style parameter
 */
export function isValidStyle(value: string): boolean {
  return value === '' || VALIDATION_CONSTRAINTS.validStyles.includes(value);
}

/**
 * Sanitizes generation parameters to ensure they meet constraints
 */
export function sanitizeGenerationParams(params: GenerationParams): GenerationParams {
  const sanitized = { ...params };

  // Sanitize prompt
  if (sanitized.prompt) {
    sanitized.prompt = sanitized.prompt.trim();
    if (sanitized.prompt.length > VALIDATION_CONSTRAINTS.prompt.maxLength) {
      sanitized.prompt = sanitized.prompt.substring(0, VALIDATION_CONSTRAINTS.prompt.maxLength);
    }
  }

  // Sanitize negative prompt
  if (sanitized.negativePrompt && sanitized.negativePrompt.length > VALIDATION_CONSTRAINTS.prompt.maxLength) {
    sanitized.negativePrompt = sanitized.negativePrompt.substring(0, VALIDATION_CONSTRAINTS.prompt.maxLength);
  }

  // Sanitize dimensions
  sanitized.width = sanitizeDimension(sanitized.width);
  sanitized.height = sanitizeDimension(sanitized.height);

  // Sanitize steps
  sanitized.steps = Math.max(
    VALIDATION_CONSTRAINTS.steps.min,
    Math.min(VALIDATION_CONSTRAINTS.steps.max, Math.round(sanitized.steps))
  );

  // Sanitize guidance scale
  sanitized.guidanceScale = Math.max(
    VALIDATION_CONSTRAINTS.guidanceScale.min,
    Math.min(VALIDATION_CONSTRAINTS.guidanceScale.max, sanitized.guidanceScale)
  );

  // Sanitize seed
  if (sanitized.seed !== null) {
    sanitized.seed = Math.max(
      VALIDATION_CONSTRAINTS.seed.min,
      Math.min(VALIDATION_CONSTRAINTS.seed.max, Math.round(sanitized.seed))
    );
  }

  // Sanitize scheduler
  if (!isValidScheduler(sanitized.scheduler)) {
    sanitized.scheduler = 'ddim'; // Default fallback
  }

  // Sanitize style
  if (sanitized.style && !isValidStyle(sanitized.style)) {
    sanitized.style = ''; // Default to no style
  }

  return sanitized;
}

/**
 * Sanitizes a dimension value
 */
function sanitizeDimension(value: number): number {
  // Clamp to valid range
  const clamped = Math.max(
    VALIDATION_CONSTRAINTS.dimensions.min,
    Math.min(VALIDATION_CONSTRAINTS.dimensions.max, Math.round(value))
  );

  // Round to nearest multiple of 8
  return Math.round(clamped / VALIDATION_CONSTRAINTS.dimensions.multipleOf) * VALIDATION_CONSTRAINTS.dimensions.multipleOf;
}

/**
 * Gets user-friendly validation error messages
 */
export function getValidationErrorMessage(error: ValidationError): string {
  switch (error.field) {
    case 'prompt':
      return `Prompt: ${error.message}`;
    case 'negativePrompt':
      return `Negative Prompt: ${error.message}`;
    case 'width':
      return `Width: ${error.message}`;
    case 'height':
      return `Height: ${error.message}`;
    case 'steps':
      return `Steps: ${error.message}`;
    case 'guidanceScale':
      return `Guidance Scale: ${error.message}`;
    case 'seed':
      return `Seed: ${error.message}`;
    case 'scheduler':
      return `Scheduler: ${error.message}`;
    case 'style':
      return `Style: ${error.message}`;
    default:
      return error.message;
  }
}
