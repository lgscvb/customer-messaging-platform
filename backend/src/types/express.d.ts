import { Express } from 'express-serve-static-core';
import { User } from '../models/User';

// 擴展 Express 的 Request 類型
declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}

// 擴展 Multer 的 File 類型
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination?: string;
      filename?: string;
      path?: string;
      buffer?: Buffer;
    }
  }
}