"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = exports.authenticateTeam = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateTeam = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.teamId = decoded.teamId;
        req.sessionId = decoded.sessionId;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
exports.authenticateTeam = authenticateTeam;
const authenticateAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Admin access denied.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Insufficient privileges.' });
        }
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid admin token.' });
    }
};
exports.authenticateAdmin = authenticateAdmin;
//# sourceMappingURL=auth.js.map