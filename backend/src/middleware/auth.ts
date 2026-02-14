import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    teamId?: string;
    sessionId?: string;
}

export const authenticateTeam = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            teamId: string;
            sessionId: string;
        };

        req.teamId = decoded.teamId;
        req.sessionId = decoded.sessionId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Admin access denied.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            isAdmin: boolean;
        };

        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Insufficient privileges.' });
        }

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid admin token.' });
    }
};
