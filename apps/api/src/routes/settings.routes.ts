import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/auth';
import { UserRole } from '@sakura/database';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';

const router = Router();

// Validation schemas
const saveApiKeysSchema = z.object({
  openaiKey: z.string().optional(),
  geminiKey: z.string().optional(),
});

const testApiKeySchema = z.object({
  provider: z.enum(['openai', 'gemini']),
  apiKey: z.string().min(1),
});

/**
 * Mask API key to show only first 4 and last 4 characters
 * Example: "sk-abc123xyz" -> "sk-a...xyz"
 */
function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * GET /api/settings/api-keys
 * Get current API keys (masked)
 */
router.get(
  '/api-keys',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const openaiKey = process.env.OPENAI_API_KEY || '';
      const geminiKey = process.env.GEMINI_API_KEY || '';

      res.json({
        openai: maskApiKey(openaiKey),
        gemini: maskApiKey(geminiKey),
        hasOpenai: !!openaiKey,
        hasGemini: !!geminiKey,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/settings/api-keys
 * Save API keys to .env file
 */
router.post(
  '/api-keys',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      // Validate request
      const { openaiKey, geminiKey } = saveApiKeysSchema.parse(req.body);

      // Get path to .env file
      const envPath = path.join(__dirname, '../../.env');

      // Read current .env file
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      // Update or add OPENAI_API_KEY
      if (openaiKey !== undefined) {
        if (envContent.includes('OPENAI_API_KEY=')) {
          // Replace existing
          envContent = envContent.replace(
            /OPENAI_API_KEY=.*/g,
            `OPENAI_API_KEY="${openaiKey}"`
          );
        } else {
          // Add new
          envContent += `\nOPENAI_API_KEY="${openaiKey}"`;
        }
        // Update process.env
        process.env.OPENAI_API_KEY = openaiKey;
      }

      // Update or add GEMINI_API_KEY
      if (geminiKey !== undefined) {
        if (envContent.includes('GEMINI_API_KEY=')) {
          // Replace existing
          envContent = envContent.replace(
            /GEMINI_API_KEY=.*/g,
            `GEMINI_API_KEY="${geminiKey}"`
          );
        } else {
          // Add new
          envContent += `\nGEMINI_API_KEY="${geminiKey}"`;
        }
        // Update process.env
        process.env.GEMINI_API_KEY = geminiKey;
      }

      // Remove comment lines for API keys
      envContent = envContent.replace(/# OPENAI_API_KEY=.*/g, '');
      envContent = envContent.replace(/# GEMINI_API_KEY=.*/g, '');

      // Write back to .env file
      fs.writeFileSync(envPath, envContent, 'utf-8');

      res.json({
        success: true,
        message: 'บันทึก API Keys สำเร็จ! Restart server เพื่อใช้งาน',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/settings/test-api-keys
 * Test API key connection
 */
router.post(
  '/test-api-keys',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      // Validate request
      const { provider, apiKey } = testApiKeySchema.parse(req.body);

      if (provider === 'openai') {
        // Test OpenAI API
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.ok) {
          res.json({
            success: true,
            message: 'OpenAI API key ถูกต้อง!',
          });
        } else {
          const errorData = await response.json();
          throw new AppError(
            400,
            `OpenAI API key ไม่ถูกต้อง: ${errorData.error?.message || 'Unknown error'}`
          );
        }
      } else if (provider === 'gemini') {
        // Test Gemini API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
        );

        if (response.ok) {
          res.json({
            success: true,
            message: 'Gemini API key ถูกต้อง!',
          });
        } else {
          const errorData = await response.json();
          throw new AppError(
            400,
            `Gemini API key ไม่ถูกต้อง: ${errorData.error?.message || 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError(500, 'เกิดข้อผิดพลาดในการทดสอบ API key'));
      }
    }
  }
);

export default router;
