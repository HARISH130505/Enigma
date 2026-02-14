const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type ApiResponse<T = unknown> = T & {
    success?: boolean;
    error?: string;
};

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('enigma_token');
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('enigma_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('enigma_token');
        }
    }

    getToken(): string | null {
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
                cache: 'no-store', // Disable caching for all API requests
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Network error');
        }
    }

    // Auth endpoints
    async login(teamName: string, accessCode: string) {
        const response = await this.request<{
            token: string;
            team: { id: string; name: string };
            sessionId: string;
            isResuming: boolean;
        }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ teamName, accessCode }),
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async logout() {
        const response = await this.request('/auth/logout', { method: 'POST' });
        this.clearToken();
        return response;
    }

    async validateSession() {
        return this.request('/auth/session');
    }

    // Game endpoints
    async getProgress() {
        return this.request('/game/progress');
    }

    async getTimer() {
        return this.request<{
            serverTime: string;
            expiresAt: string;
            remainingMs: number;
            remainingSeconds: number;
            isPaused: boolean;
            isExpired: boolean;
        }>('/game/timer');
    }

    async getBriefing() {
        return this.request('/game/briefing');
    }

    // Round 1 endpoints
    async submitEvidence1(order: string[]) {
        return this.request('/round1/evidence/1', {
            method: 'POST',
            body: JSON.stringify({ order }),
        });
    }

    async submitEvidence2(selectedNode: string) {
        return this.request('/round1/evidence/2', {
            method: 'POST',
            body: JSON.stringify({ selectedNode }),
        });
    }

    async submitEvidence3(reason: string) {
        return this.request('/round1/evidence/3', {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    async submitEvidence4(choice: string) {
        return this.request('/round1/evidence/4', {
            method: 'POST',
            body: JSON.stringify({ choice }),
        });
    }

    async submitEscapeCode(code: string) {
        return this.request('/round1/escape-code', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }

    async getRound1Status() {
        return this.request('/round1/status');
    }

    // Round 2 endpoints (The Mischief Triathlon)
    async submitRound2Phase1(data: {
        indicesSum: number;
        conversionComplete: boolean;
        sortingComplete: boolean;
        gapIdentified: boolean;
    }) {
        return this.request('/round2/phase/1', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async submitRound2Phase2(data: {
        rowId: string;
        vowelCheckComplete: boolean;
        lengthMathCheckComplete: boolean;
    }) {
        return this.request('/round2/phase/2', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async submitRound2Phase3(data: {
        riddleAnswer: string;
        base64CleaningComplete: boolean;
        hexConversionComplete: boolean;
    }) {
        return this.request('/round2/phase/3', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async submitRound2Checkpoint(code: string) {
        return this.request('/round2/checkpoint', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }

    async getRound2Status() {
        return this.request('/round2/status');
    }

    // Round 3 endpoints (The Hexa Vault)
    async submitRound3Phase1(data: {
        filtered: boolean;
        decoded: boolean;
        keyword: string;
    }) {
        return this.request('/round3/phase/1', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async submitRound3Complete(code: string) {
        return this.request('/round3/complete', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    }

    async getRound3Status() {
        return this.request('/round3/status');
    }

    // Admin endpoints
    async adminLogin(username: string, password: string) {
        const response = await this.request<{ token: string }>('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async getTeams() {
        return this.request('/admin/teams');
    }

    async unlockTeamRound(teamId: string, round: number) {
        return this.request(`/admin/team/${teamId}/unlock`, {
            method: 'POST',
            body: JSON.stringify({ round }),
        });
    }

    async controlTimer(action: 'pause' | 'resume', teamId?: string) {
        return this.request('/admin/timer', {
            method: 'POST',
            body: JSON.stringify({ action, teamId }),
        });
    }

    async getDashboard() {
        return this.request('/admin/dashboard');
    }

    async exportResults() {
        const response = await fetch(`${this.baseUrl}/admin/export`, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        });
        return response;
    }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
