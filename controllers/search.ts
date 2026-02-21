import { Request, Response } from 'express';
import { SearchQuerySchema } from '@/schemas/search';
import { searchAll as searchAllService } from '@/services/search';

export const searchAll = async (req: Request, res: Response) => {
  try {
    const result = await SearchQuerySchema.safeParseAsync(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: result.error.issues,
      });
    }

    const response = await searchAllService(result.data);

    res.status(200).json({
      success: true,
      message: 'Search results retrieved successfully',
      data: response,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to search';
    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};
