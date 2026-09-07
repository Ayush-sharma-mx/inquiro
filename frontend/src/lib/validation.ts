import { z } from 'zod';
import { QuestionType } from '../types';

export const getValidationSchema = (type: QuestionType, isRequired: boolean) => {
  let schema: z.ZodTypeAny = z.any();

  switch (type) {
    case 'short_text':
    case 'long_text':
      schema = z.string();
      if (isRequired) schema = (schema as z.ZodString).min(1, 'This field is required');
      break;
    case 'email':
      schema = z.string().email('Invalid email address');
      if (isRequired) schema = (schema as z.ZodString).min(1, 'This field is required');
      else schema = (schema as z.ZodString).or(z.literal(''));
      break;
    case 'number':
      schema = z.number({ invalid_type_error: 'Must be a number' });
      if (!isRequired) schema = schema.optional().nullable();
      break;
    case 'multiple_choice':
    case 'dropdown':
    case 'yes_no':
    case 'rating':
      schema = z.string().or(z.number());
      if (isRequired) {
        schema = schema.refine((val) => val !== undefined && val !== null && val !== '', {
          message: 'This field is required',
        });
      } else {
        schema = schema.optional().nullable();
      }
      break;
  }

  return schema;
};
