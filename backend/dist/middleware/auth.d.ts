import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    teamId?: string;
    sessionId?: string;
}
export declare const authenticateTeam: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authenticateAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map